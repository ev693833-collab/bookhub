// API route to fetch rich song details: album, release date, artist photo, and Wikipedia summary
const cache = new Map();

function formatPtDate(isoOrDateString) {
  if (!isoOrDateString) return null;
  try {
    const d = new Date(isoOrDateString);
    if (isNaN(d.getTime())) {
      // maybe already a year or string
      return isoOrDateString;
    }
    return d.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch (_) {
    return isoOrDateString;
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 4500) {
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

export default async function handler(req, res) {
  const { title = '', artist = '' } = req.query;

  if (!title || !artist) {
    return res.status(400).json({ error: 'title and artist parameters are required' });
  }

  const cacheKey = `${title.toLowerCase().trim()}_${artist.toLowerCase().trim()}`;
  if (cache.has(cacheKey)) {
    return res.status(200).json(cache.get(cacheKey));
  }

  let album = '';
  let releaseDate = '';
  let releaseYear = '';
  let artistPhoto = '';
  let artistBio = '';
  let genre = '';
  let cover = '';
  let summary = '';
  const wikiHeaders = {
    'User-Agent': 'DevSongsApp/1.0 (https://devsongs.local; contact@devsongs.com)',
  };

  // 1. Fetch from Deezer (Great for Artist Photos & Album info)
  try {
    const dzRes = await fetchWithTimeout(
      `https://api.deezer.com/search?q=${encodeURIComponent(`${title} ${artist}`)}`
    );
    if (dzRes.ok) {
      const dzData = await dzRes.json();
      const track = dzData.data?.[0];
      if (track) {
        artistPhoto = track.artist?.picture_big || track.artist?.picture_medium || '';
        album = track.album?.title || '';
        cover = track.album?.cover_big || track.album?.cover_medium || '';
        if (track.id) {
          // fetch track detail for exact release date if needed
          try {
            const trackRes = await fetchWithTimeout(`https://api.deezer.com/track/${track.id}`);
            if (trackRes.ok) {
              const trackData = await trackRes.json();
              if (trackData.release_date) {
                releaseDate = formatPtDate(trackData.release_date);
                releaseYear = trackData.release_date.split('-')[0];
              }
            }
          } catch (_) {}
        }
      }
    }
  } catch (_) {}

  // 2. Fetch from iTunes (Great for releaseDate, genre, collectionName)
  try {
    const itRes = await fetchWithTimeout(
      `https://itunes.apple.com/search?term=${encodeURIComponent(`${title} ${artist}`)}&media=music&limit=5&entity=song`
    );
    if (itRes.ok) {
      const itData = await itRes.json();
      const items = itData.results || [];
      const match = items.find(i =>
        i.artistName?.toLowerCase().includes(artist.toLowerCase().split(' ')[0])
      ) || items[0];

      if (match) {
        if (!album && match.collectionName) album = match.collectionName;
        if (!genre && match.primaryGenreName) genre = match.primaryGenreName;
        if (!cover && match.artworkUrl100) cover = match.artworkUrl100.replace('100x100bb', '600x600bb');
        if (!releaseDate && match.releaseDate) {
          releaseDate = formatPtDate(match.releaseDate);
          releaseYear = new Date(match.releaseDate).getFullYear().toString();
        }
      }
    }
  } catch (_) {}

  // 3. Fetch summary from Portuguese Wikipedia
  try {
    const cleanTitle = title.trim();
    const cleanArtist = artist.trim();

    // Check targeted Wikipedia candidates
    const candidates = [
      `${cleanTitle}_(canção_de_${cleanArtist})`,
      `${cleanTitle}_(canção_de_${cleanArtist.split(' ')[0]})`,
      `${cleanTitle}_(canção)`,
      `${cleanTitle}_(música)`,
      `${cleanTitle}`,
    ];

    for (const c of candidates) {
      try {
        const wRes = await fetchWithTimeout(
          `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(c.replace(/\s+/g, '_'))}`,
          { headers: wikiHeaders },
          2500
        );
        if (wRes.ok) {
          const wData = await wRes.json();
          if (
            wData.extract &&
            wData.type !== 'disambiguation' &&
            !wData.extract.includes('pode referir-se a:') &&
            !wData.extract.includes('é uma desambiguação')
          ) {
            summary = wData.extract;
            if (!artistPhoto && wData.thumbnail?.source) {
              artistPhoto = wData.thumbnail.source;
            }
            break;
          }
        }
      } catch (_) {}
    }

    // If still no summary, search Wikipedia for "title artist canção"
    if (!summary) {
      const sRes = await fetchWithTimeout(
        `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`${cleanTitle} ${cleanArtist} canção`)}&utf8=&format=json`,
        { headers: wikiHeaders },
        2500
      );
      if (sRes.ok) {
        const sData = await sRes.json();
        const hit = sData.query?.search?.[0]?.title;
        if (hit) {
          const wRes2 = await fetchWithTimeout(
            `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit.replace(/\s+/g, '_'))}`,
            { headers: wikiHeaders },
            2500
          );
          if (wRes2.ok) {
            const wData2 = await wRes2.json();
            if (
              wData2.extract &&
              wData2.type !== 'disambiguation' &&
              !wData2.extract.includes('pode referir-se a:')
            ) {
              summary = wData2.extract;
            }
          }
        }
      }
    }

    // Fetch artist info from Wikipedia if artistPhoto or artistBio is missing
    try {
      const aRes = await fetchWithTimeout(
        `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanArtist.replace(/\s+/g, '_'))}`,
        { headers: wikiHeaders },
        2500
      );
      if (aRes.ok) {
        const aData = await aRes.json();
        if (aData.extract && aData.type !== 'disambiguation') {
          artistBio = aData.description || aData.extract.slice(0, 160) + '...';
          if (!artistPhoto && aData.thumbnail?.source) {
            artistPhoto = aData.thumbnail.source;
          }
        }
      }
    } catch (_) {}
  } catch (_) {}

  // Fallback summary if Wikipedia didn't have an article for this track
  if (!summary) {
    const parts = [];
    parts.push(`"${title}" é uma obra musical consagrada interpretada por ${artist}.`);
    if (album) {
      parts.push(`A faixa integra o álbum "${album}"${releaseDate ? `, lançado em ${releaseDate}` : releaseYear ? `, lançado em ${releaseYear}` : ''}.`);
    } else if (releaseDate) {
      parts.push(`Foi lançada oficialmente em ${releaseDate}.`);
    }
    if (genre) {
      parts.push(`A produção é uma referência no cenário de ${genre}, conquistando grande repercussão entre fãs e críticos.`);
    }
    if (artistBio) {
      parts.push(`Sobre ${artist}: ${artistBio}`);
    }
    summary = parts.join(' ');
  }

  // Fallback artist photo if none found
  if (!artistPhoto) {
    artistPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(artist)}&background=2563eb&color=fff&size=256&bold=true`;
  }

  const result = {
    title,
    artist,
    artistPhoto,
    artistBio,
    album: album || 'Single / Álbum Independente',
    releaseDate: releaseDate || releaseYear || 'Data não informada',
    genre: genre || 'Música',
    cover,
    summary,
  };

  cache.set(cacheKey, result);
  return res.status(200).json(result);
}
