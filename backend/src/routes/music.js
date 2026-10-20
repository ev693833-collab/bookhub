const express = require('express');
const router = express.Router();

// Caches em memória de alta performance para resposta instantânea (0ms)
const searchCache = new Map();
const artistTopCache = new Map();
const artistProfileCache = new Map();

// Helper para requisições externas com timeout seguro que nunca travam a resposta
async function fetchWithTimeout(url, options = {}, timeoutMs = 2500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Contador de reproduções para estilo YouTube Music
const generatePlaysCount = (idx) => {
  const counts = [
    'Tocou 4,8 mi vezes',
    'Tocou 2,0 mi vezes',
    'Tocou 2,3 mi vezes',
    'Tocou 1,9 mi vezes',
    'Tocou 2,6 mi vezes',
    'Tocou 2,8 mi vezes',
    'Tocou 1,1 mi vezes',
    'Tocou 1,7 mi vezes',
    'Tocou 890 mil vezes',
    'Tocou 740 mil vezes',
    'Tocou 680 mil vezes',
    'Tocou 590 mil vezes'
  ];
  return counts[idx % counts.length];
};

const cleanStr = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
const cleanSimple = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['"`.,\s]/g, '');

function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

const isBootlegPattern = /\b(mtg|montagem|slowed|sped\s*up|speed\s*up|reverb|bass\s*boosted|nightcore|tributo|tribute|karaoke|instrumental|8d\s*audio|remix\s*funk|funk\s*remix|mega\s*mix|megamix|mega\s*funk|piseiro\s*remix|trap\s*remix|dano\s*sarrada|tropa|braba|anti\s*oruam|dono da favela)\b|^mtg\b|[\(\[]\s*mtg\b/i;

function isBootlegTrack(title, artist) {
  if (!title) return false;
  if (isBootlegPattern.test(title)) return true;
  if (artist && isBootlegPattern.test(artist)) return true;
  return false;
}

function matchArtistName(query, artistName) {
  if (!query || !artistName) return false;
  const qClean = cleanSimple(query);
  const aClean = cleanSimple(artistName);
  if (!qClean || !aClean) return false;
  if (qClean === aClean) return true;

  const qTokens = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const aTokens = artistName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);

  if (qTokens.length === 0 || aTokens.length === 0) return false;

  // Se a query tiver apenas 1 palavra (ex: "Japa", "BK", "Orochi"), só casa se for palavra inteira exata
  if (qTokens.length === 1) {
    const singleQ = qTokens[0];
    return aTokens.includes(singleQ);
  }

  // Se tiver múltiplas palavras (ex: "Ryu, the Runner" vs "Ryu the Runner")
  const allExactTokensMatch = qTokens.every(qTok => aTokens.includes(qTok));
  if (allExactTokensMatch) return true;

  // Levenshtein apenas para palavras longas (>= 7 chars) com tolerância de 1 erro
  if (qClean.length >= 7 && aClean.length >= 7 && levenshtein(qClean, aClean) <= 1) {
    return true;
  }
  return false;
}

function stripMC(s) {
  return cleanSimple(s).replace(/^mc/, '');
}

function isValidArtistPicture(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.includes('/images/artist//') || url.includes('/default') || url.endsWith('/')) return false;
  return true;
}

function getArtistPhoto(artist, queryName) {
  const qClean = cleanSimple(queryName || (artist && artist.name));
  // Imagens oficiais HD com prioridade para artistas icônicos
  if (qClean === 'bk') {
    return '/img/bk_avatar.png';
  }
  if (qClean === 'justinbieber') {
    return '/img/justin_my_world.jpg';
  }
  if (artist) {
    const pic = artist.picture_xl || artist.picture_big || artist.picture_medium || artist.picture_small;
    if (isValidArtistPicture(pic)) return pic;
  }
  return null;
}

function getArtistBannerPosition(artistName) {
  const clean = cleanSimple(artistName);
  if (clean === 'bk') return 'center top';
  if (clean === 'dfideliz') return 'center 50%';
  if (clean === 'justinbieber') return 'center 30%';
  if (clean.includes('baco')) return 'center 16%';
  return 'center 18%';
}

function pickBestArtistCandidate(candidates, query) {
  if (!candidates || candidates.length === 0) return null;
  const qClean = cleanSimple(query);
  const qNoMC = stripMC(query);

  const scored = candidates.map(a => {
    const aClean = cleanSimple(a.name);
    const aNoMC = stripMC(a.name);
    const fans = a.nb_fan || 0;

    let matchLevel = 0;
    if (aClean === qClean) {
      matchLevel = 4; // correspondência exata de nome
    } else if (aNoMC === qNoMC) {
      matchLevel = 4; // correspondência exata ignorando prefixo MC (ex: Cabelinho == MC Cabelinho)
    } else if (aNoMC.startsWith(qNoMC) || qNoMC.startsWith(aNoMC)) {
      matchLevel = 3; // correspondência de raiz (ex: Poze -> Mc Poze do Rodo)
    } else if (matchArtistName(query, a.name)) {
      matchLevel = 2;
    } else {
      matchLevel = 1;
    }

    // Penalidade para colabs coletivas que vazam em buscas de artistas individuais
    const isCollab = !query.includes('&') && !query.includes(',') &&
      (a.name.includes('feat') || a.name.includes('featuring') || a.name.includes('&') || a.name.includes(','));
    if (isCollab) matchLevel -= 2;

    // Penalidade se a conta não tiver imagem de perfil válida
    const pic = a.picture_xl || a.picture_big || a.picture_medium;
    if (!isValidArtistPicture(pic)) matchLevel -= 1;

    let score = matchLevel * 10000000;
    if (fans >= 50000) {
      score += fans;
    } else {
      score += fans / 10;
    }

    return { ...a, matchLevel, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}

/**
 * GET /api/music/artist?q={nome}&artistId={id}
 * Busca o perfil OFICIAL do artista, sua foto HD, top músicas e discografia sem imagens quebradas.
 */
router.get('/artist', async (req, res) => {
  const { q, artistId } = req.query;
  if (!q && !artistId) {
    return res.status(400).json({ error: 'Parâmetro "q" ou "artistId" é obrigatório.' });
  }

  const rawArtistId = artistId ? String(artistId).replace('dz-artist-', '').replace('it-artist-', '') : '';
  const cleanQ = (q || '').toLowerCase().trim();
  const cacheKey = rawArtistId ? `id:${rawArtistId}` : cleanQ;
  if (artistProfileCache.has(cacheKey)) {
    return res.json(artistProfileCache.get(cacheKey));
  }

  try {
    const primaryName = (q || '').split(/[,&]|\s+e\s+|\s+feat\.?\s+|\s+part\.?\s+/i)[0].trim();
    const isInvalidArtistPattern = /(cover|tribute|tributo|karaoke|banda\b|band\b|made famous|instrumental|piano|orchestra)/i;

    let bestArtist = null;

    // 1. Se recebemos o ID verificado do Deezer (ex: 5438141 para JAPA), busca diretamente o perfil oficial
    if (rawArtistId && !isNaN(rawArtistId)) {
      try {
        const directArtistRes = await fetchWithTimeout(`https://api.deezer.com/artist/${rawArtistId}`, {}, 3000)
          .then(r => r.json())
          .catch(() => null);
        if (directArtistRes && directArtistRes.id && !directArtistRes.error) {
          bestArtist = directArtistRes;
        }
      } catch (_) {}
    }

    // 2. Se não encontrou por ID direto, busca no catálogo do Deezer por nome
    if (!bestArtist) {
      let artistRes = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(q || '')}&limit=30`);
      let artistJson = await artistRes.json();

      if ((!artistJson.data || artistJson.data.length === 0) && primaryName && primaryName !== q) {
        artistRes = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(primaryName)}&limit=30`);
        artistJson = await artistRes.json();
      }

      if (artistJson.data && artistJson.data.length > 0) {
        const validArtists = artistJson.data.filter(a => !isInvalidArtistPattern.test(a.name));
        const pool = validArtists.length > 0 ? validArtists : artistJson.data;
        bestArtist = pickBestArtistCandidate(pool, primaryName || q);
      }
    }

    if (bestArtist) {
      // 2. Busca álbuns e top faixas ESTRITAMENTE do perfil oficial verificado do artista.
      // NUNCA buscar álbuns de contas homônimas (ex: DJ BK do UK com 66 fãs ou Orochi metal do Japão),
      // pois isso vazava álbuns não pertencentes ao cantor.
      const topPromises = [
        fetch(`https://api.deezer.com/artist/${bestArtist.id}/top?limit=50`).then(r => r.json()).then(res => res.data || []).catch(() => [])
      ];
      const albPromises = [
        fetch(`https://api.deezer.com/artist/${bestArtist.id}/albums?limit=100`).then(r => r.json()).then(res => res.data || []).catch(() => [])
      ];
      const directSearchPromise = fetch(`https://api.deezer.com/search?q=${encodeURIComponent(bestArtist.name)}&limit=100`)
        .then(r => r.json()).then(res => res.data || []).catch(() => []);
      const directSearchQPromise = (q !== bestArtist.name)
        ? fetch(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=50`).then(r => r.json()).then(res => res.data || []).catch(() => [])
        : Promise.resolve([]);
      const itunesAlbumsPromise = fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(bestArtist.name)}&entity=album&limit=50&country=BR`)
        .then(r => r.json()).catch(() => ({ results: [] }));

      const [topLists, albLists, directTracks, directQTracks, itunesAlbumsRes] = await Promise.all([
        Promise.all(topPromises),
        Promise.all(albPromises),
        directSearchPromise,
        directSearchQPromise,
        itunesAlbumsPromise
      ]);

      const fans = bestArtist.nb_fan || 500000;
      const listenersStr = fans >= 1000000
        ? `${(fans / 1000000).toFixed(1).replace('.', ',')} mi ouvintes mensais`
        : (fans >= 1000 ? `${Math.round(fans / 1000)} mil ouvintes mensais` : `${fans} ouvintes mensais`);
      const subsStr = fans >= 1000000
        ? `${(fans / 1000000).toFixed(1).replace('.', ',')} mi`
        : (fans >= 1000 ? `${Math.round(fans / 1000)} mil` : `${fans}`);

      const isBk = cleanSimple(bestArtist.name) === 'bk' || cleanSimple(q) === 'bk';
      const avatarPhoto = getArtistPhoto(bestArtist, q) || bestArtist.picture_xl || bestArtist.picture_big;
      const artistObj = {
        id: `dz-artist-${bestArtist.id}`,
        name: isBk ? 'BK' : bestArtist.name,
        avatarImg: avatarPhoto,
        bannerImg: isBk ? '/img/bk_banner.jpg' : avatarPhoto,
        bannerPosition: getArtistBannerPosition(bestArtist.name),
        listeners: listenersStr,
        subscribers: subsStr,
        bio: isBk
          ? "Uma das vozes mais contundentes dentro do rap nacional, Abebe Bikila, mais conhecido como BK', é um rapper carioca que carrega em suas rimas as vivências de um corpo negro dentro das grandes metrópoles."
          : `${bestArtist.name} é um dos artistas mais ouvidos do momento, acumulando milhares de reproduções e fãs por todo o país.`
      };

      // Unifica e deduplica faixas de todas as contas e da busca direta do artista
      const seenTrackIds = new Set();
      const seenTrackTitles = new Set();
      const tracksToMap = [];

      const addTrack = (t) => {
        if (!t || seenTrackIds.has(t.id)) return;
        if (isBootlegTrack(t.title, t.artist?.name)) return;
        const norm = cleanSimple(t.title);
        if (seenTrackTitles.has(norm)) return;
        seenTrackIds.add(t.id);
        seenTrackTitles.add(norm);
        tracksToMap.push(t);
      };

      for (const list of topLists) {
        for (const t of list) {
          if (!t) continue;
          if (isBootlegTrack(t.title, t.artist?.name)) continue;
          const isSelfArtist = cleanSimple(t.artist?.name) === cleanSimple(bestArtist.name);
          const hasFeatCredit = t.title?.toLowerCase().includes(bestArtist.name.toLowerCase());
          if (isSelfArtist || hasFeatCredit) {
            addTrack(t);
          }
        }
      }
      for (const t of [...directTracks, ...directQTracks]) {
        if (!t.artist) continue;
        if (isBootlegTrack(t.title, t.artist?.name)) continue;
        const matchesMain = matchArtistName(t.artist.name, bestArtist.name) || matchArtistName(bestArtist.name, t.artist.name);
        if (matchesMain) addTrack(t);
      }

      // Prioriza faixas onde o próprio artista é o cantor principal
      const ownTracks = tracksToMap.filter(t => cleanSimple(t.artist?.name) === cleanSimple(bestArtist.name));
      const otherTracks = tracksToMap.filter(t => cleanSimple(t.artist?.name) !== cleanSimple(bestArtist.name));
      const sortedTracksToMap = ownTracks.length >= 5 ? ownTracks : [...ownTracks, ...otherTracks];

      const mappedTracks = sortedTracksToMap.map((t, idx) => {
        const dur = t.duration || 210;
        const min = Math.floor(dur / 60);
        const sec = dur % 60;
        const trackArtist = cleanSimple(t.artist?.name) === cleanSimple(bestArtist.name) 
          ? bestArtist.name 
          : (t.artist?.name ? `${bestArtist.name}, ${t.artist.name}` : bestArtist.name);

        return {
          id: `dz-track-${t.id}`,
          title: t.title,
          artist: trackArtist,
          album: t.album?.title || 'Single',
          cover: t.album?.cover_big || t.album?.cover_medium || bestArtist.picture_big,
          preview: t.preview,
          durationSec: dur,
          duration: `${min}:${String(sec).padStart(2, '0')}`,
          plays: generatePlaysCount(idx),
          explicit: t.explicit_lyrics || false,
          priceSale: 'R$ 2,90',
          priceRent: 'R$ 0,99',
          availableForSale: true,
          availableForRent: true
        };
      });

      const seenTitles = new Set();
      const seenAppearsTitles = new Set();
      const singlesEps = [];
      const appearsOn = [];
      const canonicalAlbumsMap = new Map();

      // Top tracks do artista em formato limpo para detectar singles/remix de faixas famosas
      const topTrackTitles = mappedTracks.map(t => cleanStr(t.title));

      function getRootAlbumTitle(title) {
        return cleanStr(title)
          .replace(/['"`]/g, '')
          .replace(/\([^)]*(deluxe|edition|version|clean|edited|anniversary|bonus|complete|expanded|special|international|explicit|remastered|track by track|acoustic collection)[^)]*\)/gi, '')
          .replace(/\[[^\]]*(deluxe|edition|version|clean|edited|anniversary|bonus|complete|expanded|special|international|explicit|remastered|track by track|acoustic collection)[^\]]*\]/gi, '')
          .replace(/(:| - | – | — )\s*(expanded|deluxe|complete|bonus|anniversary|special|reloaded|the complete|track by track).*$/gi, '')
          .replace(/\b\d+th anniversary\b/gi, '')
          .replace(/\b(deluxe|bonus|expanded|complete|anniversary|standard)\s+edition\b/gi, '')
          .replace(/\b(clean|edited)\s+version\b/gi, '')
          .replace(/-(single|ep)/gi, '')
          .replace(/[-–—_:]/g, ' ')
          .replace(/[()[\]{}]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }

      function getEditionPriority(title) {
        const t = (title || '').toLowerCase();
        if (/edited|clean/i.test(t)) return 0; // Menor prioridade: versão censurada
        if (/deluxe|reloaded|expanded|complete|anniversary|bonus track/i.test(t)) return 2; // Maior prioridade: versão definitiva com bônus
        return 1; // Versão padrão
      }

      function isSingleOrRemixPack(title, recordType) {
        if (recordType === 'single' || recordType === 'ep') return true;
        if (/single|ep|\(remix|\bremixes\b|\bremixed\b|\bthe remixes\b|\bdance remix\b|\ba cappellas\b|\binstrumentals\b|\b2 trk\b|\b2-track\b/i.test(title)) return true;
        
        // Se o título do 'álbum' for idêntico ao título de uma faixa que pertence comprovadamente a outro álbum de estúdio,
        // trata-se de um single/remix daquela faixa (ex: 'S&M' é uma faixa do álbum de estúdio 'Loud')
        const cleanT = cleanStr(title);
        const isSongFromOtherAlbum = mappedTracks.some(t => {
          const cleanTrackTitle = cleanStr(t.title);
          const cleanTrackAlbum = cleanStr(typeof t.album === 'object' ? t.album?.title : t.album);
          return cleanTrackTitle === cleanT && cleanTrackAlbum && cleanTrackAlbum !== cleanT;
        });
        if (isSongFromOtherAlbum) return true;

        return false;
      }

      function isSoundtrackOrVarious(title) {
        return /soundtrack|motion picture|music from and inspired by|various artists|coletânea|\bsessions\b|def jam sessions/i.test(title);
      }

      function registerAlbumItem(item, recordType) {
        const title = item.title;
        if (isBootlegTrack(title, item.artist)) return;

        // 1. Trilhas sonoras e coletâneas vão para 'Aparece Em'
        if (isSoundtrackOrVarious(title)) {
          const norm = cleanStr(title);
          if (!seenAppearsTitles.has(norm)) {
            seenAppearsTitles.add(norm);
            appearsOn.push({
              ...item,
              id: item.id.replace('dz-alb-', 'dz-feat-'),
              isParticipation: true
            });
          }
          return;
        }

        // 2. Singles, EPs e Pacotes de Remix vão para 'Singles e EPs'
        if (isSingleOrRemixPack(title, recordType)) {
          const norm = cleanStr(title);
          if (!seenTitles.has(norm)) {
            seenTitles.add(norm);
            singlesEps.push({
              ...item,
              priceSale: 'R$ 4,90',
              priceRent: 'R$ 1,90'
            });
          }
          return;
        }

        // 3. Álbuns de estúdio: Deduplicação Canônica Inteligente
        // Agrupa versões Standard, Clean e Deluxe sob o mesmo título raiz, mantendo a melhor versão (Deluxe)
        const rootTitle = getRootAlbumTitle(title);
        const priority = getEditionPriority(title);

        if (!canonicalAlbumsMap.has(rootTitle)) {
          canonicalAlbumsMap.set(rootTitle, { item, priority });
        } else {
          const existing = canonicalAlbumsMap.get(rootTitle);
          // Substitui apenas se a nova edição for melhor (ex: Deluxe substituindo Standard ou Edited)
          if (priority > existing.priority) {
            canonicalAlbumsMap.set(rootTitle, { item, priority });
          }
        }
      }

      // 1. Álbuns e Singles oficiais Deezer
      for (const list of albLists) {
        for (const alb of list) {
          registerAlbumItem({
            id: `dz-alb-${alb.id}`,
            albumId: alb.id,
            title: alb.title,
            year: alb.release_date ? alb.release_date.slice(0, 4) : '2024',
            cover: alb.cover_big || alb.cover_medium,
            artist: bestArtist.name,
            explicit: alb.explicit_lyrics || false,
            priceSale: 'R$ 29,90',
            priceRent: 'R$ 9,90',
            availableForSale: true,
            availableForRent: true
          }, alb.record_type);
        }
      }

      // 2. Separa álbuns de terceiros onde o artista participa (Aparece em / Feat)
      const isAsianScript = /[一-龠ぁ-ゔァ-ヴー\u4e00-\u9fa5]/;

      for (const t of tracksToMap) {
        if (t.album && t.album.title && t.album.id) {
          if (isAsianScript.test(t.album.title)) continue;
          if (isBootlegTrack(t.album.title, t.artist?.name)) continue;
          const trackArtistName = t.artist?.name || '';
          const isMainArtist = cleanSimple(trackArtistName) === cleanSimple(bestArtist.name);

          // Se for de outro artista (feat/participação), registra em 'Aparece Em'
          if (!isMainArtist) {
            const norm = cleanStr(t.album.title).replace(/-(single|ep)/g, '').trim();
            if (!seenTitles.has(norm) && !seenAppearsTitles.has(norm)) {
              seenAppearsTitles.add(norm);
              appearsOn.push({
                id: `dz-feat-${t.album.id}`,
                albumId: t.album.id,
                title: t.album.title,
                year: '2024',
                cover: t.album.cover_big || t.album.cover_medium || bestArtist.picture_big,
                artist: trackArtistName || 'Vários Artistas',
                albumArtist: trackArtistName || 'Vários Artistas',
                explicit: false,
                isParticipation: true,
                priceSale: 'R$ 29,90',
                priceRent: 'R$ 9,90',
                availableForSale: true,
                availableForRent: true
              });
            }
          }
        }
      }

      // 3. Mescla com iTunes com validação estrita
      const bestArtistClean = cleanSimple(bestArtist.name);

      (itunesAlbumsRes.results || []).forEach((alb) => {
        if (!alb.collectionName) return;
        if (isAsianScript.test(alb.collectionName)) return;
        if (isBootlegTrack(alb.collectionName, alb.artistName)) return;
        const albArtistClean = cleanSimple(alb.artistName);
        const isStrictArtistMatch = albArtistClean === bestArtistClean || 
                                    albArtistClean.startsWith(bestArtistClean + '&') || 
                                    albArtistClean.startsWith(bestArtistClean + 'e') ||
                                    albArtistClean.startsWith(bestArtistClean + ',');

        if (!isStrictArtistMatch) return;
        if (isBootlegPattern.test(alb.collectionName)) return;

        registerAlbumItem({
          id: `it-alb-${alb.collectionId}`,
          albumId: null,
          title: alb.collectionName.replace(/ - (Single|EP)$/i, ''),
          year: alb.releaseDate ? alb.releaseDate.slice(0, 4) : '2024',
          cover: alb.artworkUrl100?.replace('100x100bb', '600x600bb') || '',
          artist: bestArtist.name,
          explicit: alb.collectionExplicitness === 'explicit',
          priceSale: 'R$ 29,90',
          priceRent: 'R$ 9,90',
          availableForSale: true,
          availableForRent: true
        }, (alb.collectionName.toLowerCase().includes('single') || alb.collectionName.toLowerCase().includes('ep')) ? 'single' : 'album');
      });

      // Extrai os álbuns únicos e ordena cronologicamente (mais novos primeiro)
      const fullAlbums = Array.from(canonicalAlbumsMap.values())
        .map(v => v.item)
        .sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));

      const artistResult = {
        artist: artistObj,
        tracks: mappedTracks,
        albums: fullAlbums,
        singles: singlesEps,
        appearsOn: appearsOn
      };
      artistProfileCache.clear(); // Limpa cache antigo para atualizar imediatamente
      artistProfileCache.set(cleanQ, artistResult);
      return res.json(artistResult);
    }

    // 2. Fallback caso o artista não exista no Deezer: busca no iTunes Brasil
    const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=50&country=BR`);
    const itunesData = await itunesRes.json();

    if (itunesData.results && itunesData.results.length > 0) {
      const detectedArtist = itunesData.results[0].artistName;
      const detectedCover = itunesData.results[0].artworkUrl100?.replace('100x100bb', '600x600bb') || '';

      const artistClean = cleanSimple(detectedArtist);
      const matchingItems = itunesData.results.filter(item => {
        const itemArtistClean = cleanSimple(item.artistName);
        return itemArtistClean.includes(artistClean) || artistClean.includes(itemArtistClean);
      });

      const mapped = (matchingItems.length > 0 ? matchingItems : itunesData.results.slice(0, 5)).map((item, idx) => {
        const durationSeconds = Math.round((item.trackTimeMillis || 210000) / 1000);
        const minutes = Math.floor(durationSeconds / 60);
        const seconds = durationSeconds % 60;
        return {
          id: `track-${item.trackId || idx}`,
          title: item.trackName,
          artist: item.artistName,
          album: item.collectionName || 'Single',
          cover: item.artworkUrl100?.replace('100x100bb', '600x600bb') || '',
          preview: item.previewUrl,
          durationSec: durationSeconds,
          duration: `${minutes}:${String(seconds).padStart(2, '0')}`,
          plays: generatePlaysCount(idx),
          explicit: item.trackExplicitness === 'explicit'
        };
      });

      return res.json({
        artist: {
          id: 'artist-' + detectedArtist.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: detectedArtist,
          listeners: '5,8 mi ouvintes mensais',
          bio: `${detectedArtist} é um artista de destaque no cenário musical.`,
          bannerImg: detectedCover,
          avatarImg: detectedCover,
          subscribers: '2,4 mi'
        },
        tracks: mapped,
        albums: [],
        singles: []
      });
    }

    return res.json({
      artist: {
        id: 'artist-unknown',
        name: q,
        listeners: '0 ouvintes',
        bio: `Nenhum resultado encontrado para "${q}".`,
        bannerImg: '/img/artist_banner_justin.jpg',
        avatarImg: '/img/artist_banner_justin.jpg',
        subscribers: '0'
      },
      tracks: [],
      albums: [],
      singles: []
    });
  } catch (err) {
    console.error('Erro na rota /api/music/artist:', err);
    return res.status(500).json({ error: 'Erro ao buscar artista' });
  }
});

/**
 * GET /api/music/search?q={query}
 * Busca faixas e entidades para autocomplete e resultados gerais de pesquisa.
 */
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Parâmetro "q" é obrigatório.' });
  }

  const cleanQ = (q || '').toLowerCase().trim();
  if (searchCache.has(cleanQ)) {
    return res.json(searchCache.get(cleanQ));
  }

  try {
    const cleanStr = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const cleanSimple = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['"`.,\s]/g, '');
    const qClean = cleanSimple(q);

    let artistObj = null;
    let allArtists = [];

    const [tracksRes, artistRes] = await Promise.all([
      fetchWithTimeout(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=30`, {}, 4000)
        .then(r => r.json())
        .catch(() => ({ data: [] })),
      fetchWithTimeout(`https://api.deezer.com/search/artist?q=${encodeURIComponent(q)}&limit=30`, {}, 4000)
        .then(r => r.json())
        .catch(() => ({ data: [] }))
    ]);

    if (artistRes.data && artistRes.data.length > 0) {
      const bestCandidate = pickBestArtistCandidate(artistRes.data, q);
      if (bestCandidate) {
        const fans = bestCandidate.nb_fan || 500000;
        const listenersStr = fans >= 1000000
          ? `${(fans / 1000000).toFixed(1).replace('.', ',')} mi ouvintes mensais`
          : (fans >= 1000 ? `${Math.round(fans / 1000)} mil ouvintes mensais` : `${fans} ouvintes mensais`);
        const subsStr = fans >= 1000000
          ? `${(fans / 1000000).toFixed(1).replace('.', ',')} mi`
          : (fans >= 1000 ? `${Math.round(fans / 1000)} mil` : `${fans}`);

        const isBk = cleanSimple(bestCandidate.name) === 'bk' || cleanSimple(q) === 'bk';
        const avatarPhoto = getArtistPhoto(bestCandidate, q) || bestCandidate.picture_xl || bestCandidate.picture_big;
        artistObj = {
          id: `dz-artist-${bestCandidate.id}`,
          name: isBk ? 'BK' : bestCandidate.name,
          fansCount: fans,
          avatarImg: avatarPhoto,
          bannerImg: isBk ? '/img/bk_banner.jpg' : avatarPhoto,
          bannerPosition: getArtistBannerPosition(bestCandidate.name),
          listeners: listenersStr,
          subscribers: subsStr,
          bio: isBk
            ? "Uma das vozes mais contundentes dentro do rap nacional, Abebe Bikila, mais conhecido como BK', é um rapper carioca que carrega em suas rimas as vivências de um corpo negro dentro das grandes metrópoles."
            : `${bestCandidate.name} é um dos artistas mais ouvidos do momento.`
        };
      }

      // Prepara lista ordenada por relevância e fãs para a aba 'Artistas'
      const sortedPool = [...artistRes.data].sort((a, b) => (b.nb_fan || 0) - (a.nb_fan || 0));
      allArtists = sortedPool.slice(0, 8).map(a => {
        const fans = a.nb_fan || 5000;
        const avatarPhoto = getArtistPhoto(a, a.name) || a.picture_xl || a.picture_big || a.picture_medium;
        return {
          id: `dz-artist-${a.id}`,
          name: (cleanSimple(a.name) === 'bk' && cleanSimple(q) === 'bk') ? 'BK' : a.name,
          avatarImg: avatarPhoto,
          bannerImg: avatarPhoto,
          listeners: fans >= 1000000 ? `${(fans / 1000000).toFixed(1).replace('.', ',')} mi ouvintes mensais` : (fans >= 1000 ? `${Math.round(fans / 1000)} mil ouvintes mensais` : `${fans} ouvintes mensais`),
          subscribers: fans >= 1000000 ? `${(fans / 1000000).toFixed(1).replace('.', ',')} mi` : (fans >= 1000 ? `${Math.round(fans / 1000)} mil` : `${fans}`),
          bio: `${a.name} é um artista do cenário musical.`
        };
      });
    }

    // Se a busca contiver o nome do artista junto com a música (ex: "Bk amém amém" ou "matue anos luz"),
    // e artistRes não encontrou o perfil direto com fãs suficientes:
    if ((!artistObj || (artistObj.fansCount || 0) < 5000) && tracksRes.data && tracksRes.data.length > 0) {
      const topArt = tracksRes.data[0].artist;
      if (topArt && topArt.name) {
        const topArtClean = cleanSimple(topArt.name);
        if (topArtClean.length >= 2 && qClean.includes(topArtClean)) {
          const avatarPhoto = getArtistPhoto(topArt, topArt.name) || topArt.picture_xl || topArt.picture_big;
          artistObj = {
            id: `dz-artist-${topArt.id}`,
            name: topArt.name === "BK'" ? 'BK' : topArt.name,
            fansCount: 1250000,
            avatarImg: avatarPhoto,
            bannerImg: avatarPhoto,
            listeners: '1,2 mi ouvintes mensais',
            subscribers: '1,2 mi',
            bio: `${topArt.name} é o artista destaque desta faixa.`
          };
          if (allArtists.length === 0) {
            allArtists.push(artistObj);
          }
        }
      }
    }

    let rawTracks = tracksRes.data || [];

    // Fallback para iTunes Brasil se Deezer não retornou faixas suficientes
    if (rawTracks.length === 0) {
      try {
        const itunesRes = await fetchWithTimeout(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=25&country=BR`, {}, 3500)
          .then(r => r.json())
          .catch(() => ({ results: [] }));

        if (itunesRes.results && itunesRes.results.length > 0) {
          rawTracks = itunesRes.results.map((item, idx) => {
            const dur = Math.round((item.trackTimeMillis || 210000) / 1000);
            return {
              id: item.trackId || (Date.now() + idx),
              title: item.trackName,
              artist: { name: item.artistName, id: item.artistId },
              album: { title: item.collectionName || 'Single', cover_big: item.artworkUrl100?.replace('100x100bb', '600x600bb') },
              duration: dur,
              preview: item.previewUrl,
              explicit_lyrics: item.trackExplicitness === 'explicit'
            };
          });

          if (!artistObj && itunesRes.results[0]) {
            const first = itunesRes.results[0];
            const artistName = first.artistName;
            const cover = first.artworkUrl100?.replace('100x100bb', '600x600bb');
            artistObj = {
              id: `itunes-artist-${first.artistId || 1}`,
              name: artistName,
              avatarImg: cover,
              bannerImg: cover,
              listeners: '3,5 mi ouvintes mensais',
              subscribers: '1,2 mi',
              bio: `${artistName} é um artista de destaque no cenário musical.`
            };
            if (allArtists.length === 0) {
              allArtists.push(artistObj);
            }
          }
        }
      } catch (_) {}
    }

    const firstTrack = rawTracks[0];
    let artistTopTracks = [];

    // Só busca top faixas adicionais do artista se as faixas da busca forem repetitivas
    if (firstTrack && firstTrack.artist?.id) {
      const firstTitleNorm = cleanSimple(firstTrack.title);
      const isRepetitive = rawTracks.filter(t => cleanSimple(t.title) === firstTitleNorm).length >= 3;

      if (isRepetitive) {
        const artistId = firstTrack.artist.id;
        if (artistTopCache.has(artistId)) {
          artistTopTracks = artistTopCache.get(artistId);
        } else {
          try {
            const topRes = await fetchWithTimeout(`https://api.deezer.com/artist/${artistId}/top?limit=10`, {}, 1200)
              .then(r => r.json())
              .catch(() => ({ data: [] }));
            artistTopTracks = topRes.data || [];
            if (artistTopCache.size > 200) artistTopCache.clear();
            artistTopCache.set(artistId, artistTopTracks);
          } catch (_) {
            artistTopTracks = [];
          }
        }
      }
    }

    // Combina de forma inteligente eliminando repetições abusivas do mesmo título por artistas amadores
    const combined = [];
    const seenIds = new Set();
    const titleCounts = new Map();

    const addTrack = (t) => {
      if (!t || seenIds.has(t.id)) return false;
      if (isBootlegTrack(t.title, t.artist?.name)) return false;
      const normTitle = cleanSimple(t.title).replace(/(remix|acoustic|version|radioedit|live|aovivo|feat|featuring)/g, '');
      const currentCount = titleCounts.get(normTitle) || 0;

      const isMainArtist = firstTrack && t.artist && cleanSimple(t.artist.name) === cleanSimple(firstTrack.artist?.name);
      if (currentCount >= 1 && !isMainArtist) {
        return false;
      }
      if (currentCount >= 2) {
        return false;
      }

      seenIds.add(t.id);
      titleCounts.set(normTitle, currentCount + 1);
      combined.push(t);
      return true;
    };

    if (firstTrack) addTrack(firstTrack);

    for (const t of artistTopTracks) {
      if (combined.length >= 10) break;
      addTrack(t);
    }

    for (const t of rawTracks) {
      if (combined.length >= 25) break;
      addTrack(t);
    }

    let mappedTracks = combined.map((t, idx) => {
      const dur = t.duration || 210;
      const min = Math.floor(dur / 60);
      const sec = dur % 60;
      return {
        id: `dz-track-${t.id}`,
        type: 'song',
        title: t.title,
        artist: t.artist?.name || 'Artista',
        album: t.album?.title || 'Single',
        sub: `Música • ${t.artist?.name || 'Artista'} • ${t.album?.title || 'Single'}`,
        cover: t.album?.cover_big || t.album?.cover_medium,
        preview: t.preview,
        durationSec: dur,
        duration: `${min}:${String(sec).padStart(2, '0')}`,
        plays: generatePlaysCount(idx),
        explicit: t.explicit_lyrics || false
      };
    });

    // Se a busca corresponder com precisão ao título de uma música relevante (ex: "Planeta de Cores")
    // e o artista detectado não for uma correspondência exata ou tiver pouquíssimos fãs:
    // Mantém a música como destaque principal (Melhor resultado) e não exibe o perfil aleatório.
    if (artistObj && mappedTracks.length > 0) {
      const firstTrackTitleClean = cleanSimple(mappedTracks[0].title);
      const artistNameClean = cleanSimple(artistObj.name);
      const isSongTitleMatch = firstTrackTitleClean === qClean || firstTrackTitleClean.startsWith(qClean) || qClean.startsWith(firstTrackTitleClean);
      const isArtistExactMatch = artistNameClean === qClean || stripMC(artistObj.name) === stripMC(qClean);

      if (isSongTitleMatch && !isArtistExactMatch) {
        artistObj = null;
      } else if (!isArtistExactMatch && (artistObj.fansCount || 0) < 5000) {
        artistObj = null;
      }
    }

    if (artistObj) {
      const aNameClean = cleanSimple(artistObj.name);
      mappedTracks.sort((a, b) => {
        const aIsOwn = cleanSimple(a.artist) === aNameClean ? 1 : 0;
        const bIsOwn = cleanSimple(b.artist) === aNameClean ? 1 : 0;
        return bIsOwn - aIsOwn;
      });
    }

    const searchResult = {
      artist: artistObj,
      artists: allArtists,
      tracks: mappedTracks
    };

    // Apenas salva no cache se tiver encontrado resultados reais (nunca salva falhas vazias)
    if (mappedTracks.length > 0 || artistObj) {
      if (searchCache.size > 300) searchCache.clear();
      searchCache.set(cleanQ, searchResult);
    }

    return res.json(searchResult);
  } catch (err) {
    console.error('Erro na rota /api/music/search:', err);
    return res.status(500).json({ error: 'Erro ao buscar faixas' });
  }
});

