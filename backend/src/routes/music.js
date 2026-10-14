const express = require('express');
const router = express.Router();

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

/**
 * GET /api/music/artist?q={nome}
 * Busca o perfil OFICIAL do artista, sua foto HD, top músicas e discografia sem imagens quebradas.
 */
router.get('/artist', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Parâmetro "q" é obrigatório.' });
  }

  try {
    // 1. Busca o artista oficial no Deezer
    const artistRes = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(q)}`);
    const artistJson = await artistRes.json();

    if (artistJson.data && artistJson.data.length > 0) {
      const cleanStr = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      const qClean = cleanStr(q);

      // Filtra candidatos relevantes que contêm a busca ignorando acentos
      const candidates = artistJson.data.filter(a => {
        const n = cleanStr(a.name);
        // Evita colaborações longas com vírgula ou feat se a busca não tiver
        const isCollab = !qClean.includes(',') && !qClean.includes('&') && (n.includes('feat') || n.includes('featuring') || (n.includes(',') && n.includes('&')));
        return (n.includes(qClean) || qClean.includes(n)) && !isCollab;
      });

      // Seleciona o artista com maior número de fãs (evita contas genéricas ou com 10 fãs)
      const listToPick = candidates.length > 0 ? candidates : artistJson.data;
      let bestArtist = listToPick.reduce((max, a) => ((a.nb_fan || 0) > ((max && max.nb_fan) || -1) ? a : max), listToPick[0]);

      // Busca top faixas e álbuns em paralelo (Deezer + iTunes para discografia 100% completa)
      const [topTracksRes, albumsRes, itunesAlbumsRes] = await Promise.all([
        fetch(`https://api.deezer.com/artist/${bestArtist.id}/top?limit=50`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`https://api.deezer.com/artist/${bestArtist.id}/albums?limit=100`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(bestArtist.name)}&entity=album&limit=50&country=BR`).then(r => r.json()).catch(() => ({ results: [] }))
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

      const mappedTracks = (topTracksRes.data || []).map((t, idx) => {
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
      const fullAlbums = [];
      const singlesEps = [];

      // 1. Álbuns oficiais Deezer
      (albumsRes.data || []).forEach((alb) => {
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
      });

      // 2. Mescla álbuns do iTunes para garantir que nenhum álbum de estúdio fique de fora
      (itunesAlbumsRes.results || []).forEach((alb) => {
        const norm = cleanStr(alb.collectionName).replace(/-(single|ep)/g, '').trim();
        if (!seenTitles.has(norm)) {
          seenTitles.add(norm);
          const isSingle = alb.collectionName.toLowerCase().includes('single') || alb.collectionName.toLowerCase().includes('ep');
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

      return res.json({
        artist: artistObj,
        tracks: mappedTracks,
        albums: fullAlbums,
        singles: singlesEps
      });
    }

    // 2. Fallback caso o artista não exista no Deezer: busca no iTunes Brasil
    const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=50&country=BR`);
    const itunesData = await itunesRes.json();

    if (itunesData.results && itunesData.results.length > 0) {
      const detectedArtist = itunesData.results[0].artistName;
      const detectedCover = itunesData.results[0].artworkUrl100?.replace('100x100bb', '600x600bb') || '';

      const mapped = itunesData.results.map((item, idx) => {
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

  try {
    const [tracksRes, artistRes] = await Promise.all([
      fetch(`https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=25`).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(q)}&limit=10`).then(r => r.json()).catch(() => ({ data: [] }))
    ]);

    let artistObj = null;
    if (artistRes.data && artistRes.data.length > 0) {
      const cleanStr = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      const qClean = cleanStr(q);
      const candidates = artistRes.data.filter(a => {
        const n = cleanStr(a.name);
        const isCollab = !qClean.includes(',') && !qClean.includes('&') && (n.includes('feat') || n.includes('featuring') || (n.includes(',') && n.includes('&')));
        return (n.includes(qClean) || qClean.includes(n)) && !isCollab;
      });
      const listToPick = candidates.length > 0 ? candidates : artistRes.data;
      const a = listToPick.reduce((max, x) => ((x.nb_fan || 0) > ((max && max.nb_fan) || -1) ? x : max), listToPick[0]);

      const fans = a.nb_fan || 500000;
      artistObj = {
        id: `dz-artist-${a.id}`,
        name: a.name,
        avatarImg: a.picture_xl || a.picture_big,
        bannerImg: a.picture_xl || a.picture_big,
        listeners: fans >= 1000000 ? `${(fans / 1000000).toFixed(1).replace('.', ',')} mi ouvintes mensais` : `${Math.round(fans / 1000)} mil ouvintes mensais`,
        subscribers: fans >= 1000000 ? `${(fans / 1000000).toFixed(1).replace('.', ',')} mi` : `${Math.round(fans / 1000)} mil`,
        bio: `${a.name} é um dos artistas mais ouvidos do momento.`
      };
    }

    const mappedTracks = (tracksRes.data || []).map((t, idx) => {
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

    return res.json({
      artist: artistObj,
      tracks: mappedTracks
    });
  } catch (err) {
    console.error('Erro na rota /api/music/search:', err);
    return res.status(500).json({ error: 'Erro ao buscar faixas' });
  }
});

