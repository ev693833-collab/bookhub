const axios = require('axios');
const querystring = require('querystring');

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Obtém ou renova o Access Token da Spotify Web API usando Client Credentials Flow
 */
async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret || clientId === 'your_spotify_client_id_here') {
    return null; // Não configurado ainda
  }

  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  try {
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      querystring.stringify({ grant_type: 'client_credentials' }),
      {
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    cachedToken = response.data.access_token;
    // Expira em segundos (descontando 60s de margem de segurança)
    tokenExpiresAt = now + (response.data.expires_in - 60) * 1000;
    return cachedToken;
  } catch (error) {
    console.error('Erro ao obter token do Spotify:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Busca músicas, artistas e álbuns no Spotify
 */
async function searchSpotify(query, type = 'track', limit = 12) {
  const token = await getSpotifyAccessToken();
  if (!token) return null;

  try {
    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: query, type, limit }
    });

    return response.data.tracks?.items.map(formatSpotifyTrack) || [];
  } catch (error) {
    console.error('Erro na busca do Spotify:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Obtém recomendações / em alta do Spotify
 */
async function getTrendingTracks(genre = 'pop', limit = 12) {
  const token = await getSpotifyAccessToken();
  if (!token) return null;

  try {
    const response = await axios.get('https://api.spotify.com/v1/recommendations', {
      headers: { Authorization: `Bearer ${token}` },
      params: { seed_genres: genre, limit }
    });

    return response.data.tracks?.map(formatSpotifyTrack) || [];
  } catch (error) {
    console.error('Erro ao buscar recomendações no Spotify:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Formata a resposta do Spotify para o padrão da nossa aplicação
 */
function formatSpotifyTrack(track) {
  return {
    id: track.id,
    title: track.name,
    artist: track.artists.map(a => a.name).join(', '),
    album: track.album.name,
    cover: track.album.images[0]?.url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025285/bookhub/img/album1.jpg',
    previewUrl: track.preview_url, // Áudio de 30s de preview do Spotify
    spotifyUrl: track.external_urls?.spotify,
    durationMs: track.duration_ms,
    duration: formatDuration(track.duration_ms),
    popularity: track.popularity
  };
}

function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

module.exports = {
  getSpotifyAccessToken,
  searchSpotify,
  getTrendingTracks
};
