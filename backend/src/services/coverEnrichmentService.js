/**
 * coverEnrichmentService.js
 * 
 * DevSongs — Sistema Interno de Identificação, Busca e Correção Automática de Capas Musicais
 * 
 * Funcionalidades:
 * 1. Identificação interna: detecta faixas sem capa, com imagem padrão/placeholder, ou
 *    com possíveis capas incompatíveis (compartilhamento incorreto entre artistas).
 * 2. Busca multi-fonte confiável: consulta MusicBrainz / Cover Art Archive, Deezer API e iTunes Search API.
 * 3. Validação estrita de metadados: exige pontuação de confiança alta (>= 0.75) para título e artista,
 *    rejeitando correspondências ambíguas ou duvidosas para manter a integridade visual.
 * 4. Persistência e deduplicação: integra com Cloudinary quando configurado ou salva a URL HTTPS canônica,
 *    evitando duplicar uploads para faixas do mesmo álbum ou com a mesma capa já processada.
 * 5. Funcionamento 100% autônomo no backend: sem telas ou menus no Superadmin/Admin.
 */

const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const cloudinary = require('../config/cloudinary');

const DATA_DIR = path.join(__dirname, '../../data');
const TRACKS_FILE = path.join(DATA_DIR, 'company_tracks.json');
const ALBUMS_FILE = path.join(DATA_DIR, 'albums.json');
const PLAYLISTS_FILE = path.join(DATA_DIR, 'playlists.json');

// Cache em memória de capas já descobertas por chave de álbum/artista para evitar buscas e uploads duplicados
const albumCoverCache = new Map();

// Padrões de imagem padrão / placeholder conhecidos (incluindo assinaturas de fallback Deezer e compilações genéricas)
const DEFAULT_PLACEHOLDER_PATTERNS = [
  'logo-devsongs',
  'default_cover',
  'placeholder',
  'empty-cover',
  'music-placeholder',
  '/img/default',
  '42078a6ff6071ef28ba866bbf30fe357',
  'f9f60f6064f20ec719c83fa1091b5c4f',
  'd41d8cd98f00b204e9800998ecf8427e',
  '50cent.jpg',
  'b4618e8071852c93850ea9c7a233b2a2',
  'e3dd74dfebdfae5ad220ce690a6f8b1b',
  'f9e0787a4ddf82e8b625cf030b42774a',
  'f04a2c69a463214a25e06eefe6ad4dde'
];

/**
 * Lê arquivo JSON de forma segura com fallback
 */
function readJsonSafe(filePath, fallback = []) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.warn(`[CoverEnrichment] Erro ao ler ${filePath}:`, err.message);
    return fallback;
  }
}

/**
 * Escreve em arquivo JSON de forma atômica
 */
function writeJsonSafe(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`[CoverEnrichment] Erro ao gravar ${filePath}:`, err.message);
    return false;
  }
}

/**
 * Normaliza strings para comparação fonética e textual justa:
 * - Remove acentuações e diacríticos
 * - Remove extensões de arquivos (.wav, .mp3, etc.)
 * - Remove sufixos como (Ao Vivo), (Deluxe), [Remix], [Single], feat., etc.
 * - Converte para minúsculas e remove caracteres especiais
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  let str = text.trim().toLowerCase();

  // Remove extensões de arquivo
  str = str.replace(/\.(wav\d*|mp3|m4a|flac|aac|ogg)$/i, '');

  // Remove acentuação
  str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Remove parênteses e colchetes com descrições secundárias (ao vivo, deluxe, remix, etc.)
  str = str.replace(/\((ao vivo|live|deluxe|remix|acustico|clipe oficial|official video|audio oficial|single)\)/gi, '');
  str = str.replace(/\[(ao vivo|live|deluxe|remix|acustico|clipe oficial|official video|audio oficial|single)\]/gi, '');

  // Normaliza pontuações e múltiplos espaços
  str = str.replace(/[^a-z0-9\s]/g, ' ');
  str = str.replace(/\s+/g, ' ').trim();

  return str;
}

/**
 * Calcula a similaridade entre duas strings (Dice's Coefficient baseado em bigramas e tokens)
 * Retorna um valor entre 0.0 (totalmente diferente) e 1.0 (idêntico)
 */