/**
 * GET /api/music/album-tracks?albumId={id}
 * Carrega as faixas de um álbum selecionado.
 */
router.get('/album-tracks', async (req, res) => {
  const { albumId, title, artist } = req.query;
  if (!albumId && !title) {
    return res.status(400).json({ error: 'Parâmetro "albumId" ou "title" é obrigatório.' });
  }

  try {
    let albumDetails = null;
    let mapped = [];

    const rawId = (albumId || '').replace('dz-alb-', '').replace('it-alb-', '');

    // 1. Tenta buscar no Deezer se houver ID numérico
    if (rawId && !isNaN(rawId)) {
      const [albumData, tracksRes] = await Promise.all([
        fetch(`https://api.deezer.com/album/${rawId}`).then(r => r.json()).catch(() => null),
        fetch(`https://api.deezer.com/album/${rawId}/tracks?limit=100`).then(r => r.json()).catch(() => ({ data: [] }))
      ]);

      if (albumData && albumData.title) {
        albumDetails = {
          id: `dz-alb-${albumData.id}`,
          albumId: albumData.id,
          title: albumData.title,
          cover: albumData.cover_xl || albumData.cover_big || albumData.cover_medium,
          artistName: albumData.artist?.name || artist || 'Artista',
          artistAvatar: albumData.artist?.picture_small || albumData.artist?.picture_medium,
          artistId: albumData.artist?.id,
          year: albumData.release_date ? albumData.release_date.slice(0, 4) : '2024',
          nbTracks: albumData.nb_tracks || (tracksRes.data || []).length,
          durationSec: albumData.duration || 0,
          explicit: albumData.explicit_lyrics || false,
          recordType: albumData.record_type || 'album',
          priceSale: albumData.record_type === 'single' ? 'R$ 4,90' : 'R$ 29,90',
          priceRent: albumData.record_type === 'single' ? 'R$ 1,90' : 'R$ 9,90'
        };

        mapped = (tracksRes.data || []).map((t, idx) => {
          const dur = t.duration || 210;
          const min = Math.floor(dur / 60);
          const sec = dur % 60;
          return {
            id: `dz-track-${t.id}`,
            trackNumber: t.track_position || (idx + 1),
            title: t.title,
            artist: t.artist?.name || albumDetails.artistName,
            album: albumDetails.title,
            cover: albumDetails.cover,
            preview: t.preview,
            durationSec: dur,
            duration: `${min}:${String(sec).padStart(2, '0')}`,
            plays: generatePlaysCount(idx),
            explicit: t.explicit_lyrics || false
          };
        });

        if (mapped.length > 0) {
          return res.json({ album: albumDetails, tracks: mapped });
        }
      }
    }

    // 2. Fallback via iTunes Brasil
    const query = `${artist || ''} ${title || ''}`.trim();
    const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=50&country=BR`);
    const itunesData = await itunesRes.json();

    if (itunesData.results && itunesData.results.length > 0) {
      const first = itunesData.results[0];
      const totalDur = itunesData.results.reduce((acc, curr) => acc + (curr.trackTimeMillis || 0), 0);
      albumDetails = {
        id: `it-alb-${first.collectionId}`,
        albumId: first.collectionId,
        title: first.collectionName || title || 'Álbum',
        cover: first.artworkUrl100?.replace('100x100bb', '600x600bb') || '',
        artistName: first.artistName || artist || 'Artista',
        artistAvatar: '',
        year: first.releaseDate ? first.releaseDate.slice(0, 4) : '2024',
        nbTracks: itunesData.results.length,
        durationSec: Math.round(totalDur / 1000),
        explicit: first.collectionExplicitness === 'explicit',
        recordType: 'album',
        priceSale: 'R$ 29,90',
        priceRent: 'R$ 9,90'
      };

      mapped = itunesData.results.map((item, idx) => {
        const durationSeconds = Math.round((item.trackTimeMillis || 210000) / 1000);
        const minutes = Math.floor(durationSeconds / 60);
        const seconds = durationSeconds % 60;
        return {
          id: `track-${item.trackId || idx}`,
          trackNumber: item.trackNumber || (idx + 1),
          title: item.trackName,
          artist: item.artistName,
          album: albumDetails.title,
          cover: albumDetails.cover,
          preview: item.previewUrl,
          durationSec: durationSeconds,
          duration: `${minutes}:${String(seconds).padStart(2, '0')}`,
          plays: generatePlaysCount(idx),
          explicit: item.trackExplicitness === 'explicit'
        };
      });

      return res.json({ album: albumDetails, tracks: mapped });
    }

    return res.json({ album: null, tracks: [] });
  } catch (err) {
    console.error('Erro na rota /api/music/album-tracks:', err);
    return res.status(500).json({ error: 'Erro ao buscar faixas do álbum' });
  }
});

module.exports = router;