// Mapeamento de afinidades musicais e clusters de artistas para Autoplay Inteligente e Álbuns Relacionados
const ARTIST_CLUSTERS = [
  {
    genre: 'Rap & Trap Nacional',
    related: [
      'Baco Exu do Blues', 'Djonga', '2ZDINIZ', 'Matchola', 'BK',
      'Filipe Ret', 'L7NNON', 'Froid', 'Matuê', 'Teto', 'WIU',
      'KayBlack', 'MC Cabelinho', 'Veigh', 'Yago Oproprio', 'Xamã',
      'Criolo', 'Emicida', 'Racionais MC\'s', 'Link do Zap', 'Orochi',
      'Tz da Coronel', 'Major RD', 'MC GP', 'Dfideliz'
    ]
  },
  {
    genre: 'Pop Internacional',
    related: [
      'The Weeknd', 'Justin Bieber', 'Shawn Mendes', 'Bruno Mars',
      'Charlie Puth', 'Ed Sheeran', 'Post Malone', 'Dua Lipa',
      'Ariana Grande', 'Harry Styles', 'Maroon 5', 'Zayn', 'Billie Eilish'
    ]
  },
  {
    genre: 'Hip-Hop & R&B US',
    related: [
      'Kendrick Lamar', 'Tyler, The Creator', 'Travis Scott', 'Drake',
      'A$AP Rocky', 'J. Cole', 'Kanye West', 'Mac Miller', 'Childish Gambino',
      'Frank Ocean', 'SZA', 'Daniel Caesar', 'Brent Faiyaz', 'Steve Lacy'
    ]
  },
  {
    genre: 'Hip-Hop & Dancehall Anos 2000',
    related: [
      'Akon', 'Kardinal Offishall', 'Sean Paul', 'T-Pain', '50 Cent',
      'Usher', 'Ne-Yo', 'Chris Brown', 'Pitbull', 'Flo Rida', 'Ludacris'
    ]
  },
  {
    genre: 'MPB & Indie Brasil',
    related: [
      'Caetano Veloso', 'Djavan', 'Gilberto Gil', 'Tim Maia', 'Jorge Ben Jor',
      'Liniker', 'Rubel', 'Gilsons', 'Lagum', 'Marisa Monte', 'Chico Buarque'
    ]
  }
];

