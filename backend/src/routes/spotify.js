const express = require('express');
const router = express.Router();
const spotifyService = require('../services/spotifyService');

// Lista de faixas com áudio real de demonstração (fallback caso as chaves do Spotify não estejam configuradas no .env)
const REAL_AUDIO_FALLBACKS = [
  {
    id: 'real-1',
    title: 'Synthwave Night Ride',
    artist: 'Neon Cyber Sound',
    album: 'Retro Future',
    genre: 'Synthwave',
    cover: 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025285/bookhub/img/album1.jpg',
    previewUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    duration: '3:20',
    plays: '1.4M'
  },
  {
    id: 'real-2',
    title: 'Lo-Fi Sunset Dreams',
    artist: 'Chill Beats Studio',
    album: 'Pastel Horizon',
    genre: 'Lo-Fi',
    cover: 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025287/bookhub/img/album2.jpg',
    previewUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3',
    duration: '2:45',
    plays: '950K'
  },
  {
    id: 'real-3',
    title: 'Cyberpunk Ambient Flow',
    artist: 'Hyperion Audio',
    album: 'Deep Waves',
    genre: 'Eletrônica',
    cover: 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025291/bookhub/img/album3.jpg',
    previewUrl: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3',
    duration: '4:05',
    plays: '2.1M'
  }
];

/**
 * GET /api/spotify/search?q=query
 */
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Parâmetro de busca "q" é obrigatório' });
  }

  const tracks = await spotifyService.searchSpotify(q);
  
  if (tracks && tracks.length > 0) {
    return res.json({ source: 'spotify', tracks });
  }

  // Se o Spotify não estiver configurado ou não retornar nada, filtra o fallback
  const filtered = REAL_AUDIO_FALLBACKS.filter(t => 
    t.title.toLowerCase().includes(q.toLowerCase()) || 
    t.artist.toLowerCase().includes(q.toLowerCase())
  );
  return res.json({ source: 'fallback', tracks: filtered.length > 0 ? filtered : REAL_AUDIO_FALLBACKS });
});

/**
 * GET /api/spotify/trending?genre=pop
 */
router.get('/trending', async (req, res) => {
  const { genre = 'pop' } = req.query;
  const tracks = await spotifyService.getTrendingTracks(genre);

  if (tracks && tracks.length > 0) {
    return res.json({ source: 'spotify', tracks });
  }

  return res.json({ source: 'fallback', tracks: REAL_AUDIO_FALLBACKS });
});

module.exports = router;
