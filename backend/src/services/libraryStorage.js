const fs = require('fs');
const path = require('path');
const db = require('../config/database');

const DATA_DIR = path.join(__dirname, '../../data');
const PLAYLISTS_FILE = path.join(DATA_DIR, 'playlists.json');
const PLAYLIST_TRACKS_FILE = path.join(DATA_DIR, 'playlist_tracks.json');
const ARTISTS_FILE = path.join(DATA_DIR, 'artists.json');
const ALBUMS_FILE = path.join(DATA_DIR, 'albums.json');
const TRACKS_FILE = path.join(DATA_DIR, 'company_tracks.json');
const PURCHASES_FILE = path.join(DATA_DIR, 'company_purchases.json');
const COMPANIES_FILE = path.join(DATA_DIR, 'companies.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Constante canônica do ciclo de aluguel: exatamente 30 dias contados em milissegundos
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Canonical Initial Seed Data from migrate_multibase.js
const INITIAL_COMPANIES = [
  {
    id: 1,
    name: 'DevSongs Urban Records',
    slug: 'devsongs-urban',
    genre: 'Trap & Hip-Hop',
    description: 'Gravadora focada nos maiores nomes do trap, rap e cultura urbana nacional.',
    logo_url: '/img/bk_avatar.png',
    banner_url: '/img/bk_banner.jpg',
    city: 'Rio de Janeiro',
    state: 'RJ',
    status: 'active',
    created_at: '2026-10-15T12:00:00.000Z'
  },
  {
    id: 2,
    name: 'Forró & Piseiro Prime',
    slug: 'forro-prime',
    genre: 'Forró & Piseiro',
    description: 'Acervo exclusivo com as melhores faixas de vaquejada, piseiro e forró do Brasil.',
    logo_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/13/98/4c/13984c56-f8fc-318e-9bc4-65b925b4783b/8447053281338.jpg/600x600bb.jpg',
    banner_url: '/img/artist_banner_justin.jpg',
    city: 'Fortaleza',
    state: 'CE',
    status: 'active',
    created_at: '2026-10-15T12:00:00.000Z'
  },
  {
    id: 3,
    name: 'Mega Hits Gravadora',
    slug: 'mega-hits',
    genre: 'Funk & Pop',
    description: 'Distribuidora líder em lançamentos de funk, pop internacional e paradas virais.',
    logo_url: 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png',
    banner_url: '/img/bk_banner.jpg',
    city: 'São Paulo',
    state: 'SP',
    status: 'active',
    created_at: '2026-10-15T12:00:00.000Z'
  }
];

const INITIAL_TRACKS = [
  {
    id: 1,
    company_id: 1,
    title: 'Músicas de amor nunca mais',
    artist: 'BK',
    album: 'ICARUS',
    genre: 'Rap',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/3b/2e/21/3b2e21b4-57f7-f735-16b1-2a622626e3a0/8445162776523.jpg/600x600bb.jpg',
    preview_url: null,
    youtube_video_id: null,
    duration_sec: 214,
    stock_quantity: 45,
    sale_price: 4.90,
    rent_price: 1.90,
    available_for_stream: true,
    is_exclusive: true,
    status: 'active',
    created_at: '2026-10-16T10:00:00.000Z'
  },
  {
    id: 2,
    company_id: 1,
    title: 'Cacos De Vidro',
    artist: 'BK',
    album: 'Diamantes, Lágrimas e Rostos para Esquecer',
    genre: 'Rap',
    cover_url: 'https://cdn-images.dzcdn.net/images/cover/927397ea14b00eba92454a88ec4f352d/500x500-000000-80-0-0.jpg',
    preview_url: null,
    youtube_video_id: null,
    duration_sec: 198,
    stock_quantity: 30,
    sale_price: 5.90,
    rent_price: 2.50,
    available_for_stream: true,
    is_exclusive: true,
    status: 'active',
    created_at: '2026-10-16T10:00:00.000Z'
  },
  {
    id: 3,
    company_id: 1,
    title: 'Novo Balanço',
    artist: 'Veigh',
    album: 'Dos Prédios Deluxe',
    genre: 'Trap',
    cover_url: 'https://cdn-images.dzcdn.net/images/cover/6646c5f4c6b60b0ddd4f00987623437c/500x500-000000-80-0-0.jpg',
    preview_url: null,
    youtube_video_id: null,
    duration_sec: 184,
    stock_quantity: 12,
    sale_price: 6.90,
    rent_price: 2.90,
    available_for_stream: true,
    is_exclusive: false,
    status: 'active',
    created_at: '2026-10-16T10:00:00.000Z'
  },
  {
    id: 4,
    company_id: 1,
    title: '100% MOLHO',
    artist: 'Brandão85, Jovem Dex, Leviano',
    album: 'ISSO É TRAP',
    genre: 'Trap',
    cover_url: 'https://cdn-images.dzcdn.net/images/cover/823c311b28a72801b809da4d99c621f4/500x500-000000-80-0-0.jpg',
    preview_url: null,
    youtube_video_id: null,
    duration_sec: 165,
    stock_quantity: 8,
    sale_price: 4.50,
    rent_price: 1.80,
    available_for_stream: true,
    is_exclusive: false,
    status: 'active',
    created_at: '2026-10-16T10:00:00.000Z'
  },
  {
    id: 5,
    company_id: 2,
    title: 'Acabou Acabou (Ao Vivo)',
    artist: 'Pricila areba',
    album: 'Roda de Piseiro, Vol. 1 (Ao Vivo)',
    genre: 'Piseiro',
    cover_url: 'https://cdn-images.dzcdn.net/images/cover/927397ea14b00eba92454a88ec4f352d/500x500-000000-80-0-0.jpg',
    preview_url: null,
    youtube_video_id: null,
    duration_sec: 190,
    stock_quantity: 25,
    sale_price: 3.90,
    rent_price: 1.50,
    available_for_stream: true,
    is_exclusive: true,
    status: 'active',
    created_at: '2026-10-16T10:00:00.000Z'
  },
  {
    id: 6,
    company_id: 2,
    title: 'Torre Eiffel (Ao Vivo)',
    artist: 'Pricila areba',
    album: 'Roda de Piseiro, Vol. 1 (Ao Vivo)',
    genre: 'Piseiro',
    cover_url: 'https://cdn-images.dzcdn.net/images/cover/f9e0787a4ddf82e8b625cf030b42774a/500x500-000000-80-0-0.jpg',
    preview_url: null,
    youtube_video_id: null,
    duration_sec: 210,
    stock_quantity: 15,
    sale_price: 3.90,
    rent_price: 1.50,
    available_for_stream: true,
    is_exclusive: true,
    status: 'active',
    created_at: '2026-10-16T10:00:00.000Z'
  },
  {
    id: 7,
    company_id: 2,
    title: 'Planeta de Cores',
    artist: 'Forrozão Tropykália',
    album: 'Tropykália 25 Anos',
    genre: 'Forró',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e0/92/da/e092da2d-9f6d-11dc-7843-2021e95a2b61/21UMGIM17518.rgb.jpg/600x600bb.jpg',
    preview_url: null,
    youtube_video_id: null,
    duration_sec: 230,
    stock_quantity: 40,
    sale_price: 4.20,
    rent_price: 1.70,
    available_for_stream: true,
    is_exclusive: false,
    status: 'active',
    created_at: '2026-10-16T10:00:00.000Z'
  },
  {
    id: 8,
    company_id: 2,
    title: 'Par Perfeito',
    artist: 'Priscila Areba',
    album: 'Par Perfeito',
    genre: 'Forró',
    cover_url: 'https://cdn-images.dzcdn.net/images/cover/e3dd74dfebdfae5ad220ce690a6f8b1b/500x500-000000-80-0-0.jpg',
    preview_url: null,
    youtube_video_id: null,
    duration_sec: 185,
    stock_quantity: 20,
    sale_price: 3.50,
    rent_price: 1.20,
    available_for_stream: true,
    is_exclusive: false,
    status: 'active',
    created_at: '2026-10-16T10:00:00.000Z'
  },
  {
    id: 9,
    company_id: 3,
    title: 'Nova Tendência',
    artist: 'MC GP',
    album: 'Nova Tendência',
    genre: 'Funk',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/b9/78/fa/b978fac2-a626-ea2e-ea93-5f7e7bf642b4/8429006299409.jpg/600x600bb.jpg',
    preview_url: null,
    youtube_video_id: null,
    duration_sec: 175,
    stock_quantity: 50,
    sale_price: 4.90,
    rent_price: 1.90,
    available_for_stream: true,
    is_exclusive: true,
    status: 'active',
    created_at: '2026-10-16T10:00:00.000Z'
  },
  {
    id: 10,
    company_id: 3,
    title: 'Peitão Molhado',
    artist: 'MC GP',
    album: 'Funk Hits',
    genre: 'Funk',
    cover_url: 'https://cdn-images.dzcdn.net/images/cover/b4618e8071852c93850ea9c7a233b2a2/500x500-000000-80-0-0.jpg',
    preview_url: null,
    youtube_video_id: null,
    duration_sec: 160,
    stock_quantity: 35,
    sale_price: 4.90,
    rent_price: 1.90,
    available_for_stream: true,
    is_exclusive: false,
    status: 'active',
    created_at: '2026-10-16T10:00:00.000Z'
  },
  {
    id: 11,
    company_id: 3,
    title: 'Sorry',
    artist: 'Justin Bieber',
    album: 'Purpose',
    genre: 'Pop',
    cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/81/a4/dc/81a4dc50-8d7e-6ae5-71d3-f83393348248/15UMGIM59807.rgb.jpg/600x600bb.jpg',
    preview_url: null,
    youtube_video_id: null,
    duration_sec: 200,
    stock_quantity: 100,
    sale_price: 7.90,
    rent_price: 2.90,
    available_for_stream: true,
    is_exclusive: false,
    status: 'active',
    created_at: '2026-10-16T10:00:00.000Z'
  }
];

const INITIAL_ARTISTS = [
  { id: 1, name: 'BK', bio: 'Rapper, compositor e produtor brasileiro, um dos expoentes do hip-hop nacional.', avatar_url: 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/bk_avatar.png', genre: 'Rap', created_at: '2026-10-15T12:00:00.000Z' },
  { id: 2, name: 'Veigh', bio: 'Destaque do trap nacional com sucessos que lideraram as paradas do streaming.', avatar_url: 'https://cdn-images.dzcdn.net/images/cover/6646c5f4c6b60b0ddd4f00987623437c/500x500-000000-80-0-0.jpg', genre: 'Trap', created_at: '2026-10-15T12:00:00.000Z' },
  { id: 3, name: 'Brandão85', bio: 'Artista do trap e hip-hop com parcerias marcantes.', avatar_url: 'https://cdn-images.dzcdn.net/images/cover/823c311b28a72801b809da4d99c621f4/500x500-000000-80-0-0.jpg', genre: 'Trap', created_at: '2026-10-15T12:00:00.000Z' },
  { id: 4, name: 'Pricila areba', bio: 'Voz marcante do piseiro e vaquejada nordestina.', avatar_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/13/98/4c/13984c56-f8fc-318e-9bc4-65b925b4783b/8447053281338.jpg/600x600bb.jpg', genre: 'Piseiro', created_at: '2026-10-15T12:00:00.000Z' },
  { id: 5, name: 'Forrozão Tropykália', bio: 'Grupo icônico de forró romântico brasileiro.', avatar_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e0/92/da/e092da2d-9f6d-11dc-7843-2021e95a2b61/21UMGIM17518.rgb.jpg/600x600bb.jpg', genre: 'Forró', created_at: '2026-10-15T12:00:00.000Z' },
  { id: 6, name: 'MC GP', bio: 'MC da cena do funk consciente e paulista.', avatar_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/b9/78/fa/b978fac2-a626-ea2e-ea93-5f7e7bf642b4/8429006299409.jpg/600x600bb.jpg', genre: 'Funk', created_at: '2026-10-15T12:00:00.000Z' },
  { id: 7, name: 'Justin Bieber', bio: 'Superestrela global do pop.', avatar_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/81/a4/dc/81a4dc50-8d7e-6ae5-71d3-f83393348248/15UMGIM59807.rgb.jpg/600x600bb.jpg', genre: 'Pop', created_at: '2026-10-15T12:00:00.000Z' }
];

const INITIAL_ALBUMS = [
  { id: 1, title: 'ICARUS', artist_name: 'BK', artist_id: 1, cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/3b/2e/21/3b2e21b4-57f7-f735-16b1-2a622626e3a0/8445162776523.jpg/600x600bb.jpg', release_date: '2022-11-17', genre: 'Rap', created_at: '2026-10-15T12:00:00.000Z' },
  { id: 2, title: 'Diamantes, Lágrimas e Rostos para Esquecer', artist_name: 'BK', artist_id: 1, cover_url: 'https://cdn-images.dzcdn.net/images/cover/927397ea14b00eba92454a88ec4f352d/500x500-000000-80-0-0.jpg', release_date: '2024-04-25', genre: 'Rap', created_at: '2026-10-15T12:00:00.000Z' },
  { id: 3, title: 'Dos Prédios Deluxe', artist_name: 'Veigh', artist_id: 2, cover_url: 'https://cdn-images.dzcdn.net/images/cover/6646c5f4c6b60b0ddd4f00987623437c/500x500-000000-80-0-0.jpg', release_date: '2023-05-19', genre: 'Trap', created_at: '2026-10-15T12:00:00.000Z' },
  { id: 4, title: 'ISSO É TRAP', artist_name: 'Brandão85', artist_id: 3, cover_url: 'https://cdn-images.dzcdn.net/images/cover/823c311b28a72801b809da4d99c621f4/500x500-000000-80-0-0.jpg', release_date: '2023-08-10', genre: 'Trap', created_at: '2026-10-15T12:00:00.000Z' },
  { id: 5, title: 'Roda de Piseiro, Vol. 1 (Ao Vivo)', artist_name: 'Pricila areba', artist_id: 4, cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/13/98/4c/13984c56-f8fc-318e-9bc4-65b925b4783b/8447053281338.jpg/600x600bb.jpg', release_date: '2023-09-01', genre: 'Piseiro', created_at: '2026-10-15T12:00:00.000Z' },
  { id: 6, title: 'Tropykália 25 Anos', artist_name: 'Forrozão Tropykália', artist_id: 5, cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e0/92/da/e092da2d-9f6d-11dc-7843-2021e95a2b61/21UMGIM17518.rgb.jpg/600x600bb.jpg', release_date: '2022-07-15', genre: 'Forró', created_at: '2026-10-15T12:00:00.000Z' },
  { id: 7, title: 'Par Perfeito', artist_name: 'Priscila Areba', artist_id: 4, cover_url: 'https://cdn-images.dzcdn.net/images/cover/e3dd74dfebdfae5ad220ce690a6f8b1b/500x500-000000-80-0-0.jpg', release_date: '2024-01-20', genre: 'Forró', created_at: '2026-10-15T12:00:00.000Z' },
  { id: 8, title: 'Nova Tendência', artist_name: 'MC GP', artist_id: 6, cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/b9/78/fa/b978fac2-a626-ea2e-ea93-5f7e7bf642b4/8429006299409.jpg/600x600bb.jpg', release_date: '2023-11-05', genre: 'Funk', created_at: '2026-10-15T12:00:00.000Z' },
  { id: 9, title: 'Purpose', artist_name: 'Justin Bieber', artist_id: 7, cover_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/81/a4/dc/81a4dc50-8d7e-6ae5-71d3-f83393348248/15UMGIM59807.rgb.jpg/600x600bb.jpg', release_date: '2015-11-13', genre: 'Pop', created_at: '2026-10-15T12:00:00.000Z' }
];

// Helper to ensure files exist
function ensureFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const initFile = (filePath, defaultData) => {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
    }
  };

  initFile(COMPANIES_FILE, INITIAL_COMPANIES);
  initFile(TRACKS_FILE, INITIAL_TRACKS);
  initFile(ARTISTS_FILE, INITIAL_ARTISTS);
  initFile(ALBUMS_FILE, INITIAL_ALBUMS);
  initFile(PLAYLISTS_FILE, []);
  initFile(PLAYLIST_TRACKS_FILE, []);
  initFile(PURCHASES_FILE, []);
  initFile(ORDERS_FILE, []);
}

function readJson(file, fallback = []) {
  ensureFiles();
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch (_) {
    return fallback;
  }
}

function writeJson(file, data) {
  ensureFiles();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// Check if MySQL connection is live and usable
let isMySqlAvailable = null;

async function checkMySql() {
  try {
    const [rows] = await db.query('SELECT 1');
    isMySqlAvailable = true;
    return true;
  } catch (_) {
    isMySqlAvailable = false;
    return false;
  }
}

// Database DDL Initialization for MySQL when connected
async function initMySqlTables() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS playlists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT DEFAULT NULL,
        cover_url VARCHAR(500) DEFAULT NULL,
        privacy ENUM('public', 'unlisted', 'private') NOT NULL DEFAULT 'private',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_playlists_user (user_id),
        INDEX idx_playlists_privacy (privacy)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS playlist_tracks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        playlist_id INT NOT NULL,
        track_id INT NOT NULL,
        position INT NOT NULL DEFAULT 1,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pt_playlist (playlist_id),
        INDEX idx_pt_track (track_id),
        INDEX idx_pt_position (playlist_id, position)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS artists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        bio TEXT DEFAULT NULL,
        avatar_url VARCHAR(500) DEFAULT NULL,
        genre VARCHAR(100) DEFAULT 'Variado',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS albums (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        artist_name VARCHAR(255) NOT NULL,
        artist_id INT DEFAULT NULL,
        cover_url VARCHAR(500) DEFAULT NULL,
        release_date DATE DEFAULT NULL,
        genre VARCHAR(100) DEFAULT 'Variado',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_albums_artist_id (artist_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } catch (err) {
    console.warn('Tabelas de biblioteca no MySQL não puderam ser inicializadas:', err.message);
  }
}

// Initialize tables in background if MySQL is alive
checkMySql().then(alive => {
  if (alive) {
    initMySqlTables();
  }
}).catch(() => {});

// =========================================================================
// PLAYLISTS OPERATIONS
// =========================================================================

async function getPlaylists(userId, includePublic = false) {
  const hasMySql = await checkMySql();
  if (hasMySql) {
    try {
      const sql = includePublic
        ? `
          SELECT p.*, 
            COUNT(pt.id) AS track_count, 
            COALESCE(SUM(ct.duration_sec), 0) AS total_duration_sec,
            u.full_name AS owner_name,
            (
              SELECT GROUP_CONCAT(DISTINCT ct2.cover_url ORDER BY pt2.position ASC SEPARATOR '||')
              FROM playlist_tracks pt2
              JOIN company_tracks ct2 ON pt2.track_id = ct2.id
              WHERE pt2.playlist_id = p.id AND ct2.cover_url IS NOT NULL
            ) AS track_covers_raw,
            (
              SELECT GROUP_CONCAT(pt3.track_id)
              FROM playlist_tracks pt3
              WHERE pt3.playlist_id = p.id
            ) AS track_ids_raw
          FROM playlists p
          LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
          LEFT JOIN company_tracks ct ON pt.track_id = ct.id
          LEFT JOIN users u ON p.user_id = u.id
          WHERE p.user_id = ? OR p.privacy = 'public'
          GROUP BY p.id
          ORDER BY p.updated_at DESC
        `
        : `
          SELECT p.*, 
            COUNT(pt.id) AS track_count, 
            COALESCE(SUM(ct.duration_sec), 0) AS total_duration_sec,
            u.full_name AS owner_name,
            (
              SELECT GROUP_CONCAT(DISTINCT ct2.cover_url ORDER BY pt2.position ASC SEPARATOR '||')
              FROM playlist_tracks pt2
              JOIN company_tracks ct2 ON pt2.track_id = ct2.id
              WHERE pt2.playlist_id = p.id AND ct2.cover_url IS NOT NULL
            ) AS track_covers_raw,
            (
              SELECT GROUP_CONCAT(pt3.track_id)
              FROM playlist_tracks pt3
              WHERE pt3.playlist_id = p.id
            ) AS track_ids_raw
          FROM playlists p
          LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
          LEFT JOIN company_tracks ct ON pt.track_id = ct.id
          LEFT JOIN users u ON p.user_id = u.id
          WHERE p.user_id = ?
          GROUP BY p.id
          ORDER BY p.updated_at DESC
        `;
      const [rows] = await db.query(sql, [userId]);
      return rows.map(r => ({
        ...r,
        track_covers: r.track_covers_raw ? r.track_covers_raw.split('||').slice(0, 4) : [],
        track_ids: r.track_ids_raw ? r.track_ids_raw.split(',').map(Number) : []
      }));
    } catch (err) {
      console.warn('Erro ao consultar playlists no MySQL, usando fallback:', err.message);
    }
  }

  // Fallback JSON
  const playlists = readJson(PLAYLISTS_FILE);
  const playlistTracks = readJson(PLAYLIST_TRACKS_FILE);
  const tracks = readJson(TRACKS_FILE);

  const filtered = playlists.filter(p => {
    if (includePublic) {
      return p.user_id === userId || p.privacy === 'public';
    }
    return p.user_id === userId;
  });

  return filtered.map(p => {
    const pts = playlistTracks.filter(pt => pt.playlist_id === p.id).sort((a, b) => (a.position || 0) - (b.position || 0));
    const totalDuration = pts.reduce((acc, pt) => {
      const track = tracks.find(t => t.id === pt.track_id);
      return acc + (track?.duration_sec || 0);
    }, 0);

    const trackCovers = [];
    for (const pt of pts) {
      const track = tracks.find(t => t.id === pt.track_id);
      const c = track?.cover_url || track?.cover;
      if (c && !trackCovers.includes(c)) {
        trackCovers.push(c);
        if (trackCovers.length === 4) break;
      }
    }

    const trackIds = pts.map(pt => Number(pt.track_id));

    return {
      ...p,
      track_count: pts.length,
      total_duration_sec: totalDuration,
      track_covers: trackCovers,
      track_ids: trackIds
    };
  }).sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
}

async function getPlaylistById(playlistId, userId = null) {
  const pId = Number(playlistId);
  const hasMySql = await checkMySql();

  if (hasMySql) {
    try {
      const [pRows] = await db.query(
        `SELECT p.*, u.full_name AS owner_name, u.email AS owner_email
         FROM playlists p
         LEFT JOIN users u ON p.user_id = u.id
         WHERE p.id = ? LIMIT 1`,
        [pId]
      );
      if (pRows.length === 0) return null;
      const playlist = pRows[0];

      // Privacy Authorization Check
      const isOwner = userId && Number(playlist.user_id) === Number(userId);
      if (!isOwner) {
        if (playlist.privacy === 'private') {
          const err = new Error('Acesso negado. Esta playlist é particular.');
          err.statusCode = 403;
          throw err;
        }
        // 'public' and 'unlisted' can be viewed via direct ID
      }

      const [trackRows] = await db.query(
        `SELECT pt.id AS playlist_track_id, pt.position, pt.added_at,
                ct.id, ct.title, ct.artist, ct.album, ct.genre, ct.cover_url,
                ct.preview_url, ct.duration_sec, ct.available_for_stream, ct.status,
                c.name AS company_name
         FROM playlist_tracks pt
         JOIN company_tracks ct ON pt.track_id = ct.id
         LEFT JOIN companies c ON ct.company_id = c.id
         WHERE pt.playlist_id = ?
         ORDER BY pt.position ASC, pt.id ASC`,
        [pId]
      );

      const totalDuration = trackRows.reduce((acc, t) => acc + (t.duration_sec || 0), 0);

      const trackCovers = [];
      for (const t of trackRows) {
        const c = t.cover_url || t.cover;
        if (c && !trackCovers.includes(c)) {
          trackCovers.push(c);
          if (trackCovers.length === 4) break;
        }
      }

      return {
        ...playlist,
        track_count: trackRows.length,
        total_duration_sec: totalDuration,
        track_covers: trackCovers,
        track_ids: trackRows.map(t => Number(t.id)),
        tracks: trackRows
      };
    } catch (err) {
      if (err.statusCode) throw err;
      console.warn('Erro ao obter playlist no MySQL, usando fallback:', err.message);
    }
  }

  // Fallback JSON
  const playlists = readJson(PLAYLISTS_FILE);
  const playlist = playlists.find(p => Number(p.id) === pId);
  if (!playlist) return null;

  const isOwner = userId && Number(playlist.user_id) === Number(userId);
  if (!isOwner) {
    if (playlist.privacy === 'private') {
      const err = new Error('Acesso negado. Esta playlist é particular.');
      err.statusCode = 403;
      throw err;
    }
  }

  const playlistTracks = readJson(PLAYLIST_TRACKS_FILE);
  const tracks = readJson(TRACKS_FILE);

  const matchedPts = playlistTracks
    .filter(pt => Number(pt.playlist_id) === pId)
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  const trackList = matchedPts.map(pt => {
    const track = tracks.find(t => Number(t.id) === Number(pt.track_id)) || {};
    return {
      playlist_track_id: pt.id,
      position: pt.position,
      added_at: pt.added_at,
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      genre: track.genre,
      cover_url: track.cover_url,
      preview_url: track.preview_url,
      duration_sec: track.duration_sec || 0,
      available_for_stream: track.available_for_stream !== false,
      status: track.status || 'active'
    };
  });

  const totalDuration = trackList.reduce((acc, t) => acc + (t.duration_sec || 0), 0);

  const trackCovers = [];
  for (const t of trackList) {
    const c = t.cover_url || t.cover;
    if (c && !trackCovers.includes(c)) {
      trackCovers.push(c);
      if (trackCovers.length === 4) break;
    }
  }

  return {
    ...playlist,
    track_count: trackList.length,
    total_duration_sec: totalDuration,
    track_covers: trackCovers,
    track_ids: trackList.map(t => Number(t.id)),
    tracks: trackList
  };
}

async function createPlaylist(userId, { name, description = null, cover_url = null, privacy = 'private' }) {
  if (!name || !name.trim()) {
    throw new Error('O nome da playlist é obrigatório.');
  }

  const validPrivacies = ['public', 'unlisted', 'private'];
  const cleanPrivacy = validPrivacies.includes(privacy) ? privacy : 'private';

  const hasMySql = await checkMySql();
  if (hasMySql) {
    try {
      const [res] = await db.query(
        `INSERT INTO playlists (user_id, name, description, cover_url, privacy)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, name.trim(), description ? description.trim() : null, cover_url || null, cleanPrivacy]
      );
      return {
        id: res.insertId,
        user_id: userId,
        name: name.trim(),
        description: description ? description.trim() : null,
        cover_url: cover_url || null,
        privacy: cleanPrivacy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        track_count: 0,
        total_duration_sec: 0,
        tracks: []
      };
    } catch (err) {
      console.warn('Erro ao inserir playlist no MySQL, usando fallback:', err.message);
    }
  }

  // Fallback JSON
  const playlists = readJson(PLAYLISTS_FILE);
  const newId = playlists.length > 0 ? Math.max(...playlists.map(p => Number(p.id) || 0)) + 1 : 1;
  const now = new Date().toISOString();

  const newPlaylist = {
    id: newId,
    user_id: Number(userId),
    name: name.trim(),
    description: description ? description.trim() : null,
    cover_url: cover_url || null,
    privacy: cleanPrivacy,
    created_at: now,
    updated_at: now
  };

  playlists.push(newPlaylist);
  writeJson(PLAYLISTS_FILE, playlists);

  return {
    ...newPlaylist,
    track_count: 0,
    total_duration_sec: 0,
    tracks: []
  };
}

async function updatePlaylist(playlistId, userId, { name, description, cover_url, privacy }) {
  const pId = Number(playlistId);
  const hasMySql = await checkMySql();

  if (hasMySql) {
    try {
      const [rows] = await db.query('SELECT user_id FROM playlists WHERE id = ? LIMIT 1', [pId]);
      if (rows.length === 0) {
        const err = new Error('Playlist não encontrada.');
        err.statusCode = 404;
        throw err;
      }
      if (Number(rows[0].user_id) !== Number(userId)) {
        const err = new Error('Você não tem permissão para alterar esta playlist.');
        err.statusCode = 403;
        throw err;
      }

      const updates = [];
      const params = [];

      if (name !== undefined) {
        if (!name.trim()) throw new Error('O nome da playlist não pode ser vazio.');
        updates.push('name = ?');
        params.push(name.trim());
      }
      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description ? description.trim() : null);
      }
      if (cover_url !== undefined) {
        updates.push('cover_url = ?');
        params.push(cover_url && cover_url.trim() ? cover_url.trim() : null);
      }
      if (privacy !== undefined) {
        const valid = ['public', 'unlisted', 'private'];
        if (!valid.includes(privacy)) throw new Error('Opção de privacidade inválida.');
        updates.push('privacy = ?');
        params.push(privacy);
      }

      if (updates.length > 0) {
        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(pId);
        await db.query(`UPDATE playlists SET ${updates.join(', ')} WHERE id = ?`, params);
      }

      return getPlaylistById(pId, userId);
    } catch (err) {
      if (err.statusCode) throw err;
      console.warn('Erro ao atualizar playlist no MySQL, usando fallback:', err.message);
    }
  }

  // Fallback JSON
  const playlists = readJson(PLAYLISTS_FILE);
  const idx = playlists.findIndex(p => Number(p.id) === pId);
  if (idx === -1) {
    const err = new Error('Playlist não encontrada.');
    err.statusCode = 404;
    throw err;
  }

  if (Number(playlists[idx].user_id) !== Number(userId)) {
    const err = new Error('Você não tem permissão para alterar esta playlist.');
    err.statusCode = 403;
    throw err;
  }

  if (name !== undefined) {
    if (!name.trim()) throw new Error('O nome da playlist não pode ser vazio.');
    playlists[idx].name = name.trim();
  }
  if (description !== undefined) {
    playlists[idx].description = description ? description.trim() : null;
  }
  if (cover_url !== undefined) {
    playlists[idx].cover_url = cover_url && cover_url.trim() ? cover_url.trim() : null;
  }
  if (privacy !== undefined) {
    const valid = ['public', 'unlisted', 'private'];
    if (!valid.includes(privacy)) throw new Error('Opção de privacidade inválida.');
    playlists[idx].privacy = privacy;
  }

  playlists[idx].updated_at = new Date().toISOString();
  writeJson(PLAYLISTS_FILE, playlists);

  return getPlaylistById(pId, userId);
}

async function deletePlaylist(playlistId, userId) {
  const pId = Number(playlistId);
  const hasMySql = await checkMySql();

  if (hasMySql) {
    try {
      const [rows] = await db.query('SELECT user_id FROM playlists WHERE id = ? LIMIT 1', [pId]);
      if (rows.length === 0) {
        const err = new Error('Playlist não encontrada.');
        err.statusCode = 404;
        throw err;
      }
      if (Number(rows[0].user_id) !== Number(userId)) {
        const err = new Error('Você não tem permissão para excluir esta playlist.');
        err.statusCode = 403;
        throw err;
      }

      await db.query('DELETE FROM playlist_tracks WHERE playlist_id = ?', [pId]);
      await db.query('DELETE FROM playlists WHERE id = ?', [pId]);
      return { success: true, message: 'Playlist excluída com sucesso.' };
    } catch (err) {
      if (err.statusCode) throw err;
      console.warn('Erro ao deletar playlist no MySQL, usando fallback:', err.message);
    }
  }

  // Fallback JSON
  const playlists = readJson(PLAYLISTS_FILE);
  const playlist = playlists.find(p => Number(p.id) === pId);
  if (!playlist) {
    const err = new Error('Playlist não encontrada.');
    err.statusCode = 404;
    throw err;
  }
  if (Number(playlist.user_id) !== Number(userId)) {
    const err = new Error('Você não tem permissão para excluir esta playlist.');
    err.statusCode = 403;
    throw err;
  }

  const updatedPlaylists = playlists.filter(p => Number(p.id) !== pId);
  writeJson(PLAYLISTS_FILE, updatedPlaylists);

  const playlistTracks = readJson(PLAYLIST_TRACKS_FILE);
  const updatedPts = playlistTracks.filter(pt => Number(pt.playlist_id) !== pId);
  writeJson(PLAYLIST_TRACKS_FILE, updatedPts);

  return { success: true, message: 'Playlist excluída com sucesso.' };
}

async function addTrackToPlaylist(playlistId, userId, trackId) {
  const pId = Number(playlistId);
  const cleanTrackId = typeof trackId === 'string' ? trackId.replace('ct-', '') : trackId;
  const tId = Number(cleanTrackId);
  if (!tId || isNaN(tId)) {
    const err = new Error('ID da faixa inválido.');
    err.statusCode = 400;
    throw err;
  }

  const hasMySql = await checkMySql();
  if (hasMySql) {
    try {
      const [pRows] = await db.query('SELECT user_id FROM playlists WHERE id = ? LIMIT 1', [pId]);
      if (pRows.length === 0) {
        const err = new Error('Playlist não encontrada.');
        err.statusCode = 404;
        throw err;
      }
      if (Number(pRows[0].user_id) !== Number(userId)) {
        const err = new Error('Você não tem permissão para modificar esta playlist.');
        err.statusCode = 403;
        throw err;
      }

      const [tRows] = await db.query('SELECT id, title FROM company_tracks WHERE id = ? LIMIT 1', [tId]);
      if (tRows.length === 0) {
        const err = new Error('Música não encontrada no catálogo.');
        err.statusCode = 404;
        throw err;
      }

      // Validação: impede duplicatas de música na mesma playlist
      const [existingPt] = await db.query(
        'SELECT id FROM playlist_tracks WHERE playlist_id = ? AND track_id = ? LIMIT 1',
        [pId, tId]
      );
      if (existingPt.length > 0) {
        const err = new Error('Esta música já foi vinculada a esta playlist.');
        err.statusCode = 409;
        throw err;
      }

      const [maxPos] = await db.query(
        'SELECT COALESCE(MAX(position), 0) AS next_pos FROM playlist_tracks WHERE playlist_id = ?',
        [pId]
      );
      const nextPos = (maxPos[0].next_pos || 0) + 1;

      await db.query(
        'INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)',
        [pId, tId, nextPos]
      );

      await db.query('UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [pId]);

      return getPlaylistById(pId, userId);
    } catch (err) {
      if (err.statusCode) throw err;
      console.warn('Erro ao adicionar faixa na playlist no MySQL, usando fallback:', err.message);
    }
  }

  // Fallback JSON
  const playlists = readJson(PLAYLISTS_FILE);
  const playlist = playlists.find(p => Number(p.id) === pId);
  if (!playlist) {
    const err = new Error('Playlist não encontrada.');
    err.statusCode = 404;
    throw err;
  }
  if (Number(playlist.user_id) !== Number(userId)) {
    const err = new Error('Você não tem permissão para modificar esta playlist.');
    err.statusCode = 403;
    throw err;
  }

  const tracks = readJson(TRACKS_FILE);
  const track = tracks.find(t => Number(t.id) === tId);
  if (!track) {
    const err = new Error('Música não encontrada no catálogo.');
    err.statusCode = 404;
    throw err;
  }

  const playlistTracks = readJson(PLAYLIST_TRACKS_FILE);
  const currentPts = playlistTracks.filter(pt => Number(pt.playlist_id) === pId);

  // Validação: impede duplicatas de música na mesma playlist
  const alreadyIn = currentPts.some(pt => Number(pt.track_id) === tId);
  if (alreadyIn) {
    const err = new Error('Esta música já foi vinculada a esta playlist.');
    err.statusCode = 409;
    throw err;
  }

  const nextPos = currentPts.length > 0 ? Math.max(...currentPts.map(pt => pt.position || 0)) + 1 : 1;
  const newPtId = playlistTracks.length > 0 ? Math.max(...playlistTracks.map(pt => pt.id || 0)) + 1 : 1;

  playlistTracks.push({
    id: newPtId,
    playlist_id: pId,
    track_id: tId,
    position: nextPos,
    added_at: new Date().toISOString()
  });

  writeJson(PLAYLIST_TRACKS_FILE, playlistTracks);

  playlist.updated_at = new Date().toISOString();
  writeJson(PLAYLISTS_FILE, playlists);

  return getPlaylistById(pId, userId);
}

async function removeTrackFromPlaylist(playlistId, userId, trackId) {
  const pId = Number(playlistId);
  const cleanTrackId = typeof trackId === 'string' ? trackId.replace('ct-', '') : trackId;
  const tId = Number(cleanTrackId);
  if (!tId || isNaN(tId)) {
    const err = new Error('ID da faixa inválido.');
    err.statusCode = 400;
    throw err;
  }

  const hasMySql = await checkMySql();
  if (hasMySql) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [pRows] = await conn.query('SELECT user_id FROM playlists WHERE id = ? LIMIT 1', [pId]);
      if (pRows.length === 0) {
        const err = new Error('Playlist não encontrada.');
        err.statusCode = 404;
        throw err;
      }
      if (Number(pRows[0].user_id) !== Number(userId)) {
        const err = new Error('Você não tem permissão para alterar esta playlist.');
        err.statusCode = 403;
        throw err;
      }

      await conn.query(
        'DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?',
        [pId, tId]
      );

      // Re-index positions
      const [remaining] = await conn.query(
        'SELECT id FROM playlist_tracks WHERE playlist_id = ? ORDER BY position ASC, id ASC',
        [pId]
      );
      for (let i = 0; i < remaining.length; i++) {
        await conn.query('UPDATE playlist_tracks SET position = ? WHERE id = ?', [i + 1, remaining[i].id]);
      }

      await conn.query('UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [pId]);

      await conn.commit();
      conn.release();

      return getPlaylistById(pId, userId);
    } catch (err) {
      await conn.rollback();
      conn.release();
      if (err.statusCode) throw err;
      console.warn('Erro ao remover faixa no MySQL, usando fallback:', err.message);
    }
  }

  // Fallback JSON
  const playlists = readJson(PLAYLISTS_FILE);
  const playlist = playlists.find(p => Number(p.id) === pId);
  if (!playlist) {
    const err = new Error('Playlist não encontrada.');
    err.statusCode = 404;
    throw err;
  }
  if (Number(playlist.user_id) !== Number(userId)) {
    const err = new Error('Você não tem permissão para alterar esta playlist.');
    err.statusCode = 403;
    throw err;
  }

  let playlistTracks = readJson(PLAYLIST_TRACKS_FILE);
  playlistTracks = playlistTracks.filter(pt => !(Number(pt.playlist_id) === pId && Number(pt.track_id) === tId));

  // Reindex
  let currentPos = 1;
  playlistTracks.forEach(pt => {
    if (Number(pt.playlist_id) === pId) {
      pt.position = currentPos++;
    }
  });

  writeJson(PLAYLIST_TRACKS_FILE, playlistTracks);

  playlist.updated_at = new Date().toISOString();
  writeJson(PLAYLISTS_FILE, playlists);

  return getPlaylistById(pId, userId);
}

async function reorderPlaylistTracks(playlistId, userId, trackIds) {
  const pId = Number(playlistId);
  if (!Array.isArray(trackIds)) {
    throw new Error('A lista de IDs de faixas ordenadas deve ser um array.');
  }

  const hasMySql = await checkMySql();
  if (hasMySql) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [pRows] = await conn.query('SELECT user_id FROM playlists WHERE id = ? LIMIT 1', [pId]);
      if (pRows.length === 0) {
        const err = new Error('Playlist não encontrada.');
        err.statusCode = 404;
        throw err;
      }
      if (Number(pRows[0].user_id) !== Number(userId)) {
        const err = new Error('Você não tem permissão para reordenar esta playlist.');
        err.statusCode = 403;
        throw err;
      }

      for (let i = 0; i < trackIds.length; i++) {
        const cleanTid = typeof trackIds[i] === 'string' ? trackIds[i].replace('ct-', '') : trackIds[i];
        const tid = Number(cleanTid);
        await conn.query(
          'UPDATE playlist_tracks SET position = ? WHERE playlist_id = ? AND track_id = ?',
          [i + 1, pId, tid]
        );
      }

      await conn.query('UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [pId]);

      await conn.commit();
      conn.release();

      return getPlaylistById(pId, userId);
    } catch (err) {
      await conn.rollback();
      conn.release();
      if (err.statusCode) throw err;
      console.warn('Erro ao reordenar faixas no MySQL, usando fallback:', err.message);
    }
  }

  // Fallback JSON
  const playlists = readJson(PLAYLISTS_FILE);
  const playlist = playlists.find(p => Number(p.id) === pId);
  if (!playlist) {
    const err = new Error('Playlist não encontrada.');
    err.statusCode = 404;
    throw err;
  }
  if (Number(playlist.user_id) !== Number(userId)) {
    const err = new Error('Você não tem permissão para reordenar esta playlist.');
    err.statusCode = 403;
    throw err;
  }

  const playlistTracks = readJson(PLAYLIST_TRACKS_FILE);
  trackIds.forEach((tId, idx) => {
    const cleanTid = typeof tId === 'string' ? tId.replace('ct-', '') : tId;
    const pt = playlistTracks.find(item => Number(item.playlist_id) === pId && Number(item.track_id) === Number(cleanTid));
    if (pt) {
      pt.position = idx + 1;
    }
  });

  writeJson(PLAYLIST_TRACKS_FILE, playlistTracks);

  playlist.updated_at = new Date().toISOString();
  writeJson(PLAYLISTS_FILE, playlists);

  return getPlaylistById(pId, userId);
}

// =========================================================================
// ARTISTS OPERATIONS
// =========================================================================

async function getArtists() {
  const hasMySql = await checkMySql();
  if (hasMySql) {
    try {
      const [rows] = await db.query(`
        SELECT a.*,
               COUNT(DISTINCT ct.id) AS tracks_count,
               COUNT(DISTINCT alb.id) AS albums_count
        FROM artists a
        LEFT JOIN company_tracks ct ON (ct.artist_id = a.id OR LOWER(TRIM(ct.artist)) = LOWER(TRIM(a.name))) AND ct.status = 'active'
        LEFT JOIN albums alb ON (alb.artist_id = a.id OR LOWER(TRIM(alb.artist_name)) = LOWER(TRIM(a.name)))
        GROUP BY a.id
        ORDER BY a.name ASC
      `);
      return rows;
    } catch (err) {
      console.warn('Erro ao consultar artistas no MySQL, usando fallback:', err.message);
    }
  }

  // Fallback JSON
  const artists = readJson(ARTISTS_FILE);
  const tracks = readJson(TRACKS_FILE);
  const albums = readJson(ALBUMS_FILE);

  return artists.map(art => {
    const cleanArtName = (art.name || '').toLowerCase().trim();
    const artTracks = tracks.filter(t => (t.artist_id === art.id || (t.artist || '').toLowerCase().trim().includes(cleanArtName)) && t.status !== 'inactive');
    const artAlbums = albums.filter(alb => alb.artist_id === art.id || (alb.artist_name || '').toLowerCase().trim() === cleanArtName);

    return {
      ...art,
      tracks_count: artTracks.length,
      albums_count: artAlbums.length
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

async function getArtistById(artistId) {
  const aId = Number(artistId);
  const hasMySql = await checkMySql();

  if (hasMySql) {
    try {
      const [aRows] = await db.query('SELECT * FROM artists WHERE id = ? LIMIT 1', [aId]);
      if (aRows.length === 0) return null;
      const artist = aRows[0];

      const [tracks] = await db.query(
        `SELECT ct.*, c.name AS company_name
         FROM company_tracks ct
         LEFT JOIN companies c ON ct.company_id = c.id
         WHERE (ct.artist_id = ? OR LOWER(TRIM(ct.artist)) = LOWER(TRIM(?)))
           AND ct.status = 'active'
         ORDER BY ct.title ASC`,
        [aId, artist.name]
      );

      const [albums] = await db.query(
        `SELECT * FROM albums
         WHERE artist_id = ? OR LOWER(TRIM(artist_name)) = LOWER(TRIM(?))
         ORDER BY release_date DESC, title ASC`,
        [aId, artist.name]
      );

      return {
        ...artist,
        tracks_count: tracks.length,
        albums_count: albums.length,
        tracks,
        albums
      };
    } catch (err) {
      console.warn('Erro ao consultar artista no MySQL, usando fallback:', err.message);
    }
  }

  // Fallback JSON
  const artists = readJson(ARTISTS_FILE);
  const artist = artists.find(a => Number(a.id) === aId);
  if (!artist) return null;

  const tracks = readJson(TRACKS_FILE);
  const albums = readJson(ALBUMS_FILE);
  const cleanArtName = (artist.name || '').toLowerCase().trim();

  const artistTracks = tracks.filter(t => (t.artist_id === aId || (t.artist || '').toLowerCase().trim().includes(cleanArtName)) && t.status !== 'inactive');
  const artistAlbums = albums.filter(alb => alb.artist_id === aId || (alb.artist_name || '').toLowerCase().trim() === cleanArtName);

  return {
    ...artist,
    tracks_count: artistTracks.length,
    albums_count: artistAlbums.length,
    tracks: artistTracks,
    albums: artistAlbums
  };
}

async function createArtist({ name, bio = null, avatar_url = null, genre = 'Variado' }) {
  if (!name || !name.trim()) throw new Error('O nome do artista é obrigatório.');

  const hasMySql = await checkMySql();
  if (hasMySql) {
    try {
      const [res] = await db.query(
        'INSERT INTO artists (name, bio, avatar_url, genre) VALUES (?, ?, ?, ?)',
        [name.trim(), bio ? bio.trim() : null, avatar_url || null, genre ? genre.trim() : 'Variado']
      );
      return getArtistById(res.insertId);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        const duplicateErr = new Error('Já existe um artista cadastrado com este nome.');
        duplicateErr.statusCode = 400;
        throw duplicateErr;
      }
      console.warn('Erro ao inserir artista no MySQL, usando fallback:', err.message);
    }
  }

  // Fallback JSON
  const artists = readJson(ARTISTS_FILE);
  const cleanName = name.trim().toLowerCase();
  if (artists.some(a => (a.name || '').trim().toLowerCase() === cleanName)) {
    const err = new Error('Já existe um artista cadastrado com este nome.');
    err.statusCode = 400;
    throw err;
  }

  const newId = artists.length > 0 ? Math.max(...artists.map(a => Number(a.id) || 0)) + 1 : 1;
  const now = new Date().toISOString();

  const newArtist = {
    id: newId,
    name: name.trim(),
    bio: bio ? bio.trim() : null,
    avatar_url: avatar_url || null,
    genre: genre ? genre.trim() : 'Variado',
    created_at: now,
    updated_at: now
  };

  artists.push(newArtist);
  writeJson(ARTISTS_FILE, artists);

  return {
    ...newArtist,
    tracks_count: 0,
    albums_count: 0,
    tracks: [],
    albums: []
  };
}

async function updateArtist(artistId, { name, bio, avatar_url, genre }) {
  const aId = Number(artistId);
  const hasMySql = await checkMySql();

  if (hasMySql) {
    try {
      const [rows] = await db.query('SELECT * FROM artists WHERE id = ? LIMIT 1', [aId]);
      if (rows.length === 0) {
        const err = new Error('Artista não encontrado.');
        err.statusCode = 404;
        throw err;
      }

      const updates = [];
      const params = [];
      if (name !== undefined) {
        if (!name.trim()) throw new Error('O nome do artista não pode ser vazio.');
        updates.push('name = ?');
        params.push(name.trim());
      }
      if (bio !== undefined) {
        updates.push('bio = ?');
        params.push(bio ? bio.trim() : null);
      }
      if (avatar_url !== undefined) {
        updates.push('avatar_url = ?');
        params.push(avatar_url || null);
      }
      if (genre !== undefined) {
        updates.push('genre = ?');
        params.push(genre ? genre.trim() : 'Variado');
      }

      if (updates.length > 0) {
        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(aId);
        await db.query(`UPDATE artists SET ${updates.join(', ')} WHERE id = ?`, params);
      }

      return getArtistById(aId);
    } catch (err) {
      if (err.statusCode) throw err;
      console.warn('Erro ao atualizar artista no MySQL, usando fallback:', err.message);
    }
  }

  // Fallback JSON
  const artists = readJson(ARTISTS_FILE);
  const idx = artists.findIndex(a => Number(a.id) === aId);
  if (idx === -1) {
    const err = new Error('Artista não encontrado.');
    err.statusCode = 404;
    throw err;
  }

  if (name !== undefined) {
    if (!name.trim()) throw new Error('O nome do artista não pode ser vazio.');
    artists[idx].name = name.trim();
  }
  if (bio !== undefined) {
    artists[idx].bio = bio ? bio.trim() : null;
  }
  if (avatar_url !== undefined) {
    artists[idx].avatar_url = avatar_url || null;
  }
  if (genre !== undefined) {
    artists[idx].genre = genre ? genre.trim() : 'Variado';
  }

  artists[idx].updated_at = new Date().toISOString();
  writeJson(ARTISTS_FILE, artists);

  return getArtistById(aId);
}

async function deleteArtist(artistId) {
  const aId = Number(artistId);
  const hasMySql = await checkMySql();

  if (hasMySql) {
    try {
      const [aRows] = await db.query('SELECT * FROM artists WHERE id = ? LIMIT 1', [aId]);
      if (aRows.length === 0) {
        const err = new Error('Artista não encontrado.');
        err.statusCode = 404;
        throw err;
      }
      const artist = aRows[0];

      // Integrity Check: tracks
      const [tRows] = await db.query(
        `SELECT COUNT(*) AS count FROM company_tracks 
         WHERE (artist_id = ? OR LOWER(TRIM(artist)) = LOWER(TRIM(?))) AND status = 'active'`,
        [aId, artist.name]
      );
      if (tRows[0].count > 0) {
        const err = new Error(`Não é possível excluir o artista pois existem ${tRows[0].count} faixa(s) vinculada(s). Remova ou altere as faixas primeiro.`);
        err.statusCode = 400;
        throw err;
      }

      // Integrity Check: albums
      const [albRows] = await db.query(
        `SELECT COUNT(*) AS count FROM albums 
         WHERE artist_id = ? OR LOWER(TRIM(artist_name)) = LOWER(TRIM(?))`,
        [aId, artist.name]
      );
      if (albRows[0].count > 0) {
        const err = new Error(`Não é possível excluir o artista pois existem ${albRows[0].count} álbum(ns) vinculado(s). Remova ou desvincule os álbuns primeiro.`);
        err.statusCode = 400;
        throw err;
      }

      await db.query('DELETE FROM artists WHERE id = ?', [aId]);
      return { success: true, message: 'Artista excluído com sucesso.' };
    } catch (err) {
      if (err.statusCode) throw err;
      console.warn('Erro ao deletar artista no MySQL, usando fallback:', err.message);
    }
  }

  // Fallback JSON
  const artists = readJson(ARTISTS_FILE);
  const artist = artists.find(a => Number(a.id) === aId);
  if (!artist) {
    const err = new Error('Artista não encontrado.');
    err.statusCode = 404;
    throw err;
  }

  const tracks = readJson(TRACKS_FILE);
  const cleanName = (artist.name || '').toLowerCase().trim();
  const linkedTracks = tracks.filter(t => (t.artist_id === aId || (t.artist || '').toLowerCase().trim() === cleanName) && t.status !== 'inactive');
  if (linkedTracks.length > 0) {
    const err = new Error(`Não é possível excluir o artista pois existem ${linkedTracks.length} faixa(s) vinculada(s).`);
    err.statusCode = 400;
    throw err;
  }

  const albums = readJson(ALBUMS_FILE);
  const linkedAlbums = albums.filter(alb => alb.artist_id === aId || (alb.artist_name || '').toLowerCase().trim() === cleanName);
  if (linkedAlbums.length > 0) {
    const err = new Error(`Não é possível excluir o artista pois existem ${linkedAlbums.length} álbum(ns) vinculado(s).`);
    err.statusCode = 400;
    throw err;
  }

  const updatedArtists = artists.filter(a => Number(a.id) !== aId);
  writeJson(ARTISTS_FILE, updatedArtists);

  return { success: true, message: 'Artista excluído com sucesso.' };
}

// =========================================================================
// ALBUMS OPERATIONS
// =========================================================================

async function getAlbums() {
  const hasMySql = await checkMySql();
  if (hasMySql) {
    try {
      const [rows] = await db.query(`
        SELECT alb.*,
               COUNT(ct.id) AS tracks_count,
               COALESCE(SUM(ct.duration_sec), 0) AS total_duration_sec
        FROM albums alb
        LEFT JOIN company_tracks ct ON (ct.album_id = alb.id OR LOWER(TRIM(ct.album)) = LOWER(TRIM(alb.title))) AND ct.status = 'active'
        GROUP BY alb.id
        ORDER BY alb.release_date DESC, alb.title ASC
      `);
      return rows;
    } catch (err) {
      console.warn('Erro ao consultar álbuns no MySQL, usando fallback:', err.message);
    }
  }

  // Fallback JSON
  const albums = readJson(ALBUMS_FILE);
  const tracks = readJson(TRACKS_FILE);

  return albums.map(alb => {
    const cleanTitle = (alb.title || '').toLowerCase().trim();
    const albTracks = tracks.filter(t => (t.album_id === alb.id || (t.album || '').toLowerCase().trim() === cleanTitle) && t.status !== 'inactive');
    const totalDuration = albTracks.reduce((acc, t) => acc + (t.duration_sec || 0), 0);

    return {
      ...alb,
      tracks_count: albTracks.length,
      total_duration_sec: totalDuration
    };
  }).sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''));
}

async function getAlbumById(albumId) {
  const albId = Number(albumId);
  const hasMySql = await checkMySql();

  if (hasMySql) {
    try {
      const [albRows] = await db.query(
        `SELECT alb.*, a.avatar_url AS artist_avatar
         FROM albums alb
         LEFT JOIN artists a ON alb.artist_id = a.id
         WHERE alb.id = ? LIMIT 1`,
        [albId]
      );
      if (albRows.length === 0) return null;
      const album = albRows[0];

      const [tracks] = await db.query(
        `SELECT ct.*, c.name AS company_name
         FROM company_tracks ct
         LEFT JOIN companies c ON ct.company_id = c.id
         WHERE (ct.album_id = ? OR LOWER(TRIM(ct.album)) = LOWER(TRIM(?)))
           AND ct.status = 'active'
         ORDER BY ct.id ASC`,
        [albId, album.title]
      );

      const totalDuration = tracks.reduce((acc, t) => acc + (t.duration_sec || 0), 0);

      return {
        ...album,
        tracks_count: tracks.length,
        total_duration_sec: totalDuration,
        tracks
      };
    } catch (err) {
      console.warn('Erro ao consultar álbum no MySQL, usando fallback:', err.message);
    }
  }

  // Fallback JSON
  const albums = readJson(ALBUMS_FILE);
  const album = albums.find(a => Number(a.id) === albId);
  if (!album) return null;

  const tracks = readJson(TRACKS_FILE);
  const cleanTitle = (album.title || '').toLowerCase().trim();
  const albTracks = tracks.filter(t => (t.album_id === albId || (t.album || '').toLowerCase().trim() === cleanTitle) && t.status !== 'inactive');
  const totalDuration = albTracks.reduce((acc, t) => acc + (t.duration_sec || 0), 0);

  return {
    ...album,
    tracks_count: albTracks.length,
    total_duration_sec: totalDuration,
    tracks: albTracks
  };
}

async function createAlbum({ title, artist_name, artist_id = null, cover_url = null, release_date = null, genre = 'Variado' }) {
  if (!title || !title.trim()) throw new Error('O título do álbum é obrigatório.');
  if (!artist_name || !artist_name.trim()) throw new Error('O nome do artista do álbum é obrigatório.');

  const hasMySql = await checkMySql();
  if (hasMySql) {
    try {
      const [res] = await db.query(
        `INSERT INTO albums (title, artist_name, artist_id, cover_url, release_date, genre)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [title.trim(), artist_name.trim(), artist_id || null, cover_url || null, release_date || null, genre ? genre.trim() : 'Variado']
      );
      return getAlbumById(res.insertId);
    } catch (err) {
      console.warn('Erro ao inserir álbum no MySQL, usando fallback:', err.message);
    }
  }

  // Fallback JSON
  const albums = readJson(ALBUMS_FILE);
  const newId = albums.length > 0 ? Math.max(...albums.map(a => Number(a.id) || 0)) + 1 : 1;
  const now = new Date().toISOString();

  const newAlbum = {
    id: newId,
    title: title.trim(),
    artist_name: artist_name.trim(),
    artist_id: artist_id ? Number(artist_id) : null,
    cover_url: cover_url || null,
    release_date: release_date || null,
    genre: genre ? genre.trim() : 'Variado',
    created_at: now,
    updated_at: now
  };

  albums.push(newAlbum);
  writeJson(ALBUMS_FILE, albums);

  return {
    ...newAlbum,
    tracks_count: 0,
    total_duration_sec: 0,
    tracks: []
  };
}

async function updateAlbum(albumId, { title, artist_name, artist_id, cover_url, release_date, genre }) {
  const albId = Number(albumId);
  const hasMySql = await checkMySql();

  if (hasMySql) {
    try {
      const [rows] = await db.query('SELECT * FROM albums WHERE id = ? LIMIT 1', [albId]);
      if (rows.length === 0) {
        const err = new Error('Álbum não encontrado.');
        err.statusCode = 404;
        throw err;
      }

      const updates = [];
      const params = [];
      if (title !== undefined) {
        if (!title.trim()) throw new Error('O título não pode ser vazio.');
        updates.push('title = ?');
        params.push(title.trim());
      }
      if (artist_name !== undefined) {
        if (!artist_name.trim()) throw new Error('O nome do artista não pode ser vazio.');
        updates.push('artist_name = ?');
        params.push(artist_name.trim());
      }
      if (artist_id !== undefined) {
        updates.push('artist_id = ?');
        params.push(artist_id ? Number(artist_id) : null);
      }
      if (cover_url !== undefined) {
        updates.push('cover_url = ?');
        params.push(cover_url && cover_url.trim() ? cover_url.trim() : null);
      }
      if (release_date !== undefined) {
        updates.push('release_date = ?');
        params.push(release_date || null);
      }
      if (genre !== undefined) {
        updates.push('genre = ?');
        params.push(genre ? genre.trim() : 'Variado');
      }

      if (updates.length > 0) {
        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(albId);
        await db.query(`UPDATE albums SET ${updates.join(', ')} WHERE id = ?`, params);
      }

      return getAlbumById(albId);
    } catch (err) {
      if (err.statusCode) throw err;
      console.warn('Erro ao atualizar álbum no MySQL, usando fallback:', err.message);
    }
  }

  // Fallback JSON
  const albums = readJson(ALBUMS_FILE);
  const idx = albums.findIndex(a => Number(a.id) === albId);
  if (idx === -1) {
    const err = new Error('Álbum não encontrado.');
    err.statusCode = 404;
    throw err;
  }

  if (title !== undefined) {
    if (!title.trim()) throw new Error('O título não pode ser vazio.');
    albums[idx].title = title.trim();
  }
  if (artist_name !== undefined) {
    if (!artist_name.trim()) throw new Error('O nome do artista não pode ser vazio.');
    albums[idx].artist_name = artist_name.trim();
  }
  if (artist_id !== undefined) {
    albums[idx].artist_id = artist_id ? Number(artist_id) : null;
  }
  if (cover_url !== undefined) {
    albums[idx].cover_url = cover_url || null;
  }
  if (release_date !== undefined) {
    albums[idx].release_date = release_date || null;
  }
  if (genre !== undefined) {
    albums[idx].genre = genre ? genre.trim() : 'Variado';
  }

  albums[idx].updated_at = new Date().toISOString();
  writeJson(ALBUMS_FILE, albums);

  return getAlbumById(albId);
}

async function deleteAlbum(albumId) {
  const albId = Number(albumId);
  const hasMySql = await checkMySql();

  if (hasMySql) {
    try {
      const [rows] = await db.query('SELECT * FROM albums WHERE id = ? LIMIT 1', [albId]);
      if (rows.length === 0) {
        const err = new Error('Álbum não encontrado.');
        err.statusCode = 404;
        throw err;
      }
      const album = rows[0];

      // Dependency check: tracks
      const [tRows] = await db.query(
        `SELECT COUNT(*) AS count FROM company_tracks 
         WHERE (album_id = ? OR LOWER(TRIM(album)) = LOWER(TRIM(?))) AND status = 'active'`,
        [albId, album.title]
      );
      if (tRows[0].count > 0) {
        const err = new Error(`Não é possível excluir o álbum pois existem ${tRows[0].count} faixa(s) vinculada(s). Remova ou desvincule as faixas antes.`);
        err.statusCode = 400;
        throw err;
      }

      await db.query('DELETE FROM albums WHERE id = ?', [albId]);
      return { success: true, message: 'Álbum excluído com sucesso.' };
    } catch (err) {
      if (err.statusCode) throw err;
      console.warn('Erro ao deletar álbum no MySQL, usando fallback:', err.message);
    }
  }

  // Fallback JSON
  const albums = readJson(ALBUMS_FILE);
  const album = albums.find(a => Number(a.id) === albId);
  if (!album) {
    const err = new Error('Álbum não encontrado.');
    err.statusCode = 404;
    throw err;
  }

  const tracks = readJson(TRACKS_FILE);
  const cleanTitle = (album.title || '').toLowerCase().trim();
  const linkedTracks = tracks.filter(t => (t.album_id === albId || (t.album || '').toLowerCase().trim() === cleanTitle) && t.status !== 'inactive');
  if (linkedTracks.length > 0) {
    const err = new Error(`Não é possível excluir o álbum pois existem ${linkedTracks.length} faixa(s) vinculada(s).`);
    err.statusCode = 400;
    throw err;
  }

  const updatedAlbums = albums.filter(a => Number(a.id) !== albId);
  writeJson(ALBUMS_FILE, updatedAlbums);

  return { success: true, message: 'Álbum excluído com sucesso.' };
}

// =========================================================================
// TRACKS (COMPANY_TRACKS) OPERATIONS
// =========================================================================

async function getLibraryTracks() {
  const hasMySql = await checkMySql();
  if (hasMySql) {
    try {
      const [rows] = await db.query(`
        SELECT ct.*, c.name AS company_name, c.slug AS company_slug
        FROM company_tracks ct
        LEFT JOIN companies c ON ct.company_id = c.id
        WHERE ct.status = 'active'
        ORDER BY ct.id ASC
      `);
      return rows;
    } catch (err) {
      console.warn('Erro ao consultar faixas no MySQL, usando fallback:', err.message);
    }
  }

  // Fallback JSON
  const tracks = readJson(TRACKS_FILE);
  const companies = readJson(COMPANIES_FILE);

  return tracks
    .filter(t => t.status !== 'inactive')
    .map(t => {
      const comp = companies.find(c => c.id === t.company_id);
      return {
        ...t,
        company_name: comp?.name || 'DevSongs Records',
        company_slug: comp?.slug || 'devsongs-urban'
      };
    });
}

async function getTrackById(trackId) {
  const tId = Number(trackId);
  const hasMySql = await checkMySql();

  if (hasMySql) {
    try {
      const [rows] = await db.query(
        `SELECT ct.*, c.name AS company_name, c.slug AS company_slug
         FROM company_tracks ct
         LEFT JOIN companies c ON ct.company_id = c.id
         WHERE ct.id = ? LIMIT 1`,
        [tId]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (err) {
      console.warn('Erro ao consultar faixa por ID no MySQL, usando fallback:', err.message);
    }
  }

  // Fallback JSON
  const tracks = readJson(TRACKS_FILE);
  const comp = readJson(COMPANIES_FILE);
  const t = tracks.find(item => Number(item.id) === tId);
  if (!t) return null;
  const company = comp.find(c => c.id === t.company_id);
  return {
    ...t,
    company_name: company?.name || 'DevSongs Records',
    company_slug: company?.slug || 'devsongs-urban'
  };
}

async function createTrack({
  title,
  artist,
  album = 'Single',
  genre = 'Variado',
  cover_url = null,
  preview_url = null,
  duration_sec = 210,
  company_id = 1,
  sale_price = 4.90,
  rent_price = 1.90,
  available_for_stream = true,
  stock_quantity = 50,
  artist_id = null,
  album_id = null
}) {
  if (!title || !title.trim()) throw new Error('O título da música é obrigatório.');
  if (!artist || !artist.trim()) throw new Error('O artista da música é obrigatório.');

  const dur = Number(duration_sec) || 210;
  const compId = Number(company_id) || 1;
  const sPrice = Number(sale_price) || 4.90;
  const rPrice = Number(rent_price) || 1.90;
  const stock = Number(stock_quantity) || 50;

  const hasMySql = await checkMySql();
  if (hasMySql) {
    try {
      const [res] = await db.query(
        `INSERT INTO company_tracks 
         (company_id, title, artist, album, genre, cover_url, preview_url, duration_sec, stock_quantity, sale_price, rent_price, available_for_stream, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
        [compId, title.trim(), artist.trim(), album ? album.trim() : 'Single', genre ? genre.trim() : 'Variado', cover_url || null, preview_url || null, dur, stock, sPrice, rPrice, available_for_stream ? 1 : 0]
      );
      return getTrackById(res.insertId);
    } catch (err) {
      console.warn('Erro ao inserir faixa no MySQL, usando fallback:', err.message);
    }
  }

  // Fallback JSON
  const tracks = readJson(TRACKS_FILE);
  const newId = tracks.length > 0 ? Math.max(...tracks.map(t => Number(t.id) || 0)) + 1 : 1;
  const now = new Date().toISOString();

  const newTrack = {
    id: newId,
    company_id: compId,
    title: title.trim(),
    artist: artist.trim(),
    album: album ? album.trim() : 'Single',
    genre: genre ? genre.trim() : 'Variado',
    cover_url: cover_url || null,
    preview_url: preview_url || null,
    youtube_video_id: null,
    duration_sec: dur,
    stock_quantity: stock,
    sale_price: sPrice,
    rent_price: rPrice,
    available_for_stream: Boolean(available_for_stream),
    is_exclusive: false,
    status: 'active',
    artist_id: artist_id ? Number(artist_id) : null,
    album_id: album_id ? Number(album_id) : null,
    created_at: now
  };

  tracks.push(newTrack);
  writeJson(TRACKS_FILE, tracks);

  return newTrack;
}

async function updateTrack(trackId, { title, artist, album, genre, cover_url, preview_url, duration_sec, artist_id, album_id }) {
  const tId = Number(trackId);
  const hasMySql = await checkMySql();

  if (hasMySql) {
    try {
      const [rows] = await db.query('SELECT * FROM company_tracks WHERE id = ? LIMIT 1', [tId]);
      if (rows.length === 0) {
        const err = new Error('Música não encontrada.');
        err.statusCode = 404;
        throw err;
      }

      const updates = [];
      const params = [];

      if (title !== undefined) {
        if (!title.trim()) throw new Error('O título não pode ser vazio.');
        updates.push('title = ?');
        params.push(title.trim());
      }
      if (artist !== undefined) {
        if (!artist.trim()) throw new Error('O artista não pode ser vazio.');
        updates.push('artist = ?');
        params.push(artist.trim());
      }
      if (album !== undefined) {
        updates.push('album = ?');
        params.push(album ? album.trim() : 'Single');
      }
      if (genre !== undefined) {
        updates.push('genre = ?');
        params.push(genre ? genre.trim() : 'Variado');
      }
      if (cover_url !== undefined) {
        updates.push('cover_url = ?');
        params.push(cover_url && cover_url.trim() ? cover_url.trim() : null);
      }
      if (preview_url !== undefined) {
        updates.push('preview_url = ?');
        params.push(preview_url || null);
      }
      if (duration_sec !== undefined) {
        updates.push('duration_sec = ?');
        params.push(Number(duration_sec) || 210);
      }

      if (updates.length > 0) {
        params.push(tId);
        await db.query(`UPDATE company_tracks SET ${updates.join(', ')} WHERE id = ?`, params);
      }

      return getTrackById(tId);
    } catch (err) {
      if (err.statusCode) throw err;
      console.warn('Erro ao atualizar faixa no MySQL, usando fallback:', err.message);
    }
  }

  // Fallback JSON
  const tracks = readJson(TRACKS_FILE);
  const idx = tracks.findIndex(t => Number(t.id) === tId);
  if (idx === -1) {
    const err = new Error('Música não encontrada.');
    err.statusCode = 404;
    throw err;
  }

  if (title !== undefined) {
    if (!title.trim()) throw new Error('O título não pode ser vazio.');
    tracks[idx].title = title.trim();
  }
  if (artist !== undefined) {
    if (!artist.trim()) throw new Error('O artista não pode ser vazio.');
    tracks[idx].artist = artist.trim();
  }
  if (album !== undefined) {
    tracks[idx].album = album ? album.trim() : 'Single';
  }
  if (genre !== undefined) {
    tracks[idx].genre = genre ? genre.trim() : 'Variado';
  }
  if (cover_url !== undefined) {
    tracks[idx].cover_url = cover_url || null;
  }
  if (preview_url !== undefined) {
    tracks[idx].preview_url = preview_url || null;
  }
  if (duration_sec !== undefined) {
    tracks[idx].duration_sec = Number(duration_sec) || 210;
  }

  writeJson(TRACKS_FILE, tracks);
  return getTrackById(tId);
}

async function deleteTrack(trackId) {
  const tId = Number(trackId);
  const hasMySql = await checkMySql();

  if (hasMySql) {
    try {
      const [rows] = await db.query('SELECT * FROM company_tracks WHERE id = ? LIMIT 1', [tId]);
      if (rows.length === 0) {
        const err = new Error('Música não encontrada.');
        err.statusCode = 404;
        throw err;
      }

      // Check commercial dependencies (company_purchases)
      const [purchases] = await db.query(
        'SELECT COUNT(*) AS count FROM company_purchases WHERE track_id = ?',
        [tId]
      );

      // Check playlist dependencies
      const [pts] = await db.query(
        'SELECT COUNT(*) AS count FROM playlist_tracks WHERE track_id = ?',
        [tId]
      );

      // If commercial purchases exist, preserve commercial integrity via archiving (status = 'inactive')
      if (purchases[0].count > 0 || pts[0].count > 0) {
        await db.query("UPDATE company_tracks SET status = 'inactive' WHERE id = ?", [tId]);
        return {
          success: true,
          action: 'archived',
          message: 'Faixa desativada/arquivada com sucesso para preservar o histórico comercial e dependências.'
        };
      }

      // Safe physical deletion when no dependencies exist
      await db.query('DELETE FROM company_tracks WHERE id = ?', [tId]);
      return { success: true, action: 'deleted', message: 'Faixa excluída definitivamente com sucesso.' };
    } catch (err) {
      if (err.statusCode) throw err;
      console.warn('Erro ao deletar faixa no MySQL, usando fallback:', err.message);
    }
  }

  // Fallback JSON
  const tracks = readJson(TRACKS_FILE);
  const track = tracks.find(t => Number(t.id) === tId);
  if (!track) {
    const err = new Error('Música não encontrada.');
    err.statusCode = 404;
    throw err;
  }

  const purchases = readJson(PURCHASES_FILE);
  const playlistTracks = readJson(PLAYLIST_TRACKS_FILE);

  const hasPurchases = purchases.some(p => Number(p.track_id) === tId);
  const hasPlaylists = playlistTracks.some(pt => Number(pt.track_id) === tId);

  if (hasPurchases || hasPlaylists) {
    track.status = 'inactive';
    writeJson(TRACKS_FILE, tracks);
    return {
      success: true,
      action: 'archived',
      message: 'Faixa desativada/arquivada com sucesso para preservar o histórico comercial e dependências.'
    };
  }

  const updatedTracks = tracks.filter(t => Number(t.id) !== tId);
  writeJson(TRACKS_FILE, updatedTracks);
  return { success: true, action: 'deleted', message: 'Faixa excluída definitivamente com sucesso.' };
}

// =========================================================================
// 5. USER ACQUIRED TRACKS (PURCHASES & RENTALS)
// =========================================================================

async function getUserPurchasedTracks(userId) {
  const uId = Number(userId);
  const now = new Date();
  const hasMySql = await checkMySql();

  if (hasMySql) {
    try {
      const [rows] = await db.query(`
        SELECT 
          cp.id AS purchase_id,
          cp.type,
          cp.price,
          cp.expires_at,
          cp.created_at,
          ct.id AS db_track_id,
          ct.title,
          ct.artist,
          ct.album,
          ct.genre,
          ct.cover_url,
          ct.preview_url,
          ct.duration_sec,
          ct.youtube_video_id,
          ct.sale_price,
          ct.rent_price,
          c.id AS company_id,
          c.name AS company_name
        FROM company_purchases cp
        JOIN company_tracks ct ON cp.track_id = ct.id
        LEFT JOIN companies c ON cp.company_id = c.id
        WHERE cp.user_id = ?
        ORDER BY cp.created_at DESC
      `, [uId]);

      // Agrupa para que compra permanente prevaleça sobre aluguéis expirados
      const byTrack = new Map();
      for (const r of rows) {
        const tid = Number(r.db_track_id);
        if (!byTrack.has(tid)) {
          byTrack.set(tid, r);
        } else {
          const existing = byTrack.get(tid);
          if (existing.type !== 'buy' && r.type === 'buy') {
            byTrack.set(tid, r);
          }
        }
      }
      const distinctRows = Array.from(byTrack.values());

      return distinctRows.map(r => {
        const min = Math.floor((r.duration_sec || 210) / 60);
        const sec = (r.duration_sec || 210) % 60;
        const isRent = r.type === 'rent';
        const isExpired = isRent ? (new Date(r.expires_at) < now) : false;
        const remainingDays = isRent && !isExpired
          ? Math.max(0, Math.ceil((new Date(r.expires_at) - now) / (1000 * 60 * 60 * 24)))
          : null;

        return {
          purchaseId: r.purchase_id,
          type: r.type,
          price: r.price,
          sale_price: r.sale_price || 4.90,
          rent_price: r.rent_price || 1.90,
          salePrice: r.sale_price || 4.90,
          rentPrice: r.rent_price || 1.90,
          purchasedAt: r.created_at,
          rentedAt: r.rented_at || r.created_at,
          expiresAt: r.expires_at,
          isExpired,
          remainingDays,
          canPlay: !isExpired,
          id: `ct-${r.db_track_id}`,
          dbTrackId: r.db_track_id,
          title: r.title,
          artist: r.artist,
          album: r.album || 'Single',
          genre: r.genre || 'Variado',
          cover_url: r.cover_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png',
          cover: r.cover_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png',
          preview_url: r.preview_url,
          preview: r.preview_url,
          youtubeVideoId: r.youtube_video_id || null,
          duration_sec: r.duration_sec || 210,
          durationSec: r.duration_sec || 210,
          duration: `${min}:${String(sec).padStart(2, '0')}`,
          plays: isRent
            ? (isExpired ? 'Aluguel Expirado' : `Aluguel válido: ${remainingDays} dias`)
            : 'Comprado (Permanente)',
          licenseLabel: isRent
            ? (isExpired ? 'Aluguel Expirado' : `Aluguel (${remainingDays} dias restantes)`)
            : 'Comprada (Permanente)',
          companyId: r.company_id,
          companyName: r.company_name || 'DevSongs Gravadora'
        };
      });
    } catch (err) {
      console.warn('Erro ao consultar compras no MySQL, usando fallback JSON:', err.message);
    }
  }

  // Fallback JSON
  const purchases = readJson(PURCHASES_FILE);
  const tracks = readJson(TRACKS_FILE);
  const companies = readJson(COMPANIES_FILE);

  const userPurchases = purchases
    .filter(p => Number(p.user_id) === uId)
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  // Agrupa para que compra permanente prevaleça sobre aluguéis expirados
  const byTrack = new Map();
  for (const p of userPurchases) {
    const tid = Number(p.track_id);
    if (!byTrack.has(tid)) {
      byTrack.set(tid, p);
    } else {
      const existing = byTrack.get(tid);
      if (existing.type !== 'buy' && p.type === 'buy') {
        byTrack.set(tid, p);
      }
    }
  }
  const distinctPurchases = Array.from(byTrack.values());

  return distinctPurchases.map(p => {
    const track = tracks.find(t => Number(t.id) === Number(p.track_id)) || {
      id: p.track_id,
      title: 'Música Adquirida',
      artist: 'Artista',
      album: 'Single',
      genre: 'Variado',
      cover_url: 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png',
      sale_price: 4.90,
      rent_price: 1.90,
      duration_sec: 210
    };
    const company = companies.find(c => Number(c.id) === Number(p.company_id || track.company_id));

    const min = Math.floor((track.duration_sec || 210) / 60);
    const sec = (track.duration_sec || 210) % 60;
    const isRent = p.type === 'rent';
    const isExpired = isRent ? (new Date(p.expires_at) < now) : false;
    const remainingDays = isRent && !isExpired
      ? Math.max(0, Math.ceil((new Date(p.expires_at) - now) / (1000 * 60 * 60 * 24)))
      : null;

    return {
      purchaseId: p.id,
      type: p.type,
      price: p.price,
      sale_price: track.sale_price || 4.90,
      rent_price: track.rent_price || 1.90,
      salePrice: track.sale_price || 4.90,
      rentPrice: track.rent_price || 1.90,
      purchasedAt: p.created_at,
      rentedAt: p.rented_at || p.created_at,
      expiresAt: p.expires_at,
      isExpired,
      remainingDays,
      canPlay: !isExpired,
      id: `ct-${track.id}`,
      dbTrackId: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album || 'Single',
      genre: track.genre || 'Variado',
      cover_url: track.cover_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png',
      cover: track.cover_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png',
      preview_url: track.preview_url,
      preview: track.preview_url,
      youtubeVideoId: track.youtube_video_id || null,
      duration_sec: track.duration_sec || 210,
      durationSec: track.duration_sec || 210,
      duration: `${min}:${String(sec).padStart(2, '0')}`,
      plays: isRent
        ? (isExpired ? 'Aluguel Expirado' : `Aluguel válido: ${remainingDays} dias`)
        : 'Comprado (Permanente)',
      licenseLabel: isRent
        ? (isExpired ? 'Aluguel Expirado' : `Aluguel (${remainingDays} dias restantes)`)
        : 'Comprada (Permanente)',
      companyId: track.company_id,
      companyName: company?.name || 'DevSongs Gravadora'
    };
  });
}

async function recordPurchase(userId, { trackId, companyId = 1, type = 'buy' }) {
  const uId = Number(userId);
  const tId = Number(String(trackId).replace('ct-', ''));
  const now = new Date();

  const hasMySql = await checkMySql();
  if (hasMySql) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [tRows] = await conn.query('SELECT * FROM company_tracks WHERE id = ? FOR UPDATE', [tId]);
      if (tRows.length === 0) {
        await conn.rollback();
        const err = new Error('Música não encontrada.');
        err.statusCode = 404;
        throw err;
      }
      const track = tRows[0];
      const compId = companyId || track.company_id || 1;

      // Check existing buy
      const [existingBuy] = await conn.query('SELECT id FROM company_purchases WHERE user_id = ? AND track_id = ? AND type = "buy" LIMIT 1', [uId, tId]);
      if (existingBuy.length > 0) {
        await conn.rollback();
        const err = new Error('Você já possui esta faixa comprada na sua biblioteca!');
        err.statusCode = 400;
        throw err;
      }

      if (type === 'rent') {
        const [existingRent] = await conn.query(
          'SELECT id FROM company_purchases WHERE user_id = ? AND track_id = ? AND type = "rent" AND expires_at > NOW() LIMIT 1',
          [uId, tId]
        );
        if (existingRent.length > 0) {
          await conn.rollback();
          const err = new Error('Você já possui um aluguel ativo para esta faixa.');
          err.statusCode = 400;
          throw err;
        }
      }

      let expiresAt = null;
      if (type === 'rent') {
        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
      const price = type === 'rent' ? track.rent_price : track.sale_price;

      await conn.query('UPDATE company_tracks SET stock_quantity = GREATEST(0, stock_quantity - 1) WHERE id = ?', [tId]);
      const [res] = await conn.query(`
        INSERT INTO company_purchases (company_id, user_id, track_id, type, price, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [compId, uId, tId, type, price, expiresAt]);
      await conn.commit();
      return { success: true, purchaseId: res.insertId, type, trackTitle: track.title, remainingStock: track.stock_quantity - 1, price };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  // Fallback JSON
  const purchases = readJson(PURCHASES_FILE);
  const tracks = readJson(TRACKS_FILE);
  const track = tracks.find(t => Number(t.id) === tId);
  if (!track) {
    const err = new Error('Música não encontrada.');
    err.statusCode = 404;
    throw err;
  }

  const existingBuy = purchases.find(p => Number(p.user_id) === uId && Number(p.track_id) === tId && p.type === 'buy');
  if (existingBuy) {
    const err = new Error('Você já possui esta faixa comprada na sua biblioteca!');
    err.statusCode = 400;
    throw err;
  }

  if (type === 'rent') {
    const existingRent = purchases.find(p => Number(p.user_id) === uId && Number(p.track_id) === tId && p.type === 'rent' && new Date(p.expires_at) > now);
    if (existingRent) {
      const err = new Error('Você já possui um aluguel ativo para esta faixa.');
      err.statusCode = 400;
      throw err;
    }
  }

  const newId = purchases.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1;
  const expiresAt = type === 'rent' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;
  const price = type === 'rent' ? track.rent_price : track.sale_price;

  purchases.push({
    id: newId,
    company_id: companyId || track.company_id || 1,
    user_id: uId,
    track_id: tId,
    type,
    price,
    expires_at: expiresAt,
    created_at: now.toISOString()
  });
  writeJson(PURCHASES_FILE, purchases);

  // Decrement stock
  track.stock_quantity = Math.max(0, (track.stock_quantity || 1) - 1);
  writeJson(TRACKS_FILE, tracks);

  return { success: true, purchaseId: newId, type, trackTitle: track.title, remainingStock: track.stock_quantity, price };
}

// =========================================================================
// PLAYBACK ACCESS & EXPIRATION VERIFICATION (REQUIREMENT 5 & 1)
// =========================================================================

async function checkPlaybackAccess(userId, trackId) {
  const uId = Number(userId);
  const cleanId = typeof trackId === 'string' ? trackId.replace('ct-', '') : trackId;
  const tId = Number(cleanId);

  const track = await getTrackById(tId);
  if (!track) {
    const err = new Error('Música não encontrada no catálogo.');
    err.statusCode = 404;
    throw err;
  }

  // Se a faixa for explicitamente gratuita ou streaming aberto com valor zerado
  if (track.available_for_stream && (!track.sale_price || track.sale_price === 0)) {
    return {
      allowed: true,
      reason: 'public_stream',
      status: 'free',
      track
    };
  }

  if (!uId) {
    const err = new Error('Acesso não autorizado. Faça login para ouvir esta música.');
    err.statusCode = 401;
    err.status = 'unauthenticated';
    throw err;
  }

  // 1. Verificar se existe pedido criado sem pagamento ou com pagamento pendente
  const orders = readJson(ORDERS_FILE, []);
  const pendingOrder = orders.find(o => Number(o.user_id) === uId && Number(o.track_id) === tId && o.payment_status === 'pending');

  const userTracks = await getUserPurchasedTracks(uId);
  const userTrack = userTracks.find(t => Number(t.dbTrackId) === tId || Number(String(t.id).replace('ct-', '')) === tId);

  if (!userTrack) {
    if (pendingOrder) {
      const err = new Error('Pagamento pendente. A reprodução da música só é liberada após a confirmação válida do pagamento.');
      err.statusCode = 403;
      err.status = 'payment_pending';
      err.pending = true;
      err.track = track;
      throw err;
    }

    const err = new Error('Esta música não está na sua biblioteca. Adquira-a para reproduzir.');
    err.statusCode = 403;
    err.status = 'not_acquired';
    err.track = track;
    throw err;
  }

  if (userTrack.type === 'buy') {
    return {
      allowed: true,
      reason: 'purchased',
      status: 'purchased',
      track: userTrack
    };
  }

  if (userTrack.type === 'rent') {
    if (!userTrack.isExpired && userTrack.canPlay) {
      return {
        allowed: true,
        reason: 'rent_active',
        status: 'rent_active',
        remainingDays: userTrack.remainingDays,
        expiresAt: userTrack.expiresAt,
        rentedAt: userTrack.rentedAt,
        track: userTrack
      };
    } else {
      const err = new Error('O período de aluguel desta música terminou. Renove o aluguel ou compre definitivamente para continuar ouvindo.');
      err.statusCode = 403;
      err.status = 'rent_expired';
      err.expired = true;
      err.track = userTrack;
      throw err;
    }
  }

  const err = new Error('Acesso negado para esta faixa.');
  err.statusCode = 403;
  err.status = 'forbidden';
  throw err;
}

// =========================================================================
// RENTAL ORDER & IDEMPOTENT PAYMENT CONFIRMATION (REGRAS DE INÍCIO E CONTAGEM)
// =========================================================================

/**
 * Cria pedido de aluguel ou compra com status 'pending'
 * Regra: Contagem do prazo NÃO é iniciada ao criar pedido, adicionar ao carrinho ou iniciar checkout
 */
async function createRentalOrder(userId, trackId, { type = 'rent', companyId = null, price = null } = {}) {
  const uId = Number(userId);
  const cleanId = typeof trackId === 'string' ? trackId.replace('ct-', '') : trackId;
  const tId = Number(cleanId);

  const track = await getTrackById(tId);
  if (!track) {
    const err = new Error('Música não encontrada.');
    err.statusCode = 404;
    throw err;
  }

  const orderPrice = price !== null ? Number(price) : (type === 'rent' ? Number(track.rent_price || 1.90) : Number(track.sale_price || 4.90));
  const cId = companyId || track.company_id || 1;
  const now = new Date();

  const orders = readJson(ORDERS_FILE, []);
  const newOrderId = orders.reduce((max, o) => Math.max(max, Number(o.id) || 0), 0) + 1;

  const newOrder = {
    id: newOrderId,
    user_id: uId,
    track_id: tId,
    company_id: cId,
    type,
    price: orderPrice,
    payment_status: 'pending',
    created_at: now.toISOString(),
    rented_at: null,
    expires_at: null,
    confirmed_at: null,
    transaction_id: null
  };

  orders.push(newOrder);
  writeJson(ORDERS_FILE, orders);

  return {
    success: true,
    message: 'Pedido de aluguel criado. O prazo de 30 dias começará exclusivamente após a confirmação do pagamento.',
    order: newOrder
  };
}

/**
 * Confirmação de pagamento idempotente
 * Inicia a contagem de 30 dias a partir da data exata de confirmação do pagamento
 * Se for renovação antecipada: preserva os dias restantes e acrescenta +30 dias ao vencimento atual
 * Se aluguel expirado: novo período de 30 dias inicia na confirmação
 * Se compra definitiva: vitalícia, sem expiração
 */
async function confirmPayment({
  orderId = null,
  transactionId = null,
  userId,
  trackId,
  type = 'rent',
  price = null,
  confirmedAt = null,
  companyId = null
}) {
  const uId = Number(userId);
  const cleanId = typeof trackId === 'string' ? trackId.replace('ct-', '') : trackId;
  const tId = Number(cleanId);
  const confirmedAtDate = confirmedAt ? new Date(confirmedAt) : new Date();

  const track = await getTrackById(tId);
  if (!track) {
    const err = new Error('Música não encontrada.');
    err.statusCode = 404;
    throw err;
  }

  const effectivePrice = price !== null ? Number(price) : (type === 'rent' ? Number(track.rent_price || 1.90) : Number(track.sale_price || 4.90));
  const cId = companyId || track.company_id || 1;

  // 1. Idempotência por orderId
  const orders = readJson(ORDERS_FILE, []);
  let targetOrder = null;
  if (orderId) {
    targetOrder = orders.find(o => Number(o.id) === Number(orderId));
  } else if (transactionId) {
    targetOrder = orders.find(o => o.transaction_id === transactionId);
  }

  if (targetOrder && targetOrder.payment_status === 'confirmed') {
    return {
      success: true,
      alreadyConfirmed: true,
      message: 'Pagamento já confirmado anteriormente (processamento idempotente). O prazo original foi mantido.',
      order: targetOrder,
      rented_at: targetOrder.rented_at,
      expires_at: targetOrder.expires_at,
      type: targetOrder.type
    };
  }

  // 2. Idempotência por transaction_id nas compras
  const purchases = readJson(PURCHASES_FILE, []);
  if (transactionId) {
    const existingTx = purchases.find(p => p.transaction_id === transactionId && p.payment_status === 'confirmed');
    if (existingTx) {
      return {
        success: true,
        alreadyConfirmed: true,
        message: 'Transação já confirmada anteriormente (idempotência garantida). O prazo original foi preservado.',
        purchaseId: existingTx.id,
        rented_at: existingTx.rented_at || existingTx.created_at,
        expires_at: existingTx.expires_at,
        type: existingTx.type
      };
    }
  }

  // Se já possui compra definitiva, prevalece acesso vitalício
  const existingBuy = purchases.find(p => Number(p.user_id) === uId && Number(p.track_id) === tId && p.type === 'buy');
  if (type === 'buy' && existingBuy) {
    return {
      success: true,
      alreadyConfirmed: true,
      message: 'Você já possui esta música comprada definitivamente!',
      type: 'buy',
      expires_at: null,
      rented_at: null
    };
  }

  let finalRentedAt = null;
  let finalExpiresAt = null;

  if (type === 'buy') {
    finalRentedAt = null;
    finalExpiresAt = null;
  } else {
    // Aluguel (30 dias exatos a partir da confirmação do pagamento)
    const existingRent = purchases.find(p => Number(p.user_id) === uId && Number(p.track_id) === tId && p.type === 'rent');
    const isCurrentlyActive = existingRent && existingRent.expires_at && new Date(existingRent.expires_at) > confirmedAtDate;

    if (isCurrentlyActive) {
      // Renovação antecipada: preserva os dias restantes e acrescenta exatamente 30 dias à data atual de expiração
      const currentExpiry = new Date(existingRent.expires_at);
      finalExpiresAt = new Date(currentExpiry.getTime() + THIRTY_DAYS_MS);
      finalRentedAt = existingRent.rented_at || existingRent.created_at || confirmedAtDate.toISOString();
    } else {
      // Novo aluguel ou renovação após expiração: 30 dias a contar do momento da confirmação do pagamento
      finalRentedAt = confirmedAtDate.toISOString();
      finalExpiresAt = new Date(confirmedAtDate.getTime() + THIRTY_DAYS_MS);
    }
  }

  // Atualizar ou inserir em PURCHASES_FILE
  let updatedPurchase = null;
  const existingRecord = purchases.find(p => Number(p.user_id) === uId && Number(p.track_id) === tId);

  if (existingRecord) {
    existingRecord.type = type;
    existingRecord.price = effectivePrice;
    existingRecord.company_id = cId;
    existingRecord.rented_at = finalRentedAt;
    existingRecord.expires_at = finalExpiresAt ? finalExpiresAt.toISOString() : null;
    existingRecord.payment_status = 'confirmed';
    existingRecord.confirmed_at = confirmedAtDate.toISOString();
    if (transactionId) existingRecord.transaction_id = transactionId;
    existingRecord.updated_at = confirmedAtDate.toISOString();
    updatedPurchase = existingRecord;
  } else {
    const nextId = purchases.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1;
    updatedPurchase = {
      id: nextId,
      company_id: cId,
      user_id: uId,
      track_id: tId,
      type,
      price: effectivePrice,
      rented_at: finalRentedAt,
      expires_at: finalExpiresAt ? finalExpiresAt.toISOString() : null,
      payment_status: 'confirmed',
      confirmed_at: confirmedAtDate.toISOString(),
      transaction_id: transactionId || `tx_${Date.now()}_${uId}_${tId}`,
      created_at: confirmedAtDate.toISOString(),
      updated_at: confirmedAtDate.toISOString()
    };
    purchases.push(updatedPurchase);
  }
  writeJson(PURCHASES_FILE, purchases);

  // Se houver pedido associado, atualizar status
  if (targetOrder) {
    targetOrder.payment_status = 'confirmed';
    targetOrder.confirmed_at = confirmedAtDate.toISOString();
    targetOrder.rented_at = finalRentedAt;
    targetOrder.expires_at = finalExpiresAt ? finalExpiresAt.toISOString() : null;
    if (transactionId) targetOrder.transaction_id = transactionId;
    writeJson(ORDERS_FILE, orders);
  }

  // Atualizar MySQL se disponível
  const hasMySql = await checkMySql();
  if (hasMySql) {
    try {
      const [existingMySql] = await db.query(
        'SELECT id, expires_at, created_at FROM company_purchases WHERE user_id = ? AND track_id = ? LIMIT 1',
        [uId, tId]
      );
      if (existingMySql.length > 0) {
        await db.query(
          'UPDATE company_purchases SET type = ?, price = ?, expires_at = ?, created_at = ? WHERE id = ?',
          [type, effectivePrice, finalExpiresAt, finalRentedAt || confirmedAtDate, existingMySql[0].id]
        );
      } else {
        await db.query(
          'INSERT INTO company_purchases (company_id, user_id, track_id, type, price, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [cId, uId, tId, type, effectivePrice, finalExpiresAt, finalRentedAt || confirmedAtDate]
        );
      }
    } catch (mysqlErr) {
      console.warn('Erro ao sincronizar compra no MySQL:', mysqlErr.message);
    }
  }

  return {
    success: true,
    message: type === 'buy'
      ? 'Música comprada definitivamente! Acesso vitalício liberado.'
      : 'Pagamento confirmado! Período de aluguel iniciado com vigência de 30 dias.',
    purchase: updatedPurchase,
    order: targetOrder,
    type,
    price: effectivePrice,
    rented_at: finalRentedAt,
    expires_at: finalExpiresAt ? finalExpiresAt.toISOString() : null,
    trackTitle: track.title
  };
}

async function renewRent(userId, trackId, options = {}) {
  return confirmPayment({
    userId,
    trackId,
    type: 'rent',
    price: options.price,
    transactionId: options.transactionId,
    confirmedAt: options.confirmedAt || new Date().toISOString()
  });
}

async function buyPermanent(userId, trackId, options = {}) {
  return confirmPayment({
    userId,
    trackId,
    type: 'buy',
    price: options.price,
    transactionId: options.transactionId,
    confirmedAt: options.confirmedAt || new Date().toISOString()
  });
}

module.exports = {
  checkMySql,
  initMySqlTables,
  getPlaylists,
  getPlaylistById,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  reorderPlaylistTracks,
  getArtists,
  getArtistById,
  createArtist,
  updateArtist,
  deleteArtist,
  getAlbums,
  getAlbumById,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  getLibraryTracks,
  getTracks: getLibraryTracks,
  getTrackById,
  createTrack,
  updateTrack,
  deleteTrack,
  getUserPurchasedTracks,
  recordPurchase,
  checkPlaybackAccess,
  createRentalOrder,
  confirmPayment,
  renewRent,
  buyPermanent,
  THIRTY_DAYS_MS
};

