const libraryStorage = require('./libraryStorage');

// Cache em memória com TTL de 1 hora para evitar requisições redundantes a cada abertura de tela
const discographyCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

/**
 * Utilitário de fetch com timeout para chamadas de APIs externas
 */
async function fetchWithTimeout(url, opts = {}, timeoutMs = 4500) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    clearTimeout(timer);
    return res;
  } catch (_) {
    clearTimeout(timer);
    return null;
  }
}

const cleanStr = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
const cleanSimple = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['"`.,\s-]/g, '');

const isBootlegPattern = /\b(mtg|montagem|slowed|sped\s*up|speed\s*up|reverb|bass\s*boosted|nightcore|tributo|tribute|karaoke|instrumental|8d\s*audio|remix\s*funk|funk\s*remix|mega\s*mix|megamix|mega\s*funk|piseiro\s*remix|trap\s*remix|dano\s*sarrada|tropa|braba|anti\s*oruam|dono da favela|hardhouse|tidy\s*weekender|nukleuz)\b|^mtg\b|[\(\[]\s*mtg\b/i;

function isBootlegTrack(title, artist) {
  if (!title) return false;
  if (isBootlegPattern.test(title)) return true;
  if (artist && isBootlegPattern.test(artist)) return true;
  return false;
}

function stripMC(s) {
  return cleanSimple(s).replace(/^mc/, '');
}

/**
 * Valida se um artista é exatamente o alvo ou co-autor principal (evitando homônimos como Pablo Leall vs LEALL)
 */
function isExactOrCoArtist(targetName, candidateArtist) {
  if (!targetName || !candidateArtist) return false;
  const cleanTarget = targetName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const cleanCandidate = candidateArtist.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (cleanTarget === cleanCandidate) return true;

  // Se o candidato for uma colaboração (ex: 'LEALL & Rock Danger', 'LEALL, Veigh', 'LEALL feat. ...')
  const splitArtists = cleanCandidate.split(/[,&/x+–—]|\s+e\s+|\s+feat\.?\s+|\s+ft\.?\s+|\s+part\.?\s+/i).map(s => s.trim());
  if (splitArtists.includes(cleanTarget)) return true;

  return false;
}

function matchArtistName(query, artistName) {
  if (!query || !artistName) return false;
  return isExactOrCoArtist(query, artistName);
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
      matchLevel = 4;
    } else if (aNoMC === qNoMC) {
      matchLevel = 4;
    } else if (aNoMC.startsWith(qNoMC) || qNoMC.startsWith(aNoMC)) {
      matchLevel = 3;
    } else if (isExactOrCoArtist(query, a.name)) {
      matchLevel = 2;
    } else {
      matchLevel = 1;
    }

    const isCollab = !query.includes('&') && !query.includes(',') &&
      (a.name.includes('feat') || a.name.includes('featuring') || a.name.includes('&') || a.name.includes(','));
    if (isCollab) matchLevel -= 2;

    const pic = a.picture_xl || a.picture_big || a.picture_medium;
    if (!pic || pic.includes('/images/artist//') || pic.includes('/default') || pic.endsWith('/')) matchLevel -= 1;

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

// Tabela de anos reais de lançamento para álbuns e faixas icônicos
function getKnownAlbumYear(title, artist) {
  if (!title) return null;
  const clean = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const t = clean(title);
  const a = clean(artist);

  if (a.includes('leall') || t.includes('leall')) {
    if (t.includes('esculpidoamachado')) return '2021';
    if (t.includes('euaindatenho')) return '2023';
    if (t.includes('sala')) return '2026';
    if (t.includes('alibi')) return '2025';
    if (t.includes('nocantodoclub')) return '2026';
    if (t.includes('viradadechave')) return '2026';
    if (t.includes('pescador')) return '2025';
    if (t.includes('sentimentodeculpa')) return '2025';
    if (t.includes('voosinternacionais')) return '2025';
  }
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
  if (a.includes('bk') || a.includes('abebe')) {
    if (t.includes('castelos')) return '2016';
    if (t.includes('gigantes')) return '2018';
    if (t.includes('lideremmovimento')) return '2020';
    if (t.includes('cidadedopecado')) return '2021';
    if (t.includes('icarus')) return '2022';
    if (t.includes('diamantes')) return '2025';
    if (t.includes('produtodoambiente')) return '2024';
  }
  if (a.includes('baco')) {
    if (t.includes('esu')) return '2017';
    if (t.includes('bluesman')) return '2018';
    if (t.includes('bacanal')) return '2020';
    if (t.includes('qvvjfa') || t.includes('quantasvezes')) return '2022';
    if (t.includes('fetiche')) return '2024';
  }
  if (a.includes('matue')) {
    if (t.includes('maquinadotempo')) return '2020';
    if (t.includes('333')) return '2024';
  }
  if (a.includes('ret')) {
    if (t.includes('vivaz')) return '2012';
    if (t.includes('revel')) return '2015';
    if (t.includes('audaz')) return '2018';
    if (t.includes('imaterial')) return '2021';
    if (t.includes('lume')) return '2022';
    if (t.includes('frxv')) return '2023';
  }
  if (a.includes('veigh')) {
    if (t.includes('dosprediosdeluxe')) return '2023';
    if (t.includes('dospredios')) return '2022';
  }

  // Projetos colaborativos e álbuns icônicos de participações
  if (t.includes('poesiaacustica')) {
    if (t.includes('2') || t.includes('sobrenos')) return '2017';
    if (t.includes('3') || t.includes('capricomio')) return '2017';
    if (t.includes('4') || t.includes('todomundoodeia')) return '2018';
    if (t.includes('5') || t.includes('telemovel')) return '2018';
    if (t.includes('6') || t.includes('eraumavez')) return '2018';
    if (t.includes('7') || t.includes('ceuazul')) return '2019';
    if (t.includes('8') || t.includes('tirocerteiro')) return '2020';
    if (t.includes('9') || t.includes('melhorforma')) return '2020';
    if (t.includes('10') || t.includes('recomecar')) return '2020';
    if (t.includes('11') || t.includes('nadamuda')) return '2021';
    if (t.includes('12') || t.includes('prasempre')) return '2022';
    if (t.includes('13')) return '2022';
    if (t.includes('14')) return '2023';
    if (t.includes('15')) return '2023';
    if (t.includes('16')) return '2024';
  }
  if (t.includes('vidacara')) return '2023';
  if (t.includes('fksongs')) return '2022';
  if (t.includes('perdaseganhos')) return '2023';
  if (t.includes('alfa')) return '2023';
  if (t.includes('depoisdobaile')) return '2024';
  if (t.includes('flowespacial')) return '2023';
  if (t.includes('vampiro')) return '2022';
  if (t.includes('ocaradomomento')) return '2023';
  if (t.includes('magicshow')) return '2023';
  if (t.includes('amoreodio')) return '2024';
  if (t.includes('manualdecomoamarerrado')) return '2022';
  if (t.includes('vagabundodeluxo')) return '2024';
  if (t.includes('maiorqueotempo')) return '2024';
  if (t.includes('colapsoglobal')) return '2024';
  if (t.includes('piramideperdida')) return '2021';
  if (t.includes('vivendoavancado')) return '2017';
  if (t.includes('nume')) return '2023';
  if (t.includes('euodeioodiadosnamorados')) return '2024';
  if (t.includes('forcadajuventude')) return '2024';
  if (t.includes('exalta')) return '2023';
  if (t.includes('ogum')) return '2023';
  if (t.includes('purpura')) return '2023';

  return null;
}

function getRootAlbumTitle(title) {
  return cleanStr(title)
    .replace(/['"`]/g, '')
    .replace(/\s*\([^)]*(deluxe|edition|version|clean|edited|anniversary|bonus|complete|expanded|special|international|explicit|remastered|track by track|acoustic collection|feat|ft\.|part\.|prod\.)[^)]*\)/gi, '')
    .replace(/\s*\[[^\]]*(deluxe|edition|version|clean|edited|anniversary|bonus|complete|expanded|special|international|explicit|remastered|track by track|acoustic collection|feat|ft\.|part\.|prod\.)[^\]]*\]/gi, '')
    .replace(/\s*(feat\.|ft\.|featuring|part\.|participação).*$/gi, '')
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
  if (/edited|clean/i.test(t)) return 0;
  if (/\(feat|\bfeat\b|\bft\b/i.test(t)) return 0.5;
  if (/deluxe|reloaded|expanded|complete|anniversary|bonus track/i.test(t)) return 2;
  return 1;
}

function isSoundtrackOrVarious(title) {
  return /soundtrack|motion picture|music from and inspired by|various artists|coletânea|\bsessions\b|def jam sessions/i.test(title);
}

function isSingleOrRemixPack(title, recordType) {
  if (recordType === 'single' || recordType === 'ep') return true;
  if (recordType === 'album') return false;
  if (/single|ep|\(remix|\bremixes\b|\bremixed\b|\bthe remixes\b|\bdance remix\b|\ba cappellas\b|\binstrumentals\b|\b2 trk\b|\b2-track\b/i.test(title)) return true;
  return false;
}

/**
 * 1. Busca discografia oficial Deezer COM PAGINAÇÃO
 */
async function fetchDeezerOfficialAlbums(artistId, maxPages = 4) {
  const allAlbums = [];
  let index = 0;
  const limit = 100;

  for (let page = 0; page < maxPages; page++) {
    const url = `https://api.deezer.com/artist/${artistId}/albums?limit=${limit}&index=${index}`;
    const res = await fetchWithTimeout(url, {}, 3500);
    if (!res || !res.ok) break;
    const json = await res.json().catch(() => null);
    if (!json || !json.data || json.data.length === 0) break;

    allAlbums.push(...json.data);
    if (json.total && allAlbums.length >= json.total) break;
    if (json.data.length < limit) break;
    index += limit;
  }

  return allAlbums;
}

/**
 * 2. Busca lançamentos co-creditados e álbuns de gravadora no Deezer COM PAGINAÇÃO
 */
async function fetchDeezerSearchAlbums(queryTerm, maxPages = 2) {
  const allAlbums = [];
  let index = 0;
  const limit = 50;

  for (let page = 0; page < maxPages; page++) {
    const url = `https://api.deezer.com/search/album?q=${encodeURIComponent(queryTerm)}&limit=${limit}&index=${index}`;
    const res = await fetchWithTimeout(url, {}, 3500);
    if (!res || !res.ok) break;
    const json = await res.json().catch(() => null);
    if (!json || !json.data || json.data.length === 0) break;

    allAlbums.push(...json.data);
    if (json.total && allAlbums.length >= json.total) break;
    if (json.data.length < limit) break;
    index += limit;
  }

  return allAlbums;
}

/**
 * 3. Busca faixas e singles diretos no Deezer COM PAGINAÇÃO
 */
async function fetchDeezerDirectTracks(artistName, maxPages = 2) {
  const allTracks = [];
  let index = 0;
  const limit = 100;

  for (let page = 0; page < maxPages; page++) {
    const url = `https://api.deezer.com/search?q=${encodeURIComponent(artistName)}&limit=${limit}&index=${index}`;
    const res = await fetchWithTimeout(url, {}, 3500);
    if (!res || !res.ok) break;
    const json = await res.json().catch(() => null);
    if (!json || !json.data || json.data.length === 0) break;

    allTracks.push(...json.data);
    if (json.total && allTracks.length >= json.total) break;
    if (json.data.length < limit) break;
    index += limit;
  }

  return allTracks;
}

/**
 * 4. Busca discografia canônica no MusicBrainz
 */
async function fetchMusicBrainzDiscography(artistName) {
  try {
    const queryUrl = `https://musicbrainz.org/ws/2/artist?query=artist:${encodeURIComponent(artistName)}&fmt=json`;
    const searchRes = await fetchWithTimeout(queryUrl, {
      headers: { 'User-Agent': 'DevSongs/1.0 (contact@devsongs.com.br)' }
    }, 3500);

    if (!searchRes || !searchRes.ok) return [];
    const searchJson = await searchRes.json().catch(() => null);
    if (!searchJson || !searchJson.artists || searchJson.artists.length === 0) return [];

    const cleanTarget = cleanSimple(artistName);
    const matchedArtist = searchJson.artists.find(a => cleanSimple(a.name) === cleanTarget) || searchJson.artists[0];
    if (!matchedArtist || !matchedArtist.id) return [];

    const rgUrl = `https://musicbrainz.org/ws/2/release-group?artist=${matchedArtist.id}&limit=100&fmt=json`;
    const rgRes = await fetchWithTimeout(rgUrl, {
      headers: { 'User-Agent': 'DevSongs/1.0 (contact@devsongs.com.br)' }
    }, 4000);

    if (!rgRes || !rgRes.ok) return [];
    const rgJson = await rgRes.json().catch(() => null);
    return rgJson && rgJson['release-groups'] ? rgJson['release-groups'] : [];
  } catch (_) {
    return [];
  }
}

/**
 * 5. Busca álbuns no iTunes BR
 */
async function fetchItunesAlbums(artistName) {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=album&limit=200&country=BR`;
    const res = await fetchWithTimeout(url, {}, 3500);
    if (!res || !res.ok) return [];
    const json = await res.json().catch(() => null);
    return json && json.results ? json.results : [];
  } catch (_) {
    return [];
  }
}

/**
 * Formata os artistas participantes de uma faixa (ex: "Matuê e Veigh", "MC PH, Vulgo FK e Veigh")
 */
function formatTrackArtists(track, contextualArtist = '') {
  if (!track) return contextualArtist || 'Artista';
  if (typeof track === 'string') return track;

  const names = [];
  const seen = new Set();

  function addName(n) {
    if (!n || typeof n !== 'string') return;
    const clean = n.trim();
    if (!clean) return;
    const k = clean.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      names.push(clean);
    }
  }

  // 1. Contribuidores estruturados da API (Deezer)
  if (Array.isArray(track.contributors) && track.contributors.length > 0) {
    for (const c of track.contributors) {
      if (c && c.name) addName(c.name);
    }
  }

  // 2. Artista principal
  const mainArtist = track.artist?.name || (typeof track.artist === 'string' ? track.artist : '');
  if (mainArtist) {
    const parts = mainArtist.split(/[,&/]| e /i).map(s => s.trim()).filter(Boolean);
    for (const p of parts) addName(p);
  }

  // 3. Participações no título (ex: "(part. Veigh, Vulgo FK)" ou "(feat. Veigh)")
  const title = track.title || '';
  const featMatch = title.match(/\((?:feat\.|ft\.|part\.|participa[çc][ãa]o)\s*([^)]+)\)/i);
  if (featMatch) {
    const featParts = featMatch[1].split(/[,&/]| e /i).map(s => s.trim()).filter(Boolean);
    for (const p of featParts) addName(p);
  }

  // 4. Se o artista do perfil onde estamos participou e não estava no nome
  if (contextualArtist) {
    addName(contextualArtist);
  }

  if (names.length === 0) return contextualArtist || 'Artista';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} e ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

/**
 * Sincroniza a discografia completa de um artista
 * @param {string} query Nome do artista
 * @param {string|number} artistId ID verificado externo ou local
 * @param {boolean} forceSync Forçar atualização ignorando cache
 */
async function syncArtistDiscography(query, artistId = null, forceSync = false) {
  const isDeezerPrefixed = artistId ? String(artistId).startsWith('dz-artist-') : false;
  const rawArtistId = artistId ? String(artistId).replace('dz-artist-', '').replace('it-artist-', '') : '';
  const cleanQ = (query || '').toLowerCase().trim();

  // Verifica se corresponde a um artista catalogado localmente no DevSongs
  let localArtist = null;
  try {
    const fs = require('fs');
    const path = require('path');
    const artistsPath = path.join(__dirname, '../../data/artists.json');
    if (fs.existsSync(artistsPath)) {
      const allLocal = JSON.parse(fs.readFileSync(artistsPath, 'utf8'));
      if (rawArtistId && !isDeezerPrefixed && !isNaN(rawArtistId)) {
        localArtist = allLocal.find(a => Number(a.id) === Number(rawArtistId));
      }
      if (!localArtist && query) {
        const artistResolver = require('./artistResolver');
        localArtist = artistResolver.findMatchingArtist(query, allLocal);
      }
      if (!localArtist && rawArtistId) {
        const artistResolver = require('./artistResolver');
        localArtist = artistResolver.findMatchingArtist(rawArtistId, allLocal);
      }
    }
  } catch (_) {}

  const effectiveQuery = localArtist?.name || query || '';
  const cacheKey = localArtist ? `local:${localArtist.id}` : (isDeezerPrefixed ? `dz:${rawArtistId}` : `q:${cleanSimple(effectiveQuery)}`);

  // 1. Verifica cache em memória
  if (!forceSync && discographyCache.has(cacheKey)) {
    const cached = discographyCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  // 2. Identifica o artista no Deezer (perfil oficial)
  let bestArtist = null;
  // Só consulta diretamente por ID do Deezer se tiver prefixo explícito 'dz-artist-' ou for um ID longo (> 100000) e não for um ID do banco local
  if (rawArtistId && !isNaN(rawArtistId) && (isDeezerPrefixed || (!localArtist && Number(rawArtistId) > 100000))) {
    try {
      const direct = await fetchWithTimeout(`https://api.deezer.com/artist/${rawArtistId}`, {}, 3000);
      if (direct && direct.ok) {
        const json = await direct.json().catch(() => null);
        if (json && json.id && !json.error) bestArtist = json;
      }
    } catch (_) {}
  }

  if (!bestArtist) {
    const searchRes = await fetchWithTimeout(`https://api.deezer.com/search/artist?q=${encodeURIComponent(effectiveQuery || '')}&limit=30`, {}, 3500);
    if (searchRes && searchRes.ok) {
      const searchJson = await searchRes.json().catch(() => null);
      if (searchJson && searchJson.data && searchJson.data.length > 0) {
        bestArtist = pickBestArtistCandidate(searchJson.data, effectiveQuery);
      }
    }
  }

  if (!bestArtist) {
    // Fallback: iTunes
    const itunesAlbums = await fetchItunesAlbums(query);
    if (itunesAlbums.length > 0) {
      const topAlb = itunesAlbums[0];
      const result = {
        artist: {
          id: `it-artist-${topAlb.artistId || cleanSimple(topAlb.artistName)}`,
          name: topAlb.artistName,
          listeners: '1,2 mi ouvintes mensais',
          bio: `${topAlb.artistName} é um artista com lançamentos na DevSongs.`,
          bannerImg: topAlb.artworkUrl100?.replace('100x100bb', '600x600bb') || '',
          avatarImg: topAlb.artworkUrl100?.replace('100x100bb', '600x600bb') || '',
          subscribers: '500 mil'
        },
        tracks: [],
        albums: itunesAlbums.map(alb => ({
          id: `it-alb-${alb.collectionId}`,
          title: alb.collectionName,
          artist: alb.artistName,
          cover: alb.artworkUrl100?.replace('100x100bb', '600x600bb') || '',
          year: alb.releaseDate ? alb.releaseDate.slice(0, 4) : '2024',
          recordType: 'album',
          priceSale: 'R$ 29,90',
          priceRent: 'R$ 9,90'
        })),
        singles: [],
        appearsOn: []
      };
      discographyCache.set(cacheKey, { timestamp: Date.now(), data: result });
      return result;
    }

    return {
      artist: {
        id: 'unknown',
        name: query,
        listeners: '0 ouvintes',
        bio: `Nenhum resultado encontrado para "${query}".`,
        bannerImg: 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025309/bookhub/img/artist_banner_justin.jpg',
        avatarImg: 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025309/bookhub/img/artist_banner_justin.jpg',
        subscribers: '0'
      },
      tracks: [],
      albums: [],
      singles: [],
      appearsOn: []
    };
  }

  // 3. Executa busca paralela abrangente nas fontes
  const [
    officialDeezerAlbums,
    searchDeezerAlbums,
    liveDeezerAlbums,
    directDeezerTracks,
    topTracksRes,
    collaborativeFeatTracks,
    collaborativePartTracks,
    musicBrainzReleaseGroups,
    itunesAlbums
  ] = await Promise.all([
    fetchDeezerOfficialAlbums(bestArtist.id, 4),
    fetchDeezerSearchAlbums(bestArtist.name, 3),
    fetchDeezerSearchAlbums(bestArtist.name + ' Ao Vivo', 1),
    fetchDeezerDirectTracks(bestArtist.name, 2),
    fetchWithTimeout(`https://api.deezer.com/artist/${bestArtist.id}/top?limit=100`, {}, 3500)
      .then(r => r ? r.json() : null)
      .then(j => j ? j.data || [] : [])
      .catch(() => []),
    fetchWithTimeout(`https://api.deezer.com/search?q=${encodeURIComponent('feat ' + bestArtist.name)}&limit=50`, {}, 3500)
      .then(r => r ? r.json() : null)
      .then(j => j ? j.data || [] : [])
      .catch(() => []),
    fetchWithTimeout(`https://api.deezer.com/search?q=${encodeURIComponent('part ' + bestArtist.name)}&limit=50`, {}, 3500)
      .then(r => r ? r.json() : null)
      .then(j => j ? j.data || [] : [])
      .catch(() => []),
    fetchMusicBrainzDiscography(bestArtist.name),
    fetchItunesAlbums(bestArtist.name)
  ]);

  // 4. Formata dados do perfil do artista
  const fans = bestArtist.nb_fan || 500000;
  const listenersStr = fans >= 1000000
    ? `${(fans / 1000000).toFixed(1).replace('.', ',')} mi ouvintes mensais`
    : (fans >= 1000 ? `${Math.round(fans / 1000)} mil ouvintes mensais` : `${fans} ouvintes mensais`);
  const subsStr = fans >= 1000000
    ? `${(fans / 1000000).toFixed(1).replace('.', ',')} mi`
    : (fans >= 1000 ? `${Math.round(fans / 1000)} mil` : `${fans}`);

  const isBk = cleanSimple(bestArtist.name) === 'bk' || cleanSimple(query) === 'bk';
  const avatarPhoto = (bestArtist.picture_xl || bestArtist.picture_big || bestArtist.picture_medium) ||
    (isBk ? 'https://cdn-images.dzcdn.net/images/artist/7481fc25e9bf8f0d8c416ecb9104927d/1000x1000-000000-80-0-0.jpg' : 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png');

  const displayName = isBk ? 'BK' : (localArtist ? localArtist.name : bestArtist.name);

  const artistObj = {
    id: `dz-artist-${bestArtist.id}`,
    name: displayName,
    avatarImg: avatarPhoto,
    bannerImg: isBk ? 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025316/bookhub/img/bk_banner.png' : avatarPhoto,
    bannerPosition: isBk ? 'center top' : (displayName.toLowerCase().includes('baco') ? 'center 16%' : 'center 18%'),
    listeners: listenersStr,
    subscribers: subsStr,
    bio: isBk
      ? "Uma das vozes mais contundentes dentro do rap nacional, Abebe Bikila, mais conhecido como BK', é um rapper carioca que carrega em suas rimas as vivências de um corpo negro dentro das grandes metrópoles."
      : (localArtist?.bio || `${displayName} é um dos artistas mais ouvidos do momento, acumulando milhares de reproduções e fãs por todo o país.`)
  };

  // 5. Mapeia e deduplica músicas
  const seenTrackIds = new Set();
  const seenTrackTitles = new Set();
  const rawTracks = [];

  const addRawTrack = (t) => {
    if (!t || !t.title) return;
    if (seenTrackIds.has(t.id)) return;
    if (isBootlegTrack(t.title, t.artist?.name)) return;
    const norm = cleanSimple(t.title);
    if (seenTrackTitles.has(norm)) return;
    seenTrackIds.add(t.id);
    seenTrackTitles.add(norm);
    rawTracks.push(t);
  };

  for (const t of topTracksRes) addRawTrack(t);
  for (const t of directDeezerTracks) {
    if (!t.artist) continue;
    if (isBootlegTrack(t.title, t.artist.name)) continue;
    const isTarget = isExactOrCoArtist(bestArtist.name, t.artist.name) ||
      (t.title && t.title.toLowerCase().includes(bestArtist.name.toLowerCase()));
    if (isTarget) addRawTrack(t);
  }

  const mappedTracks = rawTracks.map((t, idx) => {
    const dur = t.duration || 210;
    const min = Math.floor(dur / 60);
    const sec = dur % 60;
    const formattedArtist = formatTrackArtists(t, bestArtist.name);
    return {
      id: `dz-track-${t.id}`,
      title: t.title,
      artist: formattedArtist,
      album: t.album?.title || 'Single',
      cover: t.album?.cover_big || t.album?.cover_medium || bestArtist.picture_big,
      preview: t.preview,
      durationSec: dur,
      duration: `${min}:${String(sec).padStart(2, '0')}`,
      plays: `Tocou ${(Math.max(1, 12 - idx) * 0.4).toFixed(1).replace('.', ',')} mi vezes`,
      explicit: t.explicit_lyrics || false,
      priceSale: 'R$ 2,90',
      priceRent: 'R$ 0,99',
      availableForSale: true,
      availableForRent: true,
      contributors: t.contributors || []
    };
  });

  const topTrackTitles = mappedTracks.map(t => cleanStr(t.title));

  // 6. Deduplicação canônica e classificação de lançamentos
  const seenTitles = new Set();
  const seenAppearsTitles = new Set();
  const singlesEps = [];
  const appearsOn = [];
  const canonicalAlbumsMap = new Map();

  function registerAlbumItem(item, recordType) {
    if (!item || !item.title) return;
    const title = item.title;
    if (isBootlegTrack(title, item.artist)) return;

    // Validação estrita de capa: descarta lançamentos sem imagem ou com links quebrados do CoverArtArchive / placeholders
    if (!item.cover || typeof item.cover !== 'string' || item.cover.trim() === '') return;
    if (item.cover.includes('coverartarchive.org') || item.cover.includes('logo-devsongs') || item.cover.includes('placeholder') || item.cover.includes('default_cover')) {
      return;
    }

    // Se for trilha sonora ou coletânea -> Aparece em
    if (isSoundtrackOrVarious(title)) {
      const norm = cleanStr(title);
      if (!seenAppearsTitles.has(norm)) {
        seenAppearsTitles.add(norm);
        appearsOn.push({
          ...item,
          isParticipation: true
        });
      }
      return;
    }

    // Se for Single ou EP -> Singles e EPs
    if (isSingleOrRemixPack(title, recordType, topTrackTitles)) {
      const norm = cleanStr(title);
      if (!seenTitles.has(norm)) {
        seenTitles.add(norm);
        singlesEps.push({
          ...item,
          recordType: 'single',
          priceSale: 'R$ 4,90',
          priceRent: 'R$ 1,90'
        });
      }
      return;
    }

    // Álbuns de estúdio e ao vivo -> Deduplicação Canônica Inteligente
    const rootTitle = getRootAlbumTitle(title);
    const priority = getEditionPriority(title);

    if (!canonicalAlbumsMap.has(rootTitle)) {
      canonicalAlbumsMap.set(rootTitle, { item, priority });
    } else {
      const existing = canonicalAlbumsMap.get(rootTitle);
      if (priority > existing.priority) {
        canonicalAlbumsMap.set(rootTitle, { item, priority });
      }
    }
  }

  // A. Registra álbuns oficiais Deezer
  for (const alb of officialDeezerAlbums) {
    registerAlbumItem({
      id: `dz-alb-${alb.id}`,
      albumId: alb.id,
      title: alb.title,
      year: getKnownAlbumYear(alb.title, bestArtist.name) || (alb.release_date ? alb.release_date.slice(0, 4) : '2024'),
      cover: alb.cover_xl || alb.cover_big || alb.cover_medium,
      artist: bestArtist.name,
      explicit: alb.explicit_lyrics || false,
      priceSale: 'R$ 29,90',
      priceRent: 'R$ 9,90',
      availableForSale: true,
      availableForRent: true
    }, alb.record_type);
  }

  // B. Registra álbuns da busca abrangente Deezer (co-creditados, ao vivo, Podpah, etc.)
  const combinedSearchAlbums = [...searchDeezerAlbums, ...liveDeezerAlbums];
  for (const alb of combinedSearchAlbums) {
    if (!alb || !alb.title) continue;
    const albArtist = alb.artist ? alb.artist.name : '';

    const isPrimaryArtist = isExactOrCoArtist(bestArtist.name, albArtist);
    const isExplicitlyTitled = alb.title.toLowerCase().startsWith(bestArtist.name.toLowerCase() + ' ') ||
      alb.title.toLowerCase().includes(bestArtist.name.toLowerCase());

    if (isPrimaryArtist || isExplicitlyTitled) {
      registerAlbumItem({
        id: `dz-alb-${alb.id}`,
        albumId: alb.id,
        title: alb.title,
        year: getKnownAlbumYear(alb.title, bestArtist.name) || (alb.release_date ? alb.release_date.slice(0, 4) : '2024'),
        cover: alb.cover_xl || alb.cover_big || alb.cover_medium,
        artist: isPrimaryArtist ? (albArtist || bestArtist.name) : bestArtist.name,
        explicit: alb.explicit_lyrics || false,
        priceSale: 'R$ 29,90',
        priceRent: 'R$ 9,90',
        availableForSale: true,
        availableForRent: true
      }, alb.record_type);
    }
  }

  // C. Registra lançamentos do MusicBrainz se ainda não estiverem presentes
  for (const rg of musicBrainzReleaseGroups) {
    if (!rg || !rg.title) continue;
    if (isBootlegTrack(rg.title, bestArtist.name)) continue;
    const pType = (rg['primary-type'] || '').toLowerCase();
    const sTypes = (rg['secondary-types'] || []).map(s => s.toLowerCase());
    const isSingleOrEp = pType === 'single' || pType === 'ep';
    const releaseYear = (rg['first-release-date'] ? rg['first-release-date'].slice(0, 4) : null) || getKnownAlbumYear(rg.title, bestArtist.name) || '2024';

    registerAlbumItem({
      id: `mb-alb-${rg.id}`,
      albumId: null,
      title: rg.title,
      year: releaseYear,
      cover: `https://coverartarchive.org/release-group/${rg.id}/front-500`,
      artist: bestArtist.name,
      explicit: false,
      priceSale: 'R$ 29,90',
      priceRent: 'R$ 9,90',
      availableForSale: true,
      availableForRent: true
    }, isSingleOrEp ? 'single' : (sTypes.includes('live') ? 'live' : 'album'));
  }

  // D. Registra lançamentos do iTunes BR
  for (const alb of itunesAlbums) {
    if (!alb.collectionName) continue;
    const isStrictMatch = isExactOrCoArtist(bestArtist.name, alb.artistName);
    const hasArtistInTitle = alb.collectionName.toLowerCase().includes(bestArtist.name.toLowerCase());
    if (!isStrictMatch && !hasArtistInTitle) continue;

    const isSingleOrEp = alb.collectionName.toLowerCase().includes('single') || alb.collectionName.toLowerCase().includes('ep');
    registerAlbumItem({
      id: `it-alb-${alb.collectionId}`,
      albumId: null,
      title: alb.collectionName.replace(/ - (Single|EP)$/i, ''),
      year: getKnownAlbumYear(alb.collectionName, bestArtist.name) || (alb.releaseDate ? alb.releaseDate.slice(0, 4) : '2024'),
      cover: alb.artworkUrl100?.replace('100x100bb', '600x600bb') || '',
      artist: isStrictMatch ? alb.artistName : bestArtist.name,
      explicit: alb.collectionExplicitness === 'explicit',
      priceSale: 'R$ 29,90',
      priceRent: 'R$ 9,90',
      availableForSale: true,
      availableForRent: true
    }, isSingleOrEp ? 'single' : 'album');
  }

  // E. Registra participações estritamente verificadas em lançamentos de terceiros (Aparece Em)
  const targetSimple = cleanSimple(bestArtist.name);
  const targetId = bestArtist.id;

  // Carrega acervo interno local para identificar participações
  let localCatalogTracks = [];
  let localCatalogAlbums = [];
  try {
    const fsMod = require('fs');
    const pathMod = require('path');
    const compTracksPath = pathMod.join(__dirname, '../../data/company_tracks.json');
    const albPath = pathMod.join(__dirname, '../../data/albums.json');
    if (fsMod.existsSync(compTracksPath)) {
      localCatalogTracks = JSON.parse(fsMod.readFileSync(compTracksPath, 'utf8') || '[]');
    }
    if (fsMod.existsSync(albPath)) {
      localCatalogAlbums = JSON.parse(fsMod.readFileSync(albPath, 'utf8') || '[]');
    }
  } catch (_) {}

  function registerAppearsOnItem(alb, participatingTrackTitle) {
    if (!alb || !alb.title) return;
    const albNorm = cleanSimple(alb.title);
    if (!albNorm || albNorm === 'single') return;
    if (seenTitles.has(albNorm) || seenAppearsTitles.has(albNorm)) return;

    const albArtist = alb.artist_name || (alb.artist ? (alb.artist.name || alb.artist) : '') || 'Vários Artistas';
    if (isExactOrCoArtist(bestArtist.name, albArtist)) return;

    seenAppearsTitles.add(albNorm);

    const year = (alb.release_date || alb.releaseDate || alb.year || '').slice(0, 4) || getKnownAlbumYear(alb.title, albArtist) || '2024';
    const cover = alb.cover_xl || alb.cover_big || alb.cover_medium || alb.cover_url || alb.cover || '';
    if (!cover || typeof cover !== 'string' || cover.trim() === '' || cover.includes('coverartarchive.org') || cover.includes('logo-devsongs') || cover.includes('placeholder')) {
      return;
    }

    appearsOn.push({
      id: alb.id ? `dz-feat-${alb.id}` : `local-feat-${albNorm}`,
      albumId: alb.id || null,
      title: alb.title,
      year: year,
      cover: cover,
      artist: albArtist,
      recordType: alb.record_type || 'album',
      isParticipation: true,
      participatingTrack: participatingTrackTitle || alb.title,
      priceSale: 'R$ 29,90',
      priceRent: 'R$ 9,90',
      availableForSale: true,
      availableForRent: true
    });
  }

  // 1. Participações no acervo local (company_tracks.json)
  for (const t of localCatalogTracks) {
    const trackArtist = t.artist || '';
    const hasParticipation = isExactOrCoArtist(bestArtist.name, trackArtist) ||
      (t.participants && t.participants.some(p => isExactOrCoArtist(bestArtist.name, p.name))) ||
      (/\b(feat|ft|part)\b/i.test(t.title) && cleanSimple(t.title).includes(targetSimple));

    if (hasParticipation && t.album && cleanSimple(t.album) !== 'single') {
      const albObj = localCatalogAlbums.find(a => cleanSimple(a.title) === cleanSimple(t.album));
      registerAppearsOnItem(albObj || { title: t.album, artist_name: t.artist, cover_url: t.cover_url }, t.title);
    }
  }

  // 2. Participações em faixas mais tocadas do artista no Deezer (topTracksRes)
  for (const t of topTracksRes) {
    if (!t.album || !t.album.title || cleanSimple(t.album.title) === 'single') continue;
    const isOtherArtist = t.artist && t.artist.id !== targetId;
    const isTargetInContribs = t.contributors && t.contributors.some(c => c.id === targetId || cleanSimple(c.name) === targetSimple);
    const isTargetInTitle = cleanSimple(t.title).includes(targetSimple);

    if ((isOtherArtist || isTargetInContribs || isTargetInTitle) && t.artist && t.artist.id !== targetId) {
      registerAppearsOnItem({
        id: t.album.id,
        title: t.album.title,
        artist: t.artist.name,
        cover: t.album.cover_xl || t.album.cover_big || t.album.cover_medium,
        release_date: t.album.release_date
      }, t.title);
    }
  }

  // 3. Faixas colaborativas de buscas Deezer ("feat <nome>", "part <nome>")
  const collabTracks = [...(collaborativeFeatTracks || []), ...(collaborativePartTracks || [])];
  for (const t of collabTracks) {
    if (!t.album || !t.album.title || cleanSimple(t.album.title) === 'single') continue;
    const isTargetInContribs = t.contributors && t.contributors.some(c => c.id === targetId || cleanSimple(c.name) === targetSimple);
    const isTargetInTitle = cleanSimple(t.title).includes(targetSimple);
    const isTargetInArtist = t.artist && cleanSimple(t.artist.name).includes(targetSimple);

    if ((isTargetInContribs || isTargetInTitle || isTargetInArtist) && t.artist && t.artist.id !== targetId) {
      registerAppearsOnItem({
        id: t.album.id,
        title: t.album.title,
        artist: t.artist.name,
        cover: t.album.cover_xl || t.album.cover_big || t.album.cover_medium,
        release_date: t.album.release_date
      }, t.title);
    }
  }

  // E. Extrai álbuns canônicos ordenados do mais recente para o mais antigo
  const fullAlbums = Array.from(canonicalAlbumsMap.values())
    .map(v => v.item)
    .sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));

  const sortedSingles = singlesEps
    .sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));

  const sortedAppearsOn = appearsOn
    .sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));

  // 7. Sincronização e Persistência Automática no DevSongs (libraryStorage / DB)
  try {
    await persistArtistAndAlbums(artistObj, fullAlbums);
  } catch (err) {
    console.warn('Aviso: Falha ao persistir metadados sincronizados na biblioteca local:', err.message);
  }

  const result = {
    artist: artistObj,
    tracks: mappedTracks,
    albums: fullAlbums,
    singles: sortedSingles,
    appearsOn: sortedAppearsOn,
    stats: {
      totalAlbums: fullAlbums.length,
      totalSingles: sortedSingles.length,
      totalAppearsOn: sortedAppearsOn.length,
      totalTracks: mappedTracks.length,
      syncedAt: new Date().toISOString()
    }
  };

  discographyCache.set(cacheKey, { timestamp: Date.now(), data: result });
  return result;
}

