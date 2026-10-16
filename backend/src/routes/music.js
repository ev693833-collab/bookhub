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
    'Tocou 4,8 bi vezes',
    'Tocou 2,0 bi vezes',
    'Tocou 2,3 bi vezes',
    'Tocou 1,9 bi vezes',
    'Tocou 2,6 bi vezes',
    'Tocou 2,8 bi vezes',
    'Tocou 1,1 bi vezes',
    'Tocou 1,7 bi vezes',
    'Tocou 890 mi vezes',
    'Tocou 740 mi vezes',
    'Tocou 680 mi vezes',
    'Tocou 590 mi vezes'
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

function matchArtistName(query, artistName) {
  if (!query || !artistName) return false;
  const qClean = cleanSimple(query);
  const aClean = cleanSimple(artistName);
  if (qClean === aClean || aClean.includes(qClean) || qClean.includes(aClean)) return true;

  if (qClean.length >= 6 && aClean.length >= 6 && levenshtein(qClean, aClean) <= 2) {
    return true;
  }

  const qTokens = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(Boolean);
  const aTokens = artistName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(Boolean);

  if (qTokens.length > 0 && aTokens.length >= qTokens.length) {
    const allMatch = qTokens.every(qTok => 
      aTokens.some(aTok => aTok === qTok || (qTok.length >= 3 && aTok.startsWith(qTok)))
    );
    if (allMatch) return true;
  }
  return false;
}

/**
 * GET /api/music/artist?q={nome}
 * Busca o perfil OFICIAL do artista, sua foto HD, top músicas e discografia sem imagens quebradas.
 */