function calculateSimilarity(str1, str2) {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);

  if (!s1 || !s2) return 0.0;
  if (s1 === s2) return 1.0;

  // Se uma string contém a outra e cobre mais de 70% do comprimento
  if (s1.includes(s2) || s2.includes(s1)) {
    const minLen = Math.min(s1.length, s2.length);
    const maxLen = Math.max(s1.length, s2.length);
    if (minLen / maxLen >= 0.70) {
      return 0.85 + (0.15 * (minLen / maxLen));
    }
  }

  // Token Overlap (Jaccard sobre palavras)
  const tokens1 = new Set(s1.split(' ').filter(Boolean));
  const tokens2 = new Set(s2.split(' ').filter(Boolean));
  if (tokens1.size === 0 || tokens2.size === 0) return 0.0;

  let intersection = 0;
  tokens1.forEach(t => {
    if (tokens2.has(t)) intersection++;
  });
  const union = new Set([...tokens1, ...tokens2]).size;
  const tokenJaccard = intersection / union;

  // Bigram similarity para capturar variações ortográficas
  const getBigrams = (str) => {
    const bigrams = new Set();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.substring(i, i + 2));
    }
    return bigrams;
  };

  const bg1 = getBigrams(s1);
  const bg2 = getBigrams(s2);
  let bgIntersection = 0;
  bg1.forEach(bg => {
    if (bg2.has(bg)) bgIntersection++;
  });
  const dice = (2 * bgIntersection) / (bg1.size + bg2.size || 1);

  return Math.max(tokenJaccard, dice);
}

/**
 * Verifica se uma URL de capa é um placeholder padrão
 */
function isDefaultOrPlaceholder(url) {
  if (!url || typeof url !== 'string') return true;
  const lower = url.toLowerCase();
  return DEFAULT_PLACEHOLDER_PATTERNS.some(pat => lower.includes(pat));
}

/**
 * 2. Identificação Interna de Problemas de Capa
 * Detecta:
 * - Músicas sem capa (missing)
 * - Músicas usando imagem padrão (default_image)
 * - Músicas com capas incompatíveis com seus metadados (incompatible_shared_artist)
 */
async function identifyCoverIssues(providedTracks = null) {
  let tracks = providedTracks;

  if (!tracks) {
    tracks = readJsonSafe(TRACKS_FILE, []);
  }

  const issues = [];
  const urlToArtistsMap = new Map();

  // Mapeia URLs para os artistas associados para detectar compartilhamentos impróprios
  tracks.forEach(track => {
    const url = track.cover_url || track.cover;
    if (url && !isDefaultOrPlaceholder(url)) {
      if (!urlToArtistsMap.has(url)) {
        urlToArtistsMap.set(url, new Set());
      }
      if (track.artist) {
        urlToArtistsMap.get(url).add(normalizeText(track.artist));
      }
    }
  });

  tracks.forEach(track => {
    const url = track.cover_url || track.cover;
    const normArtist = normalizeText(track.artist);

    // Caso A: Sem capa
    if (!url || url.trim() === '' || url === 'null') {
      issues.push({
        track,
        issueType: 'missing',
        reason: 'Faixa não possui capa cadastrada (URL nula ou vazia).'
      });
      return;
    }

    // Caso B: Capa padrão / placeholder
    if (isDefaultOrPlaceholder(url)) {
      issues.push({
        track,
        issueType: 'default_image',
        reason: 'Faixa utiliza imagem genérica ou logotipo padrão de placeholder.'
      });
      return;
    }

    // Caso C: Capa compartilhada por múltiplos artistas diferentes (possível imagem duplicada/incompatível)
    const associatedArtists = urlToArtistsMap.get(url);
    if (associatedArtists && associatedArtists.size > 1) {
      issues.push({
        track,
        issueType: 'incompatible_shared_artist',
        reason: `A imagem da capa está associada a múltiplos artistas distintos (${Array.from(associatedArtists).join(', ')}).`
      });
      return;
    }

    // Caso D: URL inválida ou não-HTTP
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      issues.push({
        track,
        issueType: 'invalid_url',
        reason: 'URL da capa possui formato ou protocolo inválido.'
      });
    }
  });

  return {
    totalTracks: tracks.length,
    issuesFound: issues.length,
    issues,
    summary: {
      missing: issues.filter(i => i.issueType === 'missing').length,
      defaultImage: issues.filter(i => i.issueType === 'default_image').length,
      incompatibleShared: issues.filter(i => i.issueType === 'incompatible_shared_artist').length,
      invalidUrl: issues.filter(i => i.issueType === 'invalid_url').length
    }
  };
}

/**
 * Valida a correspondência entre uma faixa original e um candidato de busca
 * Exige confiança alta em título E artista para autorizar atualização.
 */
