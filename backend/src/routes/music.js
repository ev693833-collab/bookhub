const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const artistSyncService = require('../services/artistSyncService');
const libraryStorage = require('../services/libraryStorage');
const verifyToken = require('../middlewares/auth');
const recommendationService = require('../services/recommendationService');

function readJsonFile(filePath, fallback = []) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (_) {}
  return fallback;
}

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

// Tabela de anos reais de lançamento para álbuns canônicos (Djonga, BK, Baco, Matuê, Ret, etc.)
function getKnownAlbumYear(title, artist) {
  if (!title) return null;
  const clean = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const t = clean(title);
  const a = clean(artist);

  // Djonga
  if (a.includes('djonga') || t.includes('djonga') || t.includes('heresia') || t.includes('meninoquequeriaserdeus') || t.includes('historiasdaminhaarea') || t.includes('odonodolugar') || t.includes('quantomaiseucomo')) {
    if (t.includes('heresia')) return '2017';
    if (t.includes('meninoquequeriaserdeus')) return '2018';
    if (t.includes('ladrao')) return '2019';
    if (t.includes('historiasdaminhaarea')) return '2020';
    if (t.includes('nu')) return '2021';
    if (t.includes('odonodolugar')) return '2022';
    if (t.includes('demotape') || t.includes('inocente')) return '2023';
    if (t.includes('quantomaiseucomo')) return '2024';
  }
  // BK' / Abebe Bikila
  if (a.includes('bk') || a.includes('abebe')) {
    if (t.includes('castelos')) return '2016';
    if (t.includes('gigantes')) return '2018';
    if (t.includes('lideremmovimento')) return '2020';
    if (t.includes('cidadedopecado')) return '2021';
    if (t.includes('icarus')) return '2022';
    if (t.includes('diamantes')) return '2025';
    if (t.includes('produtodoambiente')) return '2024';
  }
  // Baco Exu do Blues
  if (a.includes('baco')) {
    if (t.includes('esu')) return '2017';
    if (t.includes('bluesman')) return '2018';
    if (t.includes('bacanal')) return '2020';
    if (t.includes('qvvjfa') || t.includes('quantasvezes')) return '2022';
    if (t.includes('fetiche')) return '2024';
  }
  // Matuê
  if (a.includes('matue')) {
    if (t.includes('maquinadotempo')) return '2020';
    if (t.includes('333')) return '2024';
  }
  // Filipe Ret
  if (a.includes('ret')) {
    if (t.includes('vivaz')) return '2012';
    if (t.includes('revel')) return '2015';
    if (t.includes('audaz')) return '2018';
    if (t.includes('imaterial')) return '2021';
    if (t.includes('lume')) return '2022';
    if (t.includes('frxv')) return '2023';
  }
  // Veigh
  if (a.includes('veigh')) {
    if (t.includes('dosprediosdeluxe')) return '2023';
    if (t.includes('dospredios')) return '2022';
  }
  // KayBlack
  if (a.includes('kayblack')) {
    if (t.includes('contradicoes')) return '2023';
  }
  // Yago Oproprio
  if (a.includes('yago')) {
    if (t.includes('oproprio')) return '2024';
  }
  // L7NNON
  if (a.includes('l7nnon') || a.includes('l7')) {
    if (t.includes('podresdericos')) return '2019';
    if (t.includes('hiphoprare')) return '2020';
    if (t.includes('meespera')) return '2022';
    if (t.includes('irrastreavel')) return '2024';
  }
  // Orochi
  if (a.includes('orochi')) {
    if (t.includes('celebridade')) return '2020';
    if (t.includes('lobo')) return '2021';
    if (t.includes('vidacara')) return '2023';
  }
  // MC Cabelinho
  if (a.includes('cabelinho')) {
    if (t.includes('ainda')) return '2020';
    if (t.includes('littlehair')) return '2021';
    if (t.includes('littlelove')) return '2022';
  }
  // Teto
  if (a.includes('teto')) {
    if (t.includes('previas')) return '2021';
    if (t.includes('1010')) return '2024';
  }
  // Wiu
  if (a.includes('wiu')) {
    if (t.includes('manualdecomo')) return '2022';
    if (t.includes('vagabundodeluxo')) return '2024';
  }
  // Racionais MC's
  if (a.includes('racionais')) {
    if (t.includes('holocausto')) return '1990';
    if (t.includes('raioxbrasil')) return '1993';
    if (t.includes('sobrevivendonoinferno')) return '1997';
    if (t.includes('nadacomoum')) return '2002';
    if (t.includes('coresevalores')) return '2014';
  }
  // Sabotage
  if (a.includes('sabotage')) {
    if (t.includes('orap')) return '2001';
  }
  // Emicida
  if (a.includes('emicida')) {
    if (t.includes('gloriosoretorno')) return '2013';
    if (t.includes('sobrecriancas')) return '2015';
    if (t.includes('amarelo')) return '2019';
  }
  // Criolo
  if (a.includes('criolo')) {
    if (t.includes('aindahatempo')) return '2006';
    if (t.includes('nonaorelha')) return '2011';
    if (t.includes('convoqueseubuda')) return '2014';
    if (t.includes('espiral')) return '2017';
    if (t.includes('sobreviver')) return '2022';
  }
  // Justin Bieber
  if (a.includes('bieber')) {
    if (t.includes('myworld2')) return '2010';
    if (t.includes('myworld')) return '2009';
    if (t.includes('under') && t.includes('mistletoe')) return '2011';
    if (t.includes('believe')) return '2012';
    if (t.includes('journals')) return '2013';
    if (t.includes('purpose')) return '2015';
    if (t.includes('changes')) return '2020';
    if (t.includes('justice')) return '2021';
    if (t.includes('swag')) return '2025';
  }
  // Travis Scott
  if (a.includes('travis') && a.includes('scott')) {
    if (t.includes('rodeo')) return '2015';
    if (t.includes('birdsinthe')) return '2016';
    if (t.includes('astroworld')) return '2018';
    if (t.includes('utopia')) return '2023';
  }
  // Kendrick Lamar
  if (a.includes('kendrick')) {
    if (t.includes('section80')) return '2011';
    if (t.includes('goodkid')) return '2012';
    if (t.includes('butterfly')) return '2015';
    if (t.includes('damn')) return '2017';
    if (t.includes('mrmorale')) return '2022';
    if (t.includes('gnx')) return '2024';
  }
  return null;
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

function safeUpgradeAvatar(url) {
  if (typeof libraryStorage.upgradeArtistAvatarResolution === 'function') {
    return libraryStorage.upgradeArtistAvatarResolution(url);
  }
  return (url || '').replace(/\/(\d+)x(\d+)-/g, '/1000x1000-').replace('/250x250-', '/1000x1000-');
}

function getArtistPhoto(artist, queryName) {
  const qClean = cleanSimple(queryName || (artist && artist.name));
  // Imagens oficiais HD com prioridade para artistas icônicos
  if (qClean === 'bk') {
    return (artist && (artist.picture_xl || artist.picture_big)) || 'https://cdn-images.dzcdn.net/images/artist/7481fc25e9bf8f0d8c416ecb9104927d/1000x1000-000000-80-0-0.jpg';
  }
  if (qClean === 'justinbieber') {
    return 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025319/bookhub/img/justin_my_world.jpg';
  }
  if (artist) {
    const pic = artist.picture_xl || artist.picture_big || artist.picture_medium || artist.picture_small;
    if (isValidArtistPicture(pic)) return safeUpgradeAvatar(pic);
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
  const { q, artistId, sync } = req.query;
  if (!q && !artistId) {
    return res.status(400).json({ error: 'Parâmetro "q" ou "artistId" é obrigatório.' });
  }

  try {
    const forceSync = sync === 'true' || sync === '1';
    const discography = await artistSyncService.syncArtistDiscography(q, artistId, forceSync);
    return res.json(discography);
  } catch (err) {
    console.error('Erro na sincronização de artista /api/music/artist:', err);
    return res.status(500).json({ error: 'Erro ao sincronizar discografia do artista' });
  }
});

router.post('/artist/sync', async (req, res) => {
  const { q, artistId } = req.body || req.query;
  if (!q && !artistId) {
    return res.status(400).json({ error: 'Parâmetro "q" ou "artistId" é obrigatório.' });
  }

  try {
    const discography = await artistSyncService.syncArtistDiscography(q, artistId, true);
    return res.json({ success: true, message: 'Discografia sincronizada com sucesso!', ...discography });
  } catch (err) {
    console.error('Erro no POST /api/music/artist/sync:', err);
    return res.status(500).json({ error: 'Erro ao sincronizar discografia do artista' });
  }
});

/**
 * Helper para enriquecer os resultados de busca integrando o catálogo geral
 * com a biblioteca de faixas e álbuns comprados/alugados do usuário e o catálogo local.
 */
async function enrichSearchResultsWithUserLibrary(catalogResult, userId, q) {
  if (!catalogResult) return { artist: null, artists: [], tracks: [] };

  const normalizeStr = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['"`.,\-_/\\()&]/g, ' ').replace(/\s+/g, ' ').trim();
  const cleanSimple = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

  const qNorm = normalizeStr(q);
  const qClean = cleanSimple(q);
  const qTokens = qNorm.split(' ').filter(Boolean);

  const matchesQuery = (item) => {
    if (!qNorm) return false;
    const titleNorm = normalizeStr(item.title);
    const artistNorm = normalizeStr(item.artist || item.artist_name || item.companyName);
    const albumNorm = normalizeStr(item.album || item.album_title);
    const combined = `${titleNorm} ${artistNorm} ${albumNorm}`.trim();
    const titleArtist = `${titleNorm} ${artistNorm}`.trim();

    // 1. Correspondência exata ou prefixo direto com a consulta
    if (titleNorm === qNorm || artistNorm === qNorm || albumNorm === qNorm) return true;
    if (titleNorm.startsWith(qNorm) || artistNorm.startsWith(qNorm)) return true;
    if (titleNorm.includes(qNorm) || artistNorm.includes(qNorm)) return true;
    if (combined.includes(qNorm)) return true;

    // 2. Se a consulta tiver múltiplos termos (ex: "como eu amo essa mulher" ou "dfideliz como eu amo")
    if (qTokens.length > 1) {
      const matchedTokens = qTokens.filter(t => combined.includes(t));
      if (matchedTokens.length === qTokens.length) return true;
      if (qTokens.length >= 3 && (matchedTokens.length / qTokens.length) >= 0.8 && titleNorm.length >= 3) {
        return true;
      }
    }

    // 3. Se a busca for o título exato com o artista
    if (qNorm === titleArtist || titleArtist.includes(qNorm)) return true;

    return false;
  };

  const scoreMatch = (item) => {
    let score = 0;
    const titleNorm = normalizeStr(item.title);
    const artistNorm = normalizeStr(item.artist || item.artist_name);
    const albumNorm = normalizeStr(item.album || item.album_title);
    const titleClean = cleanSimple(item.title);

    if (titleClean === qClean) score += 100;
    else if (titleNorm === qNorm) score += 95;
    else if (titleNorm.startsWith(qNorm)) score += 70;
    else if (titleNorm.includes(qNorm)) score += 50;

    if (cleanSimple(item.artist) === qClean) score += 80;
    else if (artistNorm.includes(qNorm)) score += 40;

    if (albumNorm.includes(qNorm)) score += 30;
    return score;
  };

  let userLibraryTracks = [];
  let userPurchasedAlbums = [];
  if (userId) {
    try {
      userLibraryTracks = await libraryStorage.getUserLibraryTracks(userId, 'all');
      userPurchasedAlbums = await libraryStorage.getUserPurchasedAlbums(userId);
    } catch (e) {
      console.warn('Erro ao carregar faixas da biblioteca do usuário na busca:', e.message);
    }
  }

  let localTracks = [];
  try {
    localTracks = readJsonFile(path.join(__dirname, '../../data/company_tracks.json'), []);
  } catch (_) {}

  const matchingUserTracks = userLibraryTracks.filter(t => matchesQuery(t));
  matchingUserTracks.sort((a, b) => scoreMatch(b) - scoreMatch(a));

  const userPurchasesMap = new Map();
  for (const t of userLibraryTracks) {
    const keyTitleArtist = `${cleanSimple(t.title)}__${cleanSimple(t.artist)}`;
    userPurchasesMap.set(keyTitleArtist, t);
    // Identificador único confiável da faixa na biblioteca local
    if (t.dbTrackId) {
      userPurchasesMap.set(`local_db_${t.dbTrackId}`, t);
    }
    if (t.id) {
      userPurchasesMap.set(`track_id_${t.id}`, t);
    }
  }

  const GENERIC_ALBUMS = new Set(['single', 'ep', 'variado', 'aovivo', 'deluxe', 'album', 'show', 'oshow']);
  const purchasedAlbumIds = new Set(userPurchasedAlbums.map(a => Number(a.id)).filter(Boolean));
  // Álbuns comprados com validação obrigatória de artista para evitar falsos positivos
  const purchasedAlbumTitleArtist = new Set(
    userPurchasedAlbums
      .filter(a => {
        const t = cleanSimple(a.title);
        return t && !GENERIC_ALBUMS.has(t);
      })
      .map(a => `${cleanSimple(a.title)}__${cleanSimple(a.artist)}`)
  );

  const formatTrack = (t, fromLibrary = false, userAcquisition = null) => {
    const dur = t.durationSec || t.duration_sec || 210;
    const min = Math.floor(dur / 60);
    const sec = dur % 60;
    const isRent = userAcquisition ? userAcquisition.type === 'rent' : (t.type === 'rent' || t.isRented);
    const now = new Date();
    const isExpired = userAcquisition
      ? Boolean(userAcquisition.isExpired || userAcquisition.is_expired || (userAcquisition.expiresAt && new Date(userAcquisition.expiresAt) <= now) || (userAcquisition.expires_at && new Date(userAcquisition.expires_at) <= now))
      : Boolean(t.isExpired || t.is_expired || (t.expiresAt && new Date(t.expiresAt) <= now) || (t.expires_at && new Date(t.expires_at) <= now));
    const isPurchased = userAcquisition ? userAcquisition.type === 'buy' : Boolean(t.isPurchased || t.type === 'buy');
    const isRented = isRent && !isExpired;
    const hasActiveAccess = isPurchased || isRented;

    const license = isPurchased
      ? 'Comprada'
      : (isRented ? (userAcquisition?.licenseLabel || 'Alugada') : null);

    return {
      id: userAcquisition?.id || t.id || `track-${t.dbTrackId || Date.now()}`,
      dbTrackId: userAcquisition?.dbTrackId || t.dbTrackId || t.id,
      type: 'song',
      title: t.title,
      artist: t.artist,
      album: t.album || 'Single',
      sub: `Música • ${t.artist} • ${t.album || 'Single'}`,
      cover: t.cover || t.cover_url || userAcquisition?.cover || userAcquisition?.cover_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png',
      preview: t.preview || t.preview_url || userAcquisition?.preview || null,
      youtubeVideoId: t.youtubeVideoId || t.youtube_video_id || userAcquisition?.youtubeVideoId || null,
      durationSec: dur,
      duration: t.duration || `${min}:${String(sec).padStart(2, '0')}`,
      plays: fromLibrary ? (userAcquisition?.plays || (isPurchased ? 'Comprado (Permanente)' : 'Alugado')) : (t.plays || 'Tocou recentemente'),
      explicit: Boolean(t.explicit || t.explicit_lyrics),
      albumId: t.albumId || t.album_id || userAcquisition?.album_id,
      isPurchased,
      isRented,
      isExpired,
      licenseLabel: license,
      badge: license ? (isRented ? 'Alugada' : 'Comprada') : null,
      canPlay: hasActiveAccess || Boolean(t.canPlay),
      access_status: isPurchased ? 'purchased' : (isRented ? 'rent_active' : 'unpurchased')
    };
  };

  const finalTracks = [];
  const seenTracks = new Set();
  const getDedupKey = (title, artist) => `${cleanSimple(title)}__${cleanSimple(artist)}`;

  // 1. Adiciona faixas correspondentes da biblioteca pessoal primeiro (alta prioridade e badge)
  for (const uTrack of matchingUserTracks) {
    const key = getDedupKey(uTrack.title, uTrack.artist);
    if (!seenTracks.has(key)) {
      seenTracks.add(key);
      finalTracks.push(formatTrack(uTrack, true, uTrack));
    }
  }

  // 2. Adiciona faixas do catálogo externo, deduplicando e verificando se o usuário já as possui
  for (const cTrack of (catalogResult.tracks || [])) {
    const key = getDedupKey(cTrack.title, cTrack.artist);
    const userAcq = userPurchasesMap.get(key) ||
      (cTrack.dbTrackId ? userPurchasesMap.get(`local_db_${cTrack.dbTrackId}`) : null) ||
      (cTrack.id ? userPurchasesMap.get(`track_id_${cTrack.id}`) : null) ||
      null;

    const isAlbumCovered = (cTrack.albumId && purchasedAlbumIds.has(Number(cTrack.albumId))) ||
      (cTrack.album && purchasedAlbumTitleArtist.has(`${cleanSimple(cTrack.album)}__${cleanSimple(cTrack.artist)}`));

    if (seenTracks.has(key)) {
      continue;
    }

    seenTracks.add(key);

    if (userAcq) {
      finalTracks.push(formatTrack({ ...cTrack, ...userAcq }, true, userAcq));
    } else if (isAlbumCovered) {
      finalTracks.push({
        ...formatTrack(cTrack, false, null),
        isPurchased: true,
        licenseLabel: 'Comprada',
        badge: 'Comprada',
        canPlay: true,
        access_status: 'purchased'
      });
    } else {
      finalTracks.push(formatTrack(cTrack, false, null));
    }
  }

  // 3. Adiciona faixas do catálogo local da plataforma se corresponderem à busca
  const matchingLocal = localTracks.filter(t => matchesQuery(t));
  for (const lTrack of matchingLocal) {
    const key = getDedupKey(lTrack.title, lTrack.artist);
    if (!seenTracks.has(key)) {
      seenTracks.add(key);
      const userAcq = userPurchasesMap.get(key) ||
        userPurchasesMap.get(`local_db_${lTrack.id}`) ||
        userPurchasesMap.get(`track_id_ct-${lTrack.id}`) ||
        null;
      finalTracks.push(formatTrack(lTrack, Boolean(userAcq), userAcq));
    }
  }

  // Ajuste do destaque de artista: se o usuário pesquisou exatamente pelo título de uma música
  // e ela é uma faixa comprada de alta relevância, não sobrepõe com perfil solto não relacionado
  let artistObj = catalogResult.artist;
  if (finalTracks.length > 0 && finalTracks[0].isPurchased) {
    const topTitleClean = cleanSimple(finalTracks[0].title);
    if (topTitleClean === qClean || topTitleClean.includes(qClean) || qClean.includes(topTitleClean)) {
      if (artistObj && cleanSimple(artistObj.name) !== cleanSimple(finalTracks[0].artist) && (artistObj.fansCount || 0) < 50000) {
        artistObj = null;
      }
    }
  }

  return {
    artist: artistObj,
    artists: catalogResult.artists || [],
    tracks: finalTracks
  };
}

/**
 * GET /api/music/search?q={query}
 * Busca faixas e entidades para autocomplete e resultados gerais de pesquisa.
 * Integra catálogo Deezer/iTunes, catálogo local e biblioteca pessoal (compradas/alugadas).
 */
router.get('/search', verifyToken.optional, async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Parâmetro "q" é obrigatório.' });
  }

  const cleanQ = (q || '').toLowerCase().trim();
  const userId = req.user?.id || req.query.userId || null;

  try {
    let catalogResult = null;

    if (searchCache.has(cleanQ)) {
      catalogResult = searchCache.get(cleanQ);
    } else {
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
            bannerImg: isBk ? 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025316/bookhub/img/bk_banner.png' : avatarPhoto,
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
          const avatarPhoto = safeUpgradeAvatar(getArtistPhoto(a, a.name) || a.picture_xl || a.picture_big || a.picture_medium);
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
          artist: artistSyncService.formatTrackArtists(t, t.artist?.name || 'Artista'),
          album: t.album?.title || 'Single',
          sub: `Música • ${artistSyncService.formatTrackArtists(t, t.artist?.name || 'Artista')} • ${t.album?.title || 'Single'}`,
          cover: t.album?.cover_big || t.album?.cover_medium,
          preview: t.preview,
          durationSec: dur,
          duration: `${min}:${String(sec).padStart(2, '0')}`,
          plays: generatePlaysCount(idx),
          explicit: t.explicit_lyrics || false
        };
      });

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

      // Fallback local: se a busca externa retornar vazia ou poucas faixas
      if (mappedTracks.length === 0 || !artistObj) {
        try {
          const localArtists = readJsonFile(path.join(__dirname, '../../data/artists.json'), []);
          const localAlbums = readJsonFile(path.join(__dirname, '../../data/albums.json'), []);
          const localTracks = readJsonFile(path.join(__dirname, '../../data/company_tracks.json'), []);

          if (!artistObj) {
            const matchedArt = localArtists.find(a => {
              const aClean = cleanSimple(a.name);
              return aClean === qClean || aClean.includes(qClean) || qClean.includes(aClean);
            });
            if (matchedArt) {
              const isBk = cleanSimple(matchedArt.name) === 'bk';
              artistObj = {
                id: `artist-${matchedArt.id || matchedArt.name.toLowerCase()}`,
                name: matchedArt.name,
                fansCount: 1500000,
                avatarImg: matchedArt.avatar_url || matchedArt.avatarImg || (isBk ? 'https://cdn-images.dzcdn.net/images/artist/7481fc25e9bf8f0d8c416ecb9104927d/1000x1000-000000-80-0-0.jpg' : null),
                bannerImg: matchedArt.banner_url || (isBk ? 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025316/bookhub/img/bk_banner.png' : null),
                bannerPosition: getArtistBannerPosition(matchedArt.name),
                listeners: matchedArt.monthly_listeners ? `${matchedArt.monthly_listeners} ouvintes mensais` : '1,5 mi ouvintes mensais',
                subscribers: '1,2 mi',
                bio: matchedArt.bio || `${matchedArt.name} é um artista cadastrado no catálogo oficial DevSongs.`
              };
              if (!allArtists.some(a => cleanSimple(a.name) === cleanSimple(matchedArt.name))) {
                allArtists.unshift(artistObj);
              }
            }
          }

          if (mappedTracks.length === 0) {
            const matchingLocalTracks = localTracks.filter(t => {
              const tTitleClean = cleanSimple(t.title);
              const tArtistClean = cleanSimple(t.artist);
              const tAlbumClean = cleanSimple(t.album);
              return tTitleClean.includes(qClean) || tArtistClean.includes(qClean) || tAlbumClean.includes(qClean) || qClean.includes(tArtistClean);
            });

            if (matchingLocalTracks.length > 0) {
              mappedTracks = matchingLocalTracks.map((t, idx) => {
                const dur = t.duration_sec || 210;
                const min = Math.floor(dur / 60);
                const sec = dur % 60;
                return {
                  id: `ct-${t.id}`,
                  dbTrackId: t.id,
                  type: 'song',
                  title: t.title,
                  artist: t.artist,
                  album: t.album || 'Single',
                  sub: `Música • ${t.artist} • ${t.album || 'Single'}`,
                  cover: t.cover_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png',
                  preview: t.preview_url,
                  durationSec: dur,
                  duration: `${min}:${String(sec).padStart(2, '0')}`,
                  plays: generatePlaysCount(idx),
                  explicit: false,
                  albumId: t.album_id
                };
              });
            }
          }
        } catch (localErr) {
          console.warn('Erro ao consultar fallback local de busca:', localErr.message);
        }
      }

      catalogResult = {
        artist: artistObj,
        artists: allArtists,
        tracks: mappedTracks
      };

      if (mappedTracks.length > 0 || artistObj) {
        if (searchCache.size > 300) searchCache.clear();
        searchCache.set(cleanQ, catalogResult);
      }
    }

    // Enriquece os resultados integrando faixas compradas/alugadas da biblioteca do usuário
    const finalResult = await enrichSearchResultsWithUserLibrary(catalogResult, userId, q);
    return res.json(finalResult);
  } catch (err) {
    console.error('Erro na rota /api/music/search:', err);
    return res.status(500).json({ error: 'Erro ao buscar faixas' });
  }
});