/**
 * Persiste o artista e seus álbuns em libraryStorage (idempotente)
 */
async function persistArtistAndAlbums(artistObj, albums) {
  if (!artistObj || !artistObj.name) return;

  const existingArtists = await libraryStorage.getArtists();
  const cleanTarget = cleanSimple(artistObj.name);

  let localArtist = existingArtists.find(a => cleanSimple(a.name) === cleanTarget);

  if (!localArtist) {
    try {
      localArtist = await libraryStorage.createArtist({
        name: artistObj.name,
        bio: artistObj.bio,
        avatar_url: artistObj.avatarImg,
        genre: 'Trap & Rap'
      });
    } catch (_) {
      const refreshed = await libraryStorage.getArtists();
      localArtist = refreshed.find(a => cleanSimple(a.name) === cleanTarget);
    }
  } else if (!localArtist.avatar_url && artistObj.avatarImg) {
    try {
      await libraryStorage.updateArtist(localArtist.id, {
        avatar_url: artistObj.avatarImg
      });
    } catch (_) {}
  }

  if (!localArtist || !localArtist.id) return;

  // Persiste álbuns ausentes
  const existingAlbums = await libraryStorage.getAlbums();
  const seenLocalTitles = new Set(
    existingAlbums
      .filter(a => a.artist_id === localArtist.id || cleanSimple(a.artist_name) === cleanTarget)
      .map(a => getRootAlbumTitle(a.title))
  );

  for (const alb of albums) {
    const root = getRootAlbumTitle(alb.title);
    if (!seenLocalTitles.has(root)) {
      try {
        await libraryStorage.createAlbum({
          title: alb.title,
          artist_name: artistObj.name,
          artist_id: localArtist.id,
          cover_url: alb.cover,
          release_date: alb.year ? `${alb.year}-01-01` : '2024-01-01',
          genre: 'Trap & Rap'
        });
        seenLocalTitles.add(root);
      } catch (_) {}
    }
  }
}

module.exports = {
  syncArtistDiscography,
  pickBestArtistCandidate,
  getRootAlbumTitle,
  getKnownAlbumYear,
  formatTrackArtists,
  discographyCache
};