router.get('/artist', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Parâmetro "q" é obrigatório.' });
  }

  const cleanQ = (q || '').toLowerCase().trim();
  if (artistProfileCache.has(cleanQ)) {
    return res.json(artistProfileCache.get(cleanQ));
  }

  try {
    // Se a busca for uma colaboração (ex: "Link do Zap & pluglip"), extrai o artista principal ("Link do Zap")
    const primaryName = q.split(/[,&]|\s+e\s+|\s+feat\.?\s+|\s+part\.?\s+/i)[0].trim();
    const isInvalidArtistPattern = /(cover|tribute|tributo|karaoke|banda\b|band\b|made famous|instrumental|piano|orchestra)/i;

    // 1. Busca o artista oficial no Deezer
    let artistRes = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(q)}`);
    let artistJson = await artistRes.json();

    // Se a busca com colaboração não retornar artistas, tenta pelo artista principal
    if ((!artistJson.data || artistJson.data.length === 0) && primaryName && primaryName !== q) {
      artistRes = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(primaryName)}`);
      artistJson = await artistRes.json();
    }

    if (artistJson.data && artistJson.data.length > 0) {
      const validArtists = artistJson.data.filter(a => !isInvalidArtistPattern.test(a.name));
      const candidates = (validArtists.length > 0 ? validArtists : artistJson.data).filter(a => 
        matchArtistName(primaryName || q, a.name)
      );

      const listToPick = candidates.length > 0 ? candidates : (validArtists.length > 0 ? validArtists : artistJson.data);
      let bestArtist = listToPick.reduce((max, a) => ((a.nb_fan || 0) > ((max && max.nb_fan) || -1) ? a : max), listToPick[0]);

      // Identifica contas irmãs / duplicatas / variações de grafia do mesmo artista (ex: Priscila Areba & Pricila areba)
      const relatedProfiles = (validArtists.length > 0 ? validArtists : artistJson.data).filter(a => 
        a.id !== bestArtist.id && 
        (matchArtistName(a.name, bestArtist.name) || matchArtistName(bestArtist.name, a.name) || matchArtistName(primaryName || q, a.name))
      );
      const targetArtists = Array.from(new Map([bestArtist, ...candidates, ...relatedProfiles].map(a => [a.id, a])).values()).slice(0, 4);

      // Busca top faixas e álbuns oficiais de TODAS as contas do artista + busca direta de faixas
      const topPromises = targetArtists.map(a => 
        fetch(`https://api.deezer.com/artist/${a.id}/top?limit=50`).then(r => r.json()).then(res => res.data || []).catch(() => [])
      );
      const albPromises = targetArtists.map(a => 
        fetch(`https://api.deezer.com/artist/${a.id}/albums?limit=100`).then(r => r.json()).then(res => res.data || []).catch(() => [])
      );
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
        : `${Math.round(fans / 1000)} mil ouvintes mensais`;
      const subsStr = fans >= 1000000
        ? `${(fans / 1000000).toFixed(1).replace('.', ',')} mi`
        : `${Math.round(fans / 1000)} mil`;

      const artistObj = {
        id: `dz-artist-${bestArtist.id}`,
        name: bestArtist.name,
        avatarImg: bestArtist.picture_xl || bestArtist.picture_big,
        bannerImg: bestArtist.picture_xl || bestArtist.picture_big,
        listeners: listenersStr,
        subscribers: subsStr,
        bio: `${bestArtist.name} é um dos artistas mais ouvidos do momento, acumulando milhares de reproduções e fãs por todo o país.`
      };

      // Unifica e deduplica faixas de todas as contas e da busca direta do artista
      const seenTrackIds = new Set();
      const seenTrackTitles = new Set();
      const tracksToMap = [];

      const addTrack = (t) => {
        if (!t || seenTrackIds.has(t.id)) return;
        const norm = cleanSimple(t.title);
        if (seenTrackTitles.has(norm)) return;
        seenTrackIds.add(t.id);
        seenTrackTitles.add(norm);
        tracksToMap.push(t);
      };

      for (const list of topLists) {
        for (const t of list) addTrack(t);
      }
      for (const t of [...directTracks, ...directQTracks]) {
        if (!t.artist) continue;
        const matchesAny = targetArtists.some(a => 
          matchArtistName(t.artist.name, a.name) || matchArtistName(a.name, t.artist.name)
        );
        if (matchesAny) addTrack(t);
      }

      const mappedTracks = tracksToMap.map((t, idx) => {
        const dur = t.duration || 210;
        const min = Math.floor(dur / 60);
        const sec = dur % 60;
        return {
          id: `dz-track-${t.id}`,
          title: t.title,
          artist: t.artist?.name || bestArtist.name,
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
      const fullAlbums = [];
      const singlesEps = [];
      const appearsOn = [];

      // 1. Álbuns e Singles oficiais Deezer de todas as contas vinculadas
      for (const list of albLists) {
        for (const alb of list) {
          const norm = cleanStr(alb.title).replace(/-(single|ep)/g, '').trim();
          if (!seenTitles.has(norm)) {
            seenTitles.add(norm);
            const isSingle = alb.record_type === 'single' || alb.record_type === 'ep' || alb.title.toLowerCase().includes('single') || alb.title.toLowerCase().includes('ep');
            const item = {
              id: `dz-alb-${alb.id}`,
              albumId: alb.id,
              title: alb.title,
              year: alb.release_date ? alb.release_date.slice(0, 4) : '2024',
              cover: alb.cover_big || alb.cover_medium,
              artist: bestArtist.name,
              explicit: alb.explicit_lyrics || false,
              priceSale: isSingle ? 'R$ 4,90' : 'R$ 29,90',
              priceRent: isSingle ? 'R$ 1,90' : 'R$ 9,90',
              availableForSale: true,
              availableForRent: true
            };
            if (isSingle) singlesEps.push(item);
            else fullAlbums.push(item);
          }
        }
      }

      // 2. Separa álbuns de faixas: se for do próprio artista vai para discografia; se for de outro artista (feat), vai para 'appearsOn'
      for (const t of tracksToMap) {
        if (t.album && t.album.title && t.album.id) {
          const norm = cleanStr(t.album.title).replace(/-(single|ep)/g, '').trim();
          const trackArtistName = t.artist?.name || '';
          const isMainArtist = matchArtistName(trackArtistName, bestArtist.name) ||
                               matchArtistName(bestArtist.name, trackArtistName);

          if (isMainArtist) {
            // Álbum próprio do artista
            if (!seenTitles.has(norm)) {
              seenTitles.add(norm);
              const isSingle = t.album.title.toLowerCase().includes('single') || t.album.title.toLowerCase().includes('ep');
              const item = {
                id: `dz-alb-${t.album.id}`,
                albumId: t.album.id,
                title: t.album.title,
                year: '2024',
                cover: t.album.cover_big || t.album.cover_medium || bestArtist.picture_big,
                artist: bestArtist.name,
                explicit: false,
                priceSale: isSingle ? 'R$ 4,90' : 'R$ 29,90',
                priceRent: isSingle ? 'R$ 1,90' : 'R$ 9,90',
                availableForSale: true,
                availableForRent: true
              };
              if (isSingle) singlesEps.push(item);
              else fullAlbums.push(item);
            }
          } else {
            // ÁLBUM DE TERCEIRO (PARTICIPAÇÃO / APARECE EM)
            if (!seenTitles.has(norm) && !seenAppearsTitles.has(norm)) {
              seenAppearsTitles.add(norm);
              const isSingle = t.album.title.toLowerCase().includes('single') || t.album.title.toLowerCase().includes('ep');
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
                priceSale: isSingle ? 'R$ 4,90' : 'R$ 29,90',
                priceRent: isSingle ? 'R$ 1,90' : 'R$ 9,90',
                availableForSale: true,
                availableForRent: true
              });
            }
          }
        }
      }

      // 3. Mescla com iTunes APENAS se o artista for estritamente idêntico e não for bootleg de terceiros
      const bestArtistClean = cleanSimple(bestArtist.name);
      const isBootlegPattern = /(tropa|braba|anti\s*oruam|dono da favela|homenagem|tributo|bootleg|karaoke|bass boosted)/i;

      (itunesAlbumsRes.results || []).forEach((alb) => {
        // Validação estrita: o artista no iTunes TEM QUE SER exatamente o artista oficial
        const albArtistClean = cleanSimple(alb.artistName);
        const isStrictArtistMatch = albArtistClean === bestArtistClean || 
                                    albArtistClean.startsWith(bestArtistClean + '&') || 
                                    albArtistClean.startsWith(bestArtistClean + 'e') ||
                                    albArtistClean.startsWith(bestArtistClean + ',');

        if (!isStrictArtistMatch) return; // Rejeita álbuns de MC Dom Lp, Bass Boosted, Xandinho Mc, etc.
        if (isBootlegPattern.test(alb.collectionName)) return; // Rejeita compilações não oficiais

        const norm = cleanStr(alb.collectionName).replace(/-(single|ep)/g, '').trim();
        if (!seenTitles.has(norm)) {
          seenTitles.add(norm);
          const isSingle = alb.collectionName.toLowerCase().includes('single') || alb.collectionName.toLowerCase().includes('ep');
          
          // Se o Deezer já trouxe os singles oficiais do artista, evita poluir com singles soltos repetidos do iTunes
          if (isSingle && singlesEps.length >= 15) return;

          const item = {
            id: `it-alb-${alb.collectionId}`,
            albumId: null,
            title: alb.collectionName.replace(/ - (Single|EP)$/i, ''),
            year: alb.releaseDate ? alb.releaseDate.slice(0, 4) : '2024',
            cover: alb.artworkUrl100?.replace('100x100bb', '600x600bb') || '',
            artist: bestArtist.name,
            explicit: alb.collectionExplicitness === 'explicit',
            priceSale: isSingle ? 'R$ 4,90' : 'R$ 29,90',
            priceRent: isSingle ? 'R$ 1,90' : 'R$ 9,90',
            availableForSale: true,
            availableForRent: true
          };
          if (isSingle) singlesEps.push(item);
          else fullAlbums.push(item);
        }
      });

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
      fetchWithTimeout(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=25`, {}, 4000)
        .then(r => r.json())
        .catch(() => ({ data: [] })),
      fetchWithTimeout(`https://api.deezer.com/search/artist?q=${encodeURIComponent(q)}&limit=10`, {}, 4000)
        .then(r => r.json())
        .catch(() => ({ data: [] }))
    ]);

    if (artistRes.data && artistRes.data.length > 0) {
      const candidates = artistRes.data.filter(a => {
        const isCollab = !qClean.includes(',') && !qClean.includes('&') && (a.name.includes('feat') || a.name.includes('featuring') || (a.name.includes(',') && a.name.includes('&')));
        return matchArtistName(q, a.name) && !isCollab;
      });

      const listToProcess = candidates.length > 0 ? candidates : artistRes.data.slice(0, 4);
      allArtists = listToProcess.map(a => {
        const fans = a.nb_fan || 5000;
        return {
          id: `dz-artist-${a.id}`,
          name: a.name,
          avatarImg: a.picture_xl || a.picture_big || a.picture_medium,
          bannerImg: a.picture_xl || a.picture_big,
          listeners: fans >= 1000000 ? `${(fans / 1000000).toFixed(1).replace('.', ',')} mi ouvintes mensais` : `${Math.round(fans / 1000)} mil ouvintes mensais`,
          subscribers: fans >= 1000000 ? `${(fans / 1000000).toFixed(1).replace('.', ',')} mi` : `${Math.round(fans / 1000)} mil`,
          bio: `${a.name} é um artista do cenário musical.`
        };
      });

      if (listToProcess.length > 0) {
        const exactMatch = listToProcess.find(c => cleanSimple(c.name) === qClean);
        const bestCandidate = exactMatch || listToProcess.reduce((max, x) => ((x.nb_fan || 0) > ((max && max.nb_fan) || -1) ? x : max), listToProcess[0]);
        const fans = bestCandidate.nb_fan || 0;
        artistObj = {
          id: `dz-artist-${bestCandidate.id}`,
          name: bestCandidate.name,
          fansCount: fans,
          avatarImg: bestCandidate.picture_xl || bestCandidate.picture_big,
          bannerImg: bestCandidate.picture_xl || bestCandidate.picture_big,
          listeners: fans >= 1000000 ? `${(fans / 1000000).toFixed(1).replace('.', ',')} mi ouvintes mensais` : `${Math.round(fans / 1000)} mil ouvintes mensais`,
          subscribers: fans >= 1000000 ? `${(fans / 1000000).toFixed(1).replace('.', ',')} mi` : `${Math.round(fans / 1000)} mil`,
          bio: `${bestCandidate.name} é um dos artistas mais ouvidos do momento.`
        };
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
      const isArtistExactMatch = artistNameClean === qClean;

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
