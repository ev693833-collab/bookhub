// API route to fetch dynamic live charts and trending songs by genre
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

async function fetchWithTimeout(url, timeoutMs = 4500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'DevSongsApp/1.0',
        'Accept': 'application/json',
      },
    });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

function mapDeezerTrack(t) {
  return {
    id: t.id ? String(t.id) : `${t.title}-${t.artist?.name}`,
    title: t.title_short || t.title,
    artist: t.artist?.name || 'Artista Desconhecido',
    album: t.album?.title || '',
    cover: t.album?.cover_big || t.album?.cover_medium || t.album?.cover || '',
    artistPhoto: t.artist?.picture_big || t.artist?.picture_medium || '',
    duration: t.duration ? `${Math.floor(t.duration / 60)}:${String(t.duration % 60).padStart(2, '0')}` : '',
    rank: t.rank || 0,
    previewUrl: t.preview || '',
  };
}

export default async function handler(req, res) {
  const cacheKey = 'all_live_charts';
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.status(200).json(cached.data);
  }

  const genreConfigs = [
    { id: 'popular', label: '🔥 Mais Populares', url: 'https://api.deezer.com/chart/0/tracks?limit=12' },
    { id: 'pop', label: '🎵 Pop', url: 'https://api.deezer.com/chart/132/tracks?limit=12' },
    { id: 'rock', label: '🎸 Rock', url: 'https://api.deezer.com/chart/152/tracks?limit=12' },
    { id: 'eletronica', label: '⚡ Eletrônica', url: 'https://api.deezer.com/chart/106/tracks?limit=12' },
    { id: 'rap', label: '🎤 Rap & Hip-Hop', url: 'https://api.deezer.com/chart/116/tracks?limit=12' },
    { id: 'lofi', label: '☕ Lo-Fi Beats', url: 'https://api.deezer.com/search?q=lo-fi+chill+beats&order=RANKING&limit=12' },
    { id: 'synthwave', label: '🌆 Synthwave & Retro', url: 'https://api.deezer.com/search?q=synthwave+retro&order=RANKING&limit=12' },
  ];

  try {
    const results = await Promise.all(
      genreConfigs.map(async (genre) => {
        try {
          const resp = await fetchWithTimeout(genre.url, 4000);
          if (resp.ok) {
            const json = await resp.json();
            const tracks = (json.data || []).map(mapDeezerTrack).filter(t => t.title && t.artist);
            if (tracks.length > 0) {
              return {
                id: genre.id,
                label: genre.label,
                tracks,
              };
            }
          }
        } catch (e) {
          console.warn(`Failed to fetch chart for ${genre.id}:`, e.message);
        }
        return null;
      })
    );

    const validSections = results.filter(Boolean);

    if (validSections.length > 0) {
      cache.set(cacheKey, { timestamp: Date.now(), data: validSections });
      return res.status(200).json(validSections);
    }

    return res.status(500).json({ error: 'Could not fetch charts' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