function getClusterForArtist(artistName) {
  if (!artistName) return null;
  const clean = artistName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  for (const cluster of ARTIST_CLUSTERS) {
    const match = cluster.related.some(a => {
      const aClean = a.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
      return clean === aClean || clean.includes(aClean) || aClean.includes(clean);
    });
    if (match) return cluster;
  }
  return null;
}

// Busca sugestões de álbuns do mesmo artista ou do mesmo estilo musical
async function getRelatedAlbums(artistName, currentAlbumTitle, currentAlbumId) {
  try {
    const cleanSimple = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['"`.,\s-]/g, '');
    const curNorm = cleanSimple(currentAlbumTitle);
    
    // 1. Busca álbuns do artista no Deezer
    const searchRes = await fetchWithTimeout(`https://api.deezer.com/search/album?q=${encodeURIComponent(artistName || 'Brasil')}&limit=15`, {}, 2200)
      .then(r => r.json())
      .catch(() => ({ data: [] }));
    const albums = searchRes.data || [];
    
    const unique = [];
    const seen = new Set();
    if (curNorm) seen.add(curNorm);
    
    for (const alb of albums) {
      if (isBootlegTrack(alb.title, alb.artist?.name)) continue;
      const norm = cleanSimple(alb.title);
      if (seen.has(norm) || (currentAlbumId && String(alb.id) === String(currentAlbumId))) continue;
      seen.add(norm);
      unique.push({
        id: `dz-alb-${alb.id}`,
        albumId: alb.id,
        title: alb.title,
        artist: alb.artist?.name || artistName,
        cover: alb.cover_xl || alb.cover_big || alb.cover_medium,
        year: alb.release_date ? alb.release_date.slice(0, 4) : '2024',
        recordType: alb.record_type || 'album'
      });
      if (unique.length >= 8) break;
    }

    // 2. Se tiver menos de 6 álbuns, busca nos artistas com afinidade musical (do mesmo cluster)
    if (unique.length < 6 && artistName) {
      const cluster = getClusterForArtist(artistName);
      if (cluster) {
        const others = cluster.related.filter(a => cleanSimple(a) !== cleanSimple(artistName));
        for (const simArtist of others.slice(0, 4)) {
          if (unique.length >= 8) break;
          const simRes = await fetchWithTimeout(`https://api.deezer.com/search/album?q=${encodeURIComponent(simArtist)}&limit=3`, {}, 1600)
            .then(r => r.json())
            .catch(() => ({ data: [] }));
          for (const simAlb of (simRes.data || [])) {
            if (isBootlegTrack(simAlb.title, simAlb.artist?.name)) continue;
            const norm = cleanSimple(simAlb.title);
            if (seen.has(norm)) continue;
            seen.add(norm);
            unique.push({
              id: `dz-alb-${simAlb.id}`,
              albumId: simAlb.id,
              title: simAlb.title,
              artist: simAlb.artist?.name || simArtist,
              cover: simAlb.cover_xl || simAlb.cover_big || simAlb.cover_medium,
              year: simAlb.release_date ? simAlb.release_date.slice(0, 4) : '2024',
              recordType: simAlb.record_type || 'album'
            });
            if (unique.length >= 8) break;
          }
        }
      }
    }

    return unique;
  } catch (_) {
    return [];
  }
}

/**
 * GET /api/music/album-tracks?albumId={id}&title={title}&artist={artist}
 * Carrega estritamente as faixas oficiais de um álbum selecionado em ordem numérica.
 */
router.get('/album-tracks', async (req, res) => {
  const { albumId, title, artist } = req.query;
  if (!albumId && !title) {
    return res.status(400).json({ error: 'Parâmetro "albumId" ou "title" é obrigatório.' });
  }

  try {
    const cleanStr = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const cleanSimple = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['"`.,\s-]/g, '');

    const aClean = cleanSimple(artist);
    const tClean = cleanSimple(title);
    const query = `${artist || ''} ${title || ''}`.trim();

    const isItunesId = (albumId || '').startsWith('it-alb-');
    const rawId = (albumId || '').replace('dz-alb-', '').replace('it-alb-', '');

    // 1. Se for ID específico do iTunes
    if (isItunesId && rawId && !isNaN(rawId)) {
      const lookupRes = await fetch(`https://itunes.apple.com/lookup?id=${rawId}&entity=song&country=BR`).then(r => r.json()).catch(() => ({ results: [] }));
      const albItem = (lookupRes.results || []).find(r => r.wrapperType === 'collection');
      const trackItems = (lookupRes.results || []).filter(r => r.wrapperType === 'track' && String(r.collectionId) === String(rawId));

      if (trackItems.length > 0) {
        trackItems.sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));
        const totalSec = trackItems.reduce((acc, t) => acc + Math.round((t.trackTimeMillis || 0) / 1000), 0);
        const albCover = albItem?.artworkUrl100?.replace('100x100bb', '600x600bb') || trackItems[0].artworkUrl100?.replace('100x100bb', '600x600bb') || '';

        const albumDetails = {
          id: `it-alb-${rawId}`,
          albumId: rawId,
          title: albItem?.collectionName || title || 'Álbum',
          cover: albCover,
          artistName: albItem?.artistName || artist || 'Artista',
          artistAvatar: '',
          year: albItem?.releaseDate ? albItem.releaseDate.slice(0, 4) : '2024',
          nbTracks: trackItems.length,
          durationSec: totalSec,
          explicit: albItem?.collectionExplicitness === 'explicit',
          recordType: 'album',
          priceSale: 'R$ 29,90',
          priceRent: 'R$ 9,90'
        };

        const mapped = trackItems.map((t, idx) => {
          const dur = Math.round((t.trackTimeMillis || 210000) / 1000);
          const min = Math.floor(dur / 60);
          const sec = dur % 60;
          return {
            id: `track-${t.trackId || idx}`,
            trackNumber: t.trackNumber || (idx + 1),
            title: t.trackName,
            artist: t.artistName || albumDetails.artistName,
            album: albumDetails.title,
            cover: albCover,
            preview: t.previewUrl,
            durationSec: dur,
            duration: `${min}:${String(sec).padStart(2, '0')}`,
            plays: generatePlaysCount(idx),
            explicit: t.trackExplicitness === 'explicit'
          };
        });

        const relatedList = await getRelatedAlbums(albumDetails.artistName || artist, albumDetails.title || title, albumDetails.albumId);
        return res.json({ album: albumDetails, tracks: mapped, relatedAlbums: relatedList });
      }
    }

    const enrichDeezerTracks = async (sortedTracks, albumDetails) => {
      return Promise.all(
        sortedTracks.map(async (t, idx) => {
          let fullTitle = t.title;
          let displayArtist = t.artist?.name || albumDetails.artistName;

          if (!/\(part\.|\(feat\.|\bfeat\b/i.test(fullTitle) && t.id) {
            try {
              const trackData = await fetchWithTimeout(`https://api.deezer.com/track/${t.id}`, {}, 1800)
                .then(r => r.json())
                .catch(() => null);

              if (trackData && trackData.contributors && trackData.contributors.length > 1) {
                const feats = trackData.contributors
                  .filter(c => c.role === 'Featured' || (c.id !== trackData.artist?.id && c.role !== 'Main'))
                  .map(c => c.name);

                if (feats.length > 0) {
                  fullTitle = `${t.title} (part. ${feats.join(' e ')})`;
                  const mainName = trackData.artist?.name || albumDetails.artistName;
                  displayArtist = `${mainName}, ${feats.join(', ')}`;
                }
              }
            } catch (_) {}
          }

          const dur = t.duration || 210;
          const min = Math.floor(dur / 60);
          const sec = dur % 60;
          return {
            id: `dz-track-${t.id}`,
            trackNumber: t.track_position || (idx + 1),
            title: fullTitle,
            artist: displayArtist,
            album: albumDetails.title,
            cover: albumDetails.cover,
            preview: t.preview,
            durationSec: dur,
            duration: `${min}:${String(sec).padStart(2, '0')}`,
            plays: generatePlaysCount(idx),
            explicit: t.explicit_lyrics || false
          };
        })
      );
    };

    // 2. Se for ID numérico direto do Deezer
    if (rawId && !isNaN(rawId) && !isItunesId) {
      const [albumData, tracksRes] = await Promise.all([
        fetch(`https://api.deezer.com/album/${rawId}`).then(r => r.json()).catch(() => null),
        fetch(`https://api.deezer.com/album/${rawId}/tracks?limit=100`).then(r => r.json()).catch(() => ({ data: [] }))
      ]);

      if (albumData && albumData.title && tracksRes.data && tracksRes.data.length > 0) {
        const sortedTracks = [...tracksRes.data].sort((a, b) => (a.track_position || 0) - (b.track_position || 0));
        const albumDetails = {
          id: `dz-alb-${albumData.id}`,
          albumId: albumData.id,
          title: albumData.title,
          cover: albumData.cover_xl || albumData.cover_big || albumData.cover_medium,
          artistName: albumData.artist?.name || artist || 'Artista',
          artistAvatar: albumData.artist?.picture_small || albumData.artist?.picture_medium,
          artistId: albumData.artist?.id,
          year: albumData.release_date ? albumData.release_date.slice(0, 4) : '2024',
          nbTracks: sortedTracks.length,
          durationSec: albumData.duration || sortedTracks.reduce((acc, t) => acc + (t.duration || 0), 0),
          explicit: albumData.explicit_lyrics || false,
          recordType: albumData.record_type || 'album',
          priceSale: albumData.record_type === 'single' ? 'R$ 4,90' : 'R$ 29,90',
          priceRent: albumData.record_type === 'single' ? 'R$ 1,90' : 'R$ 9,90'
        };

        const mapped = await enrichDeezerTracks(sortedTracks, albumDetails);
        const relatedList = await getRelatedAlbums(albumDetails.artistName || artist, albumDetails.title || title, albumDetails.albumId);
        return res.json({ album: albumDetails, tracks: mapped, relatedAlbums: relatedList });
      }
    }

    // 3. Busca o Álbum no Deezer pelo Nome do Álbum e Artista
    const dzAlbumSearch = await fetch(`https://api.deezer.com/search/album?q=${encodeURIComponent(query)}&limit=10`).then(r => r.json()).catch(() => ({ data: [] }));
    let bestDeezerAlbum = null;

    if (dzAlbumSearch.data && dzAlbumSearch.data.length > 0) {
      bestDeezerAlbum = dzAlbumSearch.data.find(alb => {
        const albArt = cleanSimple(alb.artist?.name);
        const albTit = cleanSimple(alb.title);
        const artMatches = !aClean || albArt.includes(aClean) || aClean.includes(albArt);
        const titMatches = !tClean || albTit.includes(tClean) || tClean.includes(albTit);
        return artMatches && titMatches;
      }) || dzAlbumSearch.data[0];
    }

    if (bestDeezerAlbum && bestDeezerAlbum.id) {
      const [albumData, tracksRes] = await Promise.all([
        fetch(`https://api.deezer.com/album/${bestDeezerAlbum.id}`).then(r => r.json()).catch(() => null),
        fetch(`https://api.deezer.com/album/${bestDeezerAlbum.id}/tracks?limit=100`).then(r => r.json()).catch(() => ({ data: [] }))
      ]);

      if (tracksRes.data && tracksRes.data.length > 0) {
        const sortedTracks = [...tracksRes.data].sort((a, b) => (a.track_position || 0) - (b.track_position || 0));
        const albumDetails = {
          id: `dz-alb-${bestDeezerAlbum.id}`,
          albumId: bestDeezerAlbum.id,
          title: albumData?.title || bestDeezerAlbum.title,
          cover: albumData?.cover_xl || bestDeezerAlbum.cover_xl || bestDeezerAlbum.cover_big || bestDeezerAlbum.cover_medium,
          artistName: albumData?.artist?.name || bestDeezerAlbum.artist?.name || artist || 'Artista',
          artistAvatar: albumData?.artist?.picture_small || albumData?.artist?.picture_medium,
          artistId: albumData?.artist?.id || bestDeezerAlbum.artist?.id,
          year: albumData?.release_date ? albumData.release_date.slice(0, 4) : '2024',
          nbTracks: sortedTracks.length,
          durationSec: albumData?.duration || sortedTracks.reduce((acc, t) => acc + (t.duration || 0), 0),
          explicit: albumData?.explicit_lyrics || bestDeezerAlbum.explicit_lyrics || false,
          recordType: albumData?.record_type || 'album',
          priceSale: 'R$ 29,90',
          priceRent: 'R$ 9,90'
        };

        const mapped = await enrichDeezerTracks(sortedTracks, albumDetails);
        const relatedList = await getRelatedAlbums(albumDetails.artistName || artist, albumDetails.title || title, albumDetails.albumId);
        return res.json({ album: albumDetails, tracks: mapped, relatedAlbums: relatedList });
      }
    }

    // 4. Busca Álbum no iTunes Brasil e faz Lookup Oficial das faixas da coleção
    const itAlbumSearch = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=album&limit=10&country=BR`).then(r => r.json()).catch(() => ({ results: [] }));
    let bestItunesAlbum = null;

    if (itAlbumSearch.results && itAlbumSearch.results.length > 0) {
      bestItunesAlbum = itAlbumSearch.results.find(alb => {
        const albArt = cleanSimple(alb.artistName);
        const albTit = cleanSimple(alb.collectionName);
        const artMatches = !aClean || albArt.includes(aClean) || aClean.includes(albArt);
        const titMatches = !tClean || albTit.includes(tClean) || tClean.includes(albTit);
        return artMatches && titMatches;
      }) || itAlbumSearch.results[0];
    }

    if (bestItunesAlbum && bestItunesAlbum.collectionId) {
      const lookupRes = await fetch(`https://itunes.apple.com/lookup?id=${bestItunesAlbum.collectionId}&entity=song&country=BR`).then(r => r.json()).catch(() => ({ results: [] }));
      const trackItems = (lookupRes.results || []).filter(r => r.wrapperType === 'track' && String(r.collectionId) === String(bestItunesAlbum.collectionId));

      if (trackItems.length > 0) {
        trackItems.sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0));
        const totalSec = trackItems.reduce((acc, t) => acc + Math.round((t.trackTimeMillis || 0) / 1000), 0);
        const albCover = bestItunesAlbum.artworkUrl100?.replace('100x100bb', '600x600bb') || '';

        const albumDetails = {
          id: `it-alb-${bestItunesAlbum.collectionId}`,
          albumId: bestItunesAlbum.collectionId,
          title: bestItunesAlbum.collectionName || title || 'Álbum',
          cover: albCover,
          artistName: bestItunesAlbum.artistName || artist || 'Artista',
          artistAvatar: '',
          year: bestItunesAlbum.releaseDate ? bestItunesAlbum.releaseDate.slice(0, 4) : '2024',
          nbTracks: trackItems.length,
          durationSec: totalSec,
          explicit: bestItunesAlbum.collectionExplicitness === 'explicit',
          recordType: 'album',
          priceSale: 'R$ 29,90',
          priceRent: 'R$ 9,90'
        };

        const mapped = trackItems.map((t, idx) => {
          const dur = Math.round((t.trackTimeMillis || 210000) / 1000);
          const min = Math.floor(dur / 60);
          const sec = dur % 60;
          return {
            id: `track-${t.trackId || idx}`,
            trackNumber: t.trackNumber || (idx + 1),
            title: t.trackName,
            artist: t.artistName || albumDetails.artistName,
            album: albumDetails.title,
            cover: albCover,
            preview: t.previewUrl,
            durationSec: dur,
            duration: `${min}:${String(sec).padStart(2, '0')}`,
            plays: generatePlaysCount(idx),
            explicit: t.trackExplicitness === 'explicit'
          };
        });

        const relatedList = await getRelatedAlbums(albumDetails.artistName || artist, albumDetails.title || title, albumDetails.albumId);
        return res.json({ album: albumDetails, tracks: mapped, relatedAlbums: relatedList });
      }
    }

    return res.json({ album: null, tracks: [] });
  } catch (err) {
    console.error('Erro na rota /api/music/album-tracks:', err);
    return res.status(500).json({ error: 'Erro ao buscar faixas do álbum' });
  }
});