/**
 * GET /api/music/track-access
 * Verificação formal e em tempo real de autorização de reprodução para o usuário autenticado.
 * Valida compras individuais, aluguéis ativos (30 dias) e propriedade integral de álbuns.
 */
router.get('/track-access', verifyToken.optional, async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const { title, artist, album, albumId, trackId } = req.query;

    const trackObj = {
      id: trackId,
      dbTrackId: trackId,
      title: title || '',
      artist: artist || '',
      album: album || '',
      album_id: albumId,
      albumId: albumId
    };

    const access = await libraryStorage.evaluateTrackAccess(trackObj, userId);

    return res.json({
      success: true,
      canPlay: access.can_play,
      isOwned: access.access_status === 'purchased',
      isRentedActive: access.access_status === 'rented' || access.access_status === 'rent_active',
      isLocked: access.is_locked,
      isExpired: access.is_expired,
      accessStatus: access.access_status,
      type: access.type,
      reason: access.reason
    });
  } catch (err) {
    console.error('Erro ao verificar acesso à faixa:', err);
    return res.status(500).json({ error: 'Erro ao avaliar autorização de reprodução' });
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
    
    // 1. Busca primeiro álbuns com data real via endpoint de artista do Deezer
    let albums = [];
    const artSearch = await fetchWithTimeout(`https://api.deezer.com/search/artist?q=${encodeURIComponent(artistName || '')}&limit=1`, {}, 1800)
      .then(r => r.json()).catch(() => ({ data: [] }));

    if (artSearch.data && artSearch.data[0]?.id) {
      const albRes = await fetchWithTimeout(`https://api.deezer.com/artist/${artSearch.data[0].id}/albums?limit=50`, {}, 2200)
        .then(r => r.json()).catch(() => ({ data: [] }));
      albums = albRes.data || [];
    }

    if (!albums || albums.length === 0) {
      const searchRes = await fetchWithTimeout(`https://api.deezer.com/search/album?q=${encodeURIComponent(artistName || 'Brasil')}&limit=15`, {}, 2200)
        .then(r => r.json())
        .catch(() => ({ data: [] }));
      albums = searchRes.data || [];
    }
    
    const unique = [];
    const seen = new Set();
    if (curNorm) seen.add(curNorm);
    
    for (const alb of albums) {
      const albArtist = alb.artist?.name || artistName;
      if (isBootlegTrack(alb.title, albArtist)) continue;
      if (/instrumental/i.test(alb.title)) continue;
      const norm = cleanSimple(alb.title);
      if (seen.has(norm) || (currentAlbumId && String(alb.id) === String(currentAlbumId))) continue;
      seen.add(norm);

      const yearResolved = getKnownAlbumYear(alb.title, albArtist) || (alb.release_date ? alb.release_date.slice(0, 4) : '2024');

      unique.push({
        id: `dz-alb-${alb.id}`,
        albumId: alb.id,
        title: alb.title,
        artist: albArtist,
        cover: alb.cover_xl || alb.cover_big || alb.cover_medium,
        year: yearResolved,
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
            const sArtist = simAlb.artist?.name || simArtist;
            if (isBootlegTrack(simAlb.title, sArtist)) continue;
            if (/instrumental/i.test(simAlb.title)) continue;
            const norm = cleanSimple(simAlb.title);
            if (seen.has(norm)) continue;
            seen.add(norm);

            const simYearResolved = getKnownAlbumYear(simAlb.title, sArtist) || (simAlb.release_date ? simAlb.release_date.slice(0, 4) : '2024');

            unique.push({
              id: `dz-alb-${simAlb.id}`,
              albumId: simAlb.id,
              title: simAlb.title,
              artist: sArtist,
              cover: simAlb.cover_xl || simAlb.cover_big || simAlb.cover_medium,
              year: simYearResolved,
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

    const isDeezerPrefixed = (albumId || '').startsWith('dz-alb-') || (albumId || '').startsWith('dz-feat-');
    const isItunesId = (albumId || '').startsWith('it-alb-');
    const rawId = (albumId || '').replace('dz-alb-', '').replace('dz-feat-', '').replace('it-alb-', '');

    // 0. Verifica se o álbum pertence ao acervo interno (albums.json)
    let localAlbums = [];
    try {
      const albumsPath = path.join(__dirname, '../../data/albums.json');
      if (fs.existsSync(albumsPath)) {
        localAlbums = JSON.parse(fs.readFileSync(albumsPath, 'utf8'));
      }
    } catch (_) {}

    const localMatch = (!isDeezerPrefixed && !isItunesId && albumId)
      ? localAlbums.find(a => String(a.id) === String(albumId))
      : localAlbums.find(a => {
          if (title && cleanSimple(a.title) === tClean) {
            if (!artist) return true;
            const albArt = cleanSimple(a.artist_name || a.artist);
            return albArt.includes(aClean) || aClean.includes(albArt);
          }
          return false;
        });

    const effectiveTitle = localMatch?.title || title || '';
    const effectiveArtist = localMatch?.artist_name || localMatch?.artist || artist || '';
    const query = `${effectiveArtist} ${effectiveTitle}`.trim();
    const effectiveAClean = cleanSimple(effectiveArtist);
    const effectiveTClean = cleanSimple(effectiveTitle);

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
          year: getKnownAlbumYear(albItem?.collectionName || title, albItem?.artistName || artist) || (albItem?.releaseDate ? albItem.releaseDate.slice(0, 4) : '2024'),
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

    // 2. Se for ID numérico direto do Deezer (com prefixo dz-alb- ou numérico Deezer externo não catalogado internamente)
    if (rawId && !isNaN(rawId) && !isItunesId && (isDeezerPrefixed || (!localMatch && Number(rawId) > 1000))) {
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
          year: getKnownAlbumYear(albumData.title, albumData.artist?.name || artist) || (albumData.release_date ? albumData.release_date.slice(0, 4) : '2024'),
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
        const artMatches = !effectiveAClean || albArt.includes(effectiveAClean) || effectiveAClean.includes(albArt);
        const titMatches = !effectiveTClean || albTit.includes(effectiveTClean) || effectiveTClean.includes(albTit);
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
          artistName: localMatch?.artist_name || albumData?.artist?.name || bestDeezerAlbum.artist?.name || effectiveArtist || 'Artista',
          artistAvatar: albumData?.artist?.picture_small || albumData?.artist?.picture_medium,
          artistId: localMatch?.artist_id || albumData?.artist?.id || bestDeezerAlbum.artist?.id,
          year: getKnownAlbumYear(albumData?.title || bestDeezerAlbum.title, albumData?.artist?.name || bestDeezerAlbum.artist?.name || artist) || (albumData?.release_date ? albumData.release_date.slice(0, 4) : '2024'),
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
          year: getKnownAlbumYear(bestItunesAlbum.collectionName || title, bestItunesAlbum.artistName || artist) || (bestItunesAlbum.releaseDate ? bestItunesAlbum.releaseDate.slice(0, 4) : '2024'),
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

    if (localMatch) {
      let companyTracks = [];
      try {
        const ctPath = path.join(__dirname, '../../data/company_tracks.json');
        if (fs.existsSync(ctPath)) {
          companyTracks = JSON.parse(fs.readFileSync(ctPath, 'utf8'));
        }
      } catch (_) {}

      const localAlbumTracks = companyTracks.filter(t => Number(t.album_id) === Number(localMatch.id));
      const mappedLocal = localAlbumTracks.map((t, idx) => ({
        id: `ct-track-${t.id}`,
        trackNumber: idx + 1,
        title: t.title,
        artist: t.artist || effectiveArtist,
        album: localMatch.title,
        cover: t.cover_url || localMatch.cover_url,
        preview: t.preview_url,
        durationSec: t.duration_sec || 210,
        duration: `${Math.floor((t.duration_sec || 210) / 60)}:${String((t.duration_sec || 210) % 60).padStart(2, '0')}`,
        plays: '1,2 mi',
        explicit: false
      }));

      const albumDetails = {
        id: localMatch.id,
        albumId: localMatch.id,
        title: localMatch.title,
        cover: localMatch.cover_url,
        artistName: effectiveArtist,
        artistAvatar: '',
        artistId: localMatch.artist_id || null,
        year: localMatch.release_date ? String(localMatch.release_date).slice(0, 4) : '2024',
        nbTracks: mappedLocal.length,
        durationSec: mappedLocal.reduce((acc, t) => acc + (t.durationSec || 0), 0),
        explicit: false,
        recordType: 'album',
        priceSale: 'R$ 29,90',
        priceRent: 'R$ 9,90'
      };

      const relatedList = await getRelatedAlbums(effectiveArtist, localMatch.title, localMatch.id);
      return res.json({ album: albumDetails, tracks: mappedLocal, relatedAlbums: relatedList });
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
          artist: artistSyncService.formatTrackArtists(t, t.artist?.name || 'Artista'),
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

// =========================================================================
// ROTAS DE HISTÓRICO DE REPRODUÇÃO & RECOMENDAÇÕES PERSONALIZADAS
// =========================================================================

// GET /api/music/history - Histórico estritamente isolado do usuário autenticado
router.get('/history', verifyToken, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const history = await libraryStorage.getUserPlaybackHistory(req.user.id, limit);
    return res.json({ success: true, count: history.length, history });
  } catch (err) {
    console.error('Erro ao buscar histórico de reprodução:', err);
    return res.status(500).json({ error: 'Erro ao buscar histórico de reprodução' });
  }
});

// POST /api/music/history - Registra reprodução associada ao usuário autenticado
router.post('/history', verifyToken, async (req, res) => {
  try {
    const { track } = req.body;
    if (!track) {
      return res.status(400).json({ error: 'Faixa não informada para registro de histórico.' });
    }
    const record = await libraryStorage.recordPlayback(req.user.id, track);
    return res.json({ success: true, record });
  } catch (err) {
    console.error('Erro ao registrar histórico de reprodução:', err);
    return res.status(500).json({ error: 'Erro ao registrar reprodução no histórico.' });
  }
});

// GET /api/music/recommendations - Recomendações inteligentes personalizadas para a Home
router.get('/recommendations', verifyToken.optional, async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const recommendations = await recommendationService.getUserHomeRecommendations(userId);
    return res.json({ success: true, ...recommendations });
  } catch (err) {
    console.error('Erro ao gerar recomendações personalizadas:', err);
    return res.status(500).json({ error: 'Erro ao gerar recomendações para a Home.' });
  }
});

module.exports = router;