function validateMatch(targetTrack, candidate) {
  const titleSim = calculateSimilarity(targetTrack.title, candidate.title);
  const artistSim = calculateSimilarity(targetTrack.artist, candidate.artist);
  
  let albumSim = 0.5;
  if (targetTrack.album && candidate.album) {
    albumSim = calculateSimilarity(targetTrack.album, candidate.album);
  }

  // Pontuação ponderada: Título (50%), Artista (40%), Álbum (10%)
  const weightedScore = (titleSim * 0.50) + (artistSim * 0.40) + (albumSim * 0.10);

  // Critérios estritos de aprovação:
  // 1. Título deve ter similaridade >= 0.70
  // 2. Artista deve ter similaridade >= 0.70
  // 3. Pontuação ponderada global deve ser >= 0.75
  const isValid = (titleSim >= 0.70 && artistSim >= 0.70 && weightedScore >= 0.75);

  return {
    isValid,
    confidence: Number(weightedScore.toFixed(3)),
    titleSimilarity: Number(titleSim.toFixed(3)),
    artistSimilarity: Number(artistSim.toFixed(3)),
    albumSimilarity: Number(albumSim.toFixed(3)),
    candidate
  };
}

/**
 * 3. Busca Multi-Fonte: MusicBrainz + Cover Art Archive
 */