// Cache em memória para filas inteligentes instantâneas (0ms)
const smartQueueCache = new Map();

/**
 * GET /api/music/smart-queue?artist={artist}&title={title}&history={history}
 * Gera a fila de reprodução inteligente (Smart Radio / Afinidade de Artistas)
 */
router.get('/smart-queue', async (req, res) => {
  const { artist, title, history } = req.query;
  if (!artist) {
    return res.status(400).json({ error: 'Parâmetro "artist" é obrigatório.' });
  }

  const cleanArtist = artist.trim();
  const cacheKey = `${cleanArtist.toLowerCase()}_${(history || '').toLowerCase().slice(0, 50)}`;
  if (smartQueueCache.has(cacheKey)) {
    return res.json(smartQueueCache.get(cacheKey));
  }

  try {
    const cluster = getClusterForArtist(cleanArtist);
    let targetArtists = [];
    let sourceLabel = cluster ? `Rádio de ${cleanArtist} • ${cluster.genre}` : `Rádio de ${cleanArtist}`;

    if (cluster) {
      // Artistas do cluster excluindo o atual
      const cleanSimple = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
      const curClean = cleanSimple(cleanArtist);

      const otherArtists = cluster.related.filter(a => {
        const aClean = cleanSimple(a);
        return aClean !== curClean && !curClean.includes(aClean) && !aClean.includes(curClean);
      });

      // Se o usuário passou histórico recente de artistas que ele escuta, prioriza os que pertencem ao mesmo cluster!
      const historyList = (history || '')
        .split(',')
        .map(h => h.trim())
        .filter(Boolean);

      const boostedFromHistory = [];
      const remaining = [];

      for (const a of otherArtists) {
        const aClean = cleanSimple(a);
        const inHistory = historyList.some(h => {
          const hClean = cleanSimple(h);
          return hClean === aClean || hClean.includes(aClean) || aClean.includes(hClean);
        });

        if (inHistory) boostedFromHistory.push(a);
        else remaining.push(a);
      }

      // Constrói lista de alvos combinando histórico relevante + afinidades do gênero
      targetArtists = [...boostedFromHistory, ...remaining].slice(0, 6);
    } else {
      // Fallback para artistas sem cluster fixo: busca artistas relacionados no Deezer
      try {
        const searchArt = await fetchWithTimeout(`https://api.deezer.com/search/artist?q=${encodeURIComponent(cleanArtist)}&limit=1`, {}, 1500)
          .then(r => r.json())
          .catch(() => ({ data: [] }));

        if (searchArt.data && searchArt.data[0]) {
          const artistId = searchArt.data[0].id;
          const relRes = await fetchWithTimeout(`https://api.deezer.com/artist/${artistId}/related?limit=6`, {}, 1500)
            .then(r => r.json())
            .catch(() => ({ data: [] }));

          if (relRes.data && relRes.data.length > 0) {
            targetArtists = relRes.data.map(a => a.name);
          }
        }
      } catch (_) {}

      // Se ainda vazio, usa busca direta por termo similar
      if (targetArtists.length === 0) {
        targetArtists = [cleanArtist];
      }
    }

    // Busca em paralelo as faixas de destaque dos artistas relacionados
    const fetchPromises = targetArtists.map(targetArt => {
      return fetchWithTimeout(`https://api.deezer.com/search?q=${encodeURIComponent(targetArt)}&limit=3`, {}, 1800)
        .then(r => r.json())
        .then(d => d.data || [])
        .catch(() => []);
    });

    const results = await Promise.all(fetchPromises);
    const queueTracks = [];
    const seenIds = new Set();
    const seenTitles = new Set();

    const titleClean = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['"`.,\s-]/g, '');
    const currentTitleClean = titleClean(title);

    // Adiciona alternadamente 1 a 2 músicas por artista relacionado para dar variedade rica
    const maxRounds = 2;
    for (let round = 0; round < maxRounds; round++) {
      for (const trackList of results) {
        const t = trackList[round];
        if (!t) continue;
        if (seenIds.has(t.id)) continue;

        const tTitle = titleClean(t.title);
        if (tTitle === currentTitleClean) continue; // Não repete a que já está tocando
        if (seenTitles.has(tTitle)) continue;

        seenIds.add(t.id);
        seenTitles.add(tTitle);

        const dur = t.duration || 210;
        const min = Math.floor(dur / 60);
        const sec = dur % 60;

        queueTracks.push({
          id: `dz-track-${t.id}`,
          title: t.title,
          artist: t.artist?.name || 'Artista',
          album: t.album?.title || 'Single',
          cover: t.album?.cover_big || t.album?.cover_medium,
          preview: t.preview,
          durationSec: dur,
          duration: `${min}:${String(sec).padStart(2, '0')}`,
          plays: generatePlaysCount(queueTracks.length),
          explicit: t.explicit_lyrics || false
        });

        if (queueTracks.length >= 15) break;
      }
      if (queueTracks.length >= 15) break;
    }

    const responsePayload = {
      source: sourceLabel,
      tracks: queueTracks
    };

    if (smartQueueCache.size > 200) smartQueueCache.clear();
    smartQueueCache.set(cacheKey, responsePayload);

    return res.json(responsePayload);
  } catch (err) {
    console.error('Erro na rota /api/music/smart-queue:', err);
    return res.status(500).json({ error: 'Erro ao gerar fila inteligente' });
  }
});

module.exports = router;
