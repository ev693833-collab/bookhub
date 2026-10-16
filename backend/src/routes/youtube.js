const express = require('express');
const https = require('https');
const router = express.Router();

// Cache em memória para buscas rápidas instantâneas
const ytCache = new Map();

function fetchYoutubeQuery(searchUrl) {
  return new Promise((resolve) => {
    const req = https.get(
      searchUrl,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const matches = [...data.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)];
          if (matches && matches.length > 0) {
            resolve(matches[0][1]);
          } else {
            resolve(null);
          }
        });
      }
    );
    req.on('error', () => resolve(null));
    req.setTimeout(4500, () => {
      req.destroy();
      resolve(null);
    });
  });
}

async function searchYouTubeVideoId(input) {
  let query = '';
  let title = '';
  let artist = '';
  let album = '';

  if (typeof input === 'object' && input !== null) {
    title = (input.title || '').trim();
    artist = (input.artist || '').trim();
    album = (input.album || '').trim();
    query = (input.q || `${artist} ${title} ${album}`).trim();
  } else {
    query = (input || '').trim();
  }

  if (!query && !title) return null;

  const cacheKey = `${artist}__${title}__${album}__${query}`.toLowerCase();
  if (ytCache.has(cacheKey)) {
    return ytCache.get(cacheKey);
  }

  const isLive = /ao vivo|live|show|especial|concerto|apoteose/i.test(`${title} ${album}`);
  const isAcoustic = /ac[uú]stico|acoustic|unplugged/i.test(`${title} ${album}`);
  const isRemix = /remix|mix|edit/i.test(`${title} ${album}`);

  let videoId = null;

  // 1. Tenta a versão EXATA do álbum específico (evita misturar álbuns ao vivo com álbuns de estúdio)
  const isGenericAlbum = !album || /single|ep|álbum|album/i.test(album) && album.length <= 6;
  if (title && artist && album && !isGenericAlbum) {
    const qAlbum = `${artist} ${title} ${album}`.replace(/[-–—]/g, ' ').replace(/\s+/g, ' ').trim();
    videoId = await fetchYoutubeQuery('https://www.youtube.com/results?search_query=' + encodeURIComponent(qAlbum));
  }

  // 2. Se for versão Ao Vivo ou Acústico ou Remix e ainda não encontrou:
  if (!videoId && title && artist) {
    if (isLive) {
      videoId = await fetchYoutubeQuery('https://www.youtube.com/results?search_query=' + encodeURIComponent(`${artist} ${title} ao vivo`));
    } else if (isAcoustic) {
      videoId = await fetchYoutubeQuery('https://www.youtube.com/results?search_query=' + encodeURIComponent(`${artist} ${title} acustico`));
    } else if (isRemix) {
      videoId = await fetchYoutubeQuery('https://www.youtube.com/results?search_query=' + encodeURIComponent(`${artist} ${title} remix`));
    } else {
      // Versão de estúdio padrão: busca com official audio para não pegar versões ao vivo aleatórias
      videoId = await fetchYoutubeQuery('https://www.youtube.com/results?search_query=' + encodeURIComponent(`${artist} ${title} official audio`));
    }
  }

  // 3. Se ainda não encontrou, busca direta simples
  if (!videoId) {
    const cleanSimple = (query || `${artist} ${title}`).replace(/[()[\]{}]/g, ' ').replace(/\s+/g, ' ').trim();
    videoId = await fetchYoutubeQuery('https://www.youtube.com/results?search_query=' + encodeURIComponent(cleanSimple));
  }

  // 4. Fallback: simplifica parênteses e participações
  if (!videoId && (query.includes('(') || query.includes('feat') || query.includes('&'))) {
    const simplified = query.replace(/\([^)]*\)/g, '').replace(/feat\.?.*$/i, '').replace(/part\.?.*$/i, '').trim();
    if (simplified) {
      videoId = await fetchYoutubeQuery('https://www.youtube.com/results?search_query=' + encodeURIComponent(simplified));
    }
  }

  if (videoId) {
    if (ytCache.size > 800) ytCache.clear();
    ytCache.set(cacheKey, videoId);
  }

  return videoId;
}

/**
 * GET /api/youtube/search?q=Justin+Bieber+Company&title=Company&artist=Justin+Bieber&album=Purpose
 * Retorna o videoId do YouTube para tocar a música INTEIRA na versão exata (ao vivo, estúdio, acústico, etc.)
 */
router.get('/search', async (req, res) => {
  const { q, title, artist, album } = req.query;
  if (!q && !title) {
    return res.status(400).json({ error: 'Parâmetro "q" ou "title" é obrigatório' });
  }

  try {
    const videoId = await searchYouTubeVideoId({ q, title, artist, album });
    return res.json({
      query: q || `${artist || ''} ${title || ''} ${album || ''}`.trim(),
      videoId: videoId || null,
      embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1` : null
    });
  } catch (err) {
    console.error('Erro na busca do YouTube:', err);
    return res.status(500).json({ error: 'Erro ao buscar no YouTube' });
  }
});

const suggestCache = new Map();

/**
 * GET /api/youtube/suggest?q=djonga
 * Retorna sugestões reais do YouTube Music em tempo real
 */
router.get('/suggest', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ queries: [] });

  const qClean = (q || '').toLowerCase().trim();
  if (suggestCache.has(qClean)) {
    return res.json({ queries: suggestCache.get(qClean) });
  }

  try {
    const url = 'https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=' + encodeURIComponent(q);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    const data = await response.json();
    const queries = data[1] || [];
    if (suggestCache.size > 500) suggestCache.clear();
    suggestCache.set(qClean, queries);
    return res.json({ queries });
  } catch (err) {
    return res.json({ queries: [] });
  }
});

module.exports = router;