async function searchMusicBrainz(targetTrack) {
  try {
    const cleanTitle = normalizeText(targetTrack.title);
    const cleanArtist = normalizeText(targetTrack.artist);
    if (!cleanTitle || !cleanArtist) return null;

    const query = `recording:"${cleanTitle}" AND artist:"${cleanArtist}"`;
    const url = `https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(query)}&fmt=json&limit=4`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'DevSongsBot/2.0 ( internal-covers@devsongs.com )',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    const recordings = data.recordings || [];

    for (const rec of recordings) {
      const recArtist = rec['artist-credit']?.[0]?.artist?.name || rec['artist-credit']?.[0]?.name || '';
      const recTitle = rec.title || '';
      const releases = rec.releases || [];

      for (const rel of releases) {
        if (!rel.id) continue;
        try {
          // Consulta o Cover Art Archive para o release MBID
          const caUrl = `https://coverartarchive.org/release/${rel.id}`;
          const caRes = await fetch(caUrl, {
            headers: { 'Accept': 'application/json' }
          });
          if (caRes.ok) {
            const caData = await caRes.json();
            const coverObj = (caData.images || []).find(img => img.front) || (caData.images || [])[0];
            if (coverObj && coverObj.image) {
              const secureCoverUrl = coverObj.image.replace(/^http:\/\//i, 'https://');
              const candidate = {
                title: recTitle,
                artist: recArtist,
                album: rel.title || '',
                cover_url: secureCoverUrl,
                provider: 'Cover Art Archive (MusicBrainz)'
              };

              const validation = validateMatch(targetTrack, candidate);
              if (validation.isValid) {
                return { ...candidate, ...validation };
              }
            }
          }
        } catch (_) {
          // Continua para o próximo release
        }
      }
    }
  } catch (err) {
    // Falha silenciosa de rede no MusicBrainz
  }
  return null;
}

/**
 * 3. Busca Multi-Fonte: Deezer API
 */
async function searchDeezer(targetTrack) {
  try {
    const query = `${targetTrack.artist} ${targetTrack.title}`.trim();
    const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=5`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    const results = data.data || [];

    for (const item of results) {
      const coverUrl = item.album?.cover_xl || item.album?.cover_big || item.album?.cover_medium;
      if (!coverUrl || isDefaultOrPlaceholder(coverUrl)) continue;

      const candidate = {
        title: item.title,
        artist: item.artist?.name || '',
        album: item.album?.title || '',
        cover_url: coverUrl.replace(/^http:\/\//i, 'https://'),
        provider: 'Deezer'
      };

      const validation = validateMatch(targetTrack, candidate);
      if (validation.isValid) {
        return { ...candidate, ...validation };
      }
    }
  } catch (err) {
    // Falha silenciosa de rede no Deezer
  }
  return null;
}

/**
 * 3. Busca Multi-Fonte: iTunes Search API
 */
async function searchItunes(targetTrack) {
  try {
    const query = `${targetTrack.artist} ${targetTrack.title}`.trim();
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    const results = data.results || [];

    for (const item of results) {
      if (!item.artworkUrl100 || isDefaultOrPlaceholder(item.artworkUrl100)) continue;
      // Converte imagem 100x100 para resolução de alta definição 600x600
      const hiResArtwork = item.artworkUrl100.replace('100x100bb', '600x600bb');

      const candidate = {
        title: item.trackName,
        artist: item.artistName,
        album: item.collectionName || '',
        cover_url: hiResArtwork.replace(/^http:\/\//i, 'https://'),
        provider: 'iTunes'
      };

      const validation = validateMatch(targetTrack, candidate);
      if (validation.isValid) {
        return { ...candidate, ...validation };
      }
    }
  } catch (err) {
    // Falha silenciosa de rede no iTunes
  }
  return null;
}

/**
 * Localiza a melhor capa consultando as fontes confiáveis em cascata (MusicBrainz -> Deezer -> iTunes)
 * Se não encontrar correspondência estrita, retorna null sem alterar nada.
 */
async function findBestCover(targetTrack) {
  // 1. Verifica cache local por chave de álbum e artista
  const cacheKey = `${normalizeText(targetTrack.artist)}|${normalizeText(targetTrack.album || targetTrack.title)}`;
  if (albumCoverCache.has(cacheKey)) {
    return albumCoverCache.get(cacheKey);
  }

  // 1.1 Se a música pertencer a um álbum cadastrado, utilizar a capa oficial desse álbum
  if (targetTrack.album_id || targetTrack.album) {
    const allAlbums = readJsonSafe(ALBUMS_FILE, []);
    const matchingAlbum = allAlbums.find(a => 
      (targetTrack.album_id && Number(a.id) === Number(targetTrack.album_id)) ||
      (targetTrack.album && normalizeText(a.title) === normalizeText(targetTrack.album) && normalizeText(a.artist_name || a.artist) === normalizeText(targetTrack.artist))
    );
    if (matchingAlbum && matchingAlbum.cover_url && !isDefaultOrPlaceholder(matchingAlbum.cover_url)) {
      const albMatch = {
        cover_url: matchingAlbum.cover_url,
        confidence: 0.98,
        provider: 'album_official',
        isValid: true
      };
      albumCoverCache.set(cacheKey, albMatch);
      return albMatch;
    }
  }

  // 2. Consulta Deezer (rápido e com capas em alta definição)
  const deezerMatch = await searchDeezer(targetTrack);
  if (deezerMatch && deezerMatch.isValid) {
    albumCoverCache.set(cacheKey, deezerMatch);
    return deezerMatch;
  }

  // 3. Consulta iTunes (ótima cobertura de faixas nacionais e internacionais)
  const itunesMatch = await searchItunes(targetTrack);
  if (itunesMatch && itunesMatch.isValid) {
    albumCoverCache.set(cacheKey, itunesMatch);
    return itunesMatch;
  }

  // 4. Consulta MusicBrainz & Cover Art Archive
  const mbMatch = await searchMusicBrainz(targetTrack);
  if (mbMatch && mbMatch.isValid) {
    albumCoverCache.set(cacheKey, mbMatch);
    return mbMatch;
  }

  // Se nenhuma fonte retornou correspondência com a confiança mínima exigida:
  return null;
}

/**
 * 5. Armazenamento e Persistência
 * Faz upload para o Cloudinary se configurado, ou mantém a URL HTTPS canônica de alta definição.
 */
async function persistCoverImage(imageUrl, trackId) {
  const hasCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY);

  if (hasCloudinary) {
    try {
      const uploadResult = await cloudinary.uploader.upload(imageUrl, {
        folder: 'devsongs/covers',
        public_id: `track_cover_${trackId}_${Date.now()}`,
        overwrite: true,
        resource_type: 'image'
      });
      return uploadResult.secure_url || imageUrl;
    } catch (err) {
      console.warn(`[CoverEnrichment] Falha no upload Cloudinary para faixa ${trackId}, utilizando URL direta:`, err.message);
    }
  }

  return imageUrl;
}

/**
 * Atualiza a capa de uma faixa no MySQL (se conectado) e nos arquivos JSON de catálogo e álbuns
 */
async function updateTrackCoverInStorage(trackId, newCoverUrl) {
  const tId = Number(trackId);

  // 1. Atualiza no MySQL se disponível
  try {
    const [rows] = await db.query('SELECT 1');
    if (rows) {
      await db.query('UPDATE company_tracks SET cover_url = ? WHERE id = ?', [newCoverUrl, tId]);
    }
  } catch (_) {
    // MySQL opcional/offline
  }

  // 2. Atualiza em company_tracks.json
  const tracks = readJsonSafe(TRACKS_FILE, []);
  const trackIdx = tracks.findIndex(t => Number(t.id) === tId);
  let updatedTrack = null;

  if (trackIdx !== -1) {
    tracks[trackIdx].cover_url = newCoverUrl;
    updatedTrack = tracks[trackIdx];
    writeJsonSafe(TRACKS_FILE, tracks);
  }

  // 3. Atualiza capa do álbum em albums.json se aplicável
  if (updatedTrack && updatedTrack.album) {
    const albums = readJsonSafe(ALBUMS_FILE, []);
    const albumNorm = normalizeText(updatedTrack.album);
    let albumUpdated = false;

    albums.forEach(alb => {
      if (normalizeText(alb.title) === albumNorm) {
        if (!alb.cover_url || isDefaultOrPlaceholder(alb.cover_url)) {
          alb.cover_url = newCoverUrl;
          albumUpdated = true;
        }
      }
    });

    if (albumUpdated) {
      writeJsonSafe(ALBUMS_FILE, albums);
    }
  }

  return updatedTrack;
}

/**
 * Enriquece e corrige a capa de uma faixa específica
 */
async function enrichTrackCover(trackId) {
  const tId = Number(trackId);
  const tracks = readJsonSafe(TRACKS_FILE, []);
  const track = tracks.find(t => Number(t.id) === tId);

  if (!track) {
    return { success: false, reason: 'Música não encontrada.' };
  }

  const match = await findBestCover(track);
  if (!match || !match.isValid) {
    return {
      success: false,
      reason: 'Nenhuma fonte confiável retornou correspondência estrita. Capa original ou padrão preservada.',
      trackId: tId
    };
  }

  const finalCoverUrl = await persistCoverImage(match.cover_url, tId);
  const updatedTrack = await updateTrackCoverInStorage(tId, finalCoverUrl);

  return {
    success: true,
    trackId: tId,
    title: track.title,
    artist: track.artist,
    cover_url: finalCoverUrl,
    provider: match.provider,
    confidence: match.confidence,
    track: updatedTrack
  };
}

/**
 * 4. Processo Interno de Correção Automática em Lote
 * Executa em background sem qualquer dependência de painel administrativo.
 */
async function runInternalCoverEnrichment(options = {}) {
  const { force = false, verbose = true } = options;
  if (verbose) console.log('[CoverEnrichment] Iniciando verificação interna de capas...');

  const { issues, totalTracks, summary } = await identifyCoverIssues();

  if (verbose) {
    console.log(`[CoverEnrichment] Total de faixas: ${totalTracks} | Problemas detectados: ${issues.length} (Sem capa: ${summary.missing}, Padrão: ${summary.defaultImage}, Incompatíveis: ${summary.incompatibleShared})`);
  }

  if (issues.length === 0 && !force) {
    if (verbose) console.log('[CoverEnrichment] Todas as capas já estão válidas e consistentes.');
    return { processed: 0, updated: 0, retained: 0 };
  }

  let updatedCount = 0;
  let retainedCount = 0;
  const results = [];

  for (const item of issues) {
    const track = item.track;
    try {
      const match = await findBestCover(track);
      if (match && match.isValid) {
        const finalUrl = await persistCoverImage(match.cover_url, track.id);
        await updateTrackCoverInStorage(track.id, finalUrl);
        updatedCount++;
        results.push({
          trackId: track.id,
          title: track.title,
          status: 'updated',
          cover_url: finalUrl,
          provider: match.provider,
          confidence: match.confidence
        });
        if (verbose) {
          console.log(`[CoverEnrichment] Capa atualizada para [${track.title} - ${track.artist}]: ${match.provider} (${match.confidence * 100}%)`);
        }
      } else {
        retainedCount++;
        results.push({
          trackId: track.id,
          title: track.title,
          status: 'retained',
          reason: 'Sem correspondência estrita garantida'
        });
      }
    } catch (err) {
      retainedCount++;
      console.warn(`[CoverEnrichment] Erro ao processar faixa ${track.id}:`, err.message);
    }

    // Pequeno intervalo de cortesia entre requisições externas para respeitar rate-limits
    await new Promise(r => setTimeout(r, 200));
  }

  if (verbose) {
    console.log(`[CoverEnrichment] Concluído: ${updatedCount} atualizadas, ${retainedCount} preservadas com segurança.`);
  }

  return {
    totalProcessed: issues.length,
    updated: updatedCount,
    retained: retainedCount,
    results
  };
}

module.exports = {
  identifyCoverIssues,
  findBestCover,
  validateMatch,
  calculateSimilarity,
  normalizeText,
  enrichTrackCover,
  runInternalCoverEnrichment,
  updateTrackCoverInStorage
};

