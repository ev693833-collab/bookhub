const express = require('express');
const https = require('https');
const router = express.Router();

// Cache em memória para buscas rápidas instantâneas
const ytCache = new Map();

function searchYouTubeVideoId(query) {
  if (ytCache.has(query)) {
    return Promise.resolve(ytCache.get(query));
  }

  return new Promise((resolve) => {
    const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query + ' official audio');
    
    const req = https.get(
      url,
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
            const videoId = matches[0][1];
            ytCache.set(query, videoId);
            resolve(videoId);
          } else {
            resolve(null);
          }
        });
      }
    );

    req.on('error', () => resolve(null));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

/**
 * GET /api/youtube/search?q=Justin+Bieber+Company
 * Retorna o videoId do YouTube para tocar a música INTEIRA (sem corte de 30s)
 */
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Parâmetro "q" é obrigatório' });
  }

  try {
    const videoId = await searchYouTubeVideoId(q);
    return res.json({
      query: q,
      videoId: videoId || null,
      embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1` : null
    });
  } catch (err) {
    console.error('Erro na busca do YouTube:', err);
    return res.status(500).json({ error: 'Erro ao buscar no YouTube' });
  }
});

/**
 * GET /api/youtube/suggest?q=djonga
 * Retorna sugestões reais do YouTube Music em tempo real
 */
router.get('/suggest', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ queries: [] });

  try {
    const url = 'https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=' + encodeURIComponent(q);
    const response = await fetch(url);
    const data = await response.json();
    return res.json({ queries: data[1] || [] });
  } catch (err) {
    return res.json({ queries: [] });
  }
});

module.exports = router;

