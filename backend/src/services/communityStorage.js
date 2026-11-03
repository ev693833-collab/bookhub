const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const HISTORY_FILE = path.join(DATA_DIR, 'user_history.json');
const TRACKS_FILE = path.join(DATA_DIR, 'company_tracks.json');
const ALBUMS_FILE = path.join(DATA_DIR, 'albums.json');
const PLAYLISTS_FILE = path.join(DATA_DIR, 'playlists.json');

const PROFILES_FILE = path.join(DATA_DIR, 'community_profiles.json');
const FRIENDSHIPS_FILE = path.join(DATA_DIR, 'community_friendships.json');
const POSTS_FILE = path.join(DATA_DIR, 'community_posts.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'community_messages.json');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'community_notifications.json');
const ACTIVITIES_FILE = path.join(DATA_DIR, 'community_activities.json');

function ensureFiles() {
  const files = [
    PROFILES_FILE,
    FRIENDSHIPS_FILE,
    POSTS_FILE,
    MESSAGES_FILE,
    NOTIFICATIONS_FILE,
    ACTIVITIES_FILE
  ];
  for (const f of files) {
    if (!fs.existsSync(f)) {
      fs.writeFileSync(f, '[]', 'utf8');
    }
  }
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

// Helper para obter dados básicos de usuário (nome, avatar, email, username)
function getUserBasic(userId) {
  const users = readJson(USERS_FILE, []);
  const u = users.find(x => Number(x.id) === Number(userId));
  if (!u) {
    return {
      id: Number(userId),
      name: 'Usuário DevSongs',
      username: `user_${userId}`,
      avatar_url: `https://ui-avatars.com/api/?name=User+${userId}&background=1db954&color=fff`,
      role: 'user'
    };
  }
  const profiles = readJson(PROFILES_FILE, []);
  const p = profiles.find(x => Number(x.userId) === Number(userId));
  const rawName = (u.full_name || u.name || u.username || (u.email ? u.email.split('@')[0] : 'Usuário')).trim();
  const rawUsername = p?.username || (u.email ? u.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') : `user_${u.id}`);
  
  return {
    id: Number(u.id),
    name: rawName,
    username: rawUsername.startsWith('@') ? rawUsername : `@${rawUsername}`,
    avatar_url: p?.avatarUrl || u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(rawName)}&background=1db954&color=fff`,
    role: u.role || 'user'
  };
}

// -------------------------------------------------------------
// 1. PERFIL E CONFIGURAÇÕES
// -------------------------------------------------------------
function getOrCreateProfile(userId) {
  const profiles = readJson(PROFILES_FILE, []);
  let p = profiles.find(x => Number(x.userId) === Number(userId));
  const userBasic = getUserBasic(userId);

  if (!p) {
    p = {
      userId: Number(userId),
      username: userBasic.username,
      bio: 'Apaixonado por música e novidades no DevSongs! 🎧',
      avatarUrl: userBasic.avatar_url,
      headerUrl: null,
      favoriteTrackIds: [],
      favoriteArtistIds: [],
      favoriteAlbumIds: [],
      privacy: {
        profile: 'public', // public | private
        friendRequests: 'everyone', // everyone | friends_of_friends | none
        listeningActivity: 'everyone', // everyone | friends | nobody
        hideCurrentListening: false,
        playlists: 'public', // public | friends | private
        messages: 'everyone' // everyone | friends | nobody
      },
      blockedUserIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    profiles.push(p);
    writeJson(PROFILES_FILE, profiles);
  }
  return p;
}

function updateProfile(userId, updates) {
  const profiles = readJson(PROFILES_FILE, []);
  let p = profiles.find(x => Number(x.userId) === Number(userId));
  if (!p) {
    p = getOrCreateProfile(userId);
    profiles.push(p);
  }

  if (updates.bio !== undefined) p.bio = String(updates.bio).slice(0, 300);
  if (updates.avatarUrl !== undefined) p.avatarUrl = updates.avatarUrl;
  if (updates.headerUrl !== undefined) p.headerUrl = updates.headerUrl;
  if (updates.username !== undefined) {
    let clean = updates.username.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (clean) p.username = `@${clean}`;
  }
  if (Array.isArray(updates.favoriteTrackIds)) p.favoriteTrackIds = updates.favoriteTrackIds;
  if (Array.isArray(updates.favoriteArtistIds)) p.favoriteArtistIds = updates.favoriteArtistIds;
  if (Array.isArray(updates.favoriteAlbumIds)) p.favoriteAlbumIds = updates.favoriteAlbumIds;
  if (updates.privacy && typeof updates.privacy === 'object') {
    p.privacy = { ...p.privacy, ...updates.privacy };
  }
  p.updatedAt = new Date().toISOString();

  writeJson(PROFILES_FILE, profiles);
  return p;
}

// Obter perfil completo para visualização por outro usuário (ou próprio)
function getFullUserProfile(targetUserId, viewerId = null) {
  const profile = getOrCreateProfile(targetUserId);
  const basic = getUserBasic(targetUserId);
  const friendships = readJson(FRIENDSHIPS_FILE, []);
  const posts = readJson(POSTS_FILE, []);
  const playlists = readJson(PLAYLISTS_FILE, []);
  const tracksCatalog = readJson(TRACKS_FILE, []);
  const albumsCatalog = readJson(ALBUMS_FILE, []);

  // Verificar bloqueio
  if (viewerId && profile.blockedUserIds?.includes(Number(viewerId))) {
    return { blocked: true, message: 'Usuário não disponível.' };
  }

  // Relação de amizade entre viewer e target
  let friendshipStatus = 'none'; // 'none' | 'pending_sent' | 'pending_received' | 'friends'
  let friendshipRecord = null;
  if (viewerId && Number(viewerId) !== Number(targetUserId)) {
    friendshipRecord = friendships.find(f => 
      (Number(f.requesterId) === Number(viewerId) && Number(f.receiverId) === Number(targetUserId)) ||
      (Number(f.requesterId) === Number(targetUserId) && Number(f.receiverId) === Number(viewerId))
    );
    if (friendshipRecord) {
      if (friendshipRecord.status === 'accepted') {
        friendshipStatus = 'friends';
      } else if (friendshipRecord.status === 'pending') {
        friendshipStatus = Number(friendshipRecord.requesterId) === Number(viewerId) ? 'pending_sent' : 'pending_received';
      }
    }
  } else if (Number(viewerId) === Number(targetUserId)) {
    friendshipStatus = 'self';
  }

  // Contagem de amigos
  const userFriendsList = friendships.filter(f => 
    f.status === 'accepted' && (Number(f.requesterId) === Number(targetUserId) || Number(f.receiverId) === Number(targetUserId))
  );
  const friendsCount = userFriendsList.length;

  // Amigos em comum com o viewer
  let mutualFriends = [];
  if (viewerId && Number(viewerId) !== Number(targetUserId)) {
    const viewerFriendsList = friendships.filter(f => 
      f.status === 'accepted' && (Number(f.requesterId) === Number(viewerId) || Number(f.receiverId) === Number(viewerId))
    );
    const viewerFriendIds = viewerFriendsList.map(f => Number(f.requesterId) === Number(viewerId) ? Number(f.receiverId) : Number(f.requesterId));
    const targetFriendIds = userFriendsList.map(f => Number(f.requesterId) === Number(targetUserId) ? Number(f.receiverId) : Number(f.requesterId));
    const commonIds = targetFriendIds.filter(id => viewerFriendIds.includes(id));
    mutualFriends = commonIds.map(id => getUserBasic(id));
  }

  // Publicações do usuário
  const userPosts = posts.filter(p => Number(p.userId) === Number(targetUserId));
  const postsCount = userPosts.length;

  // Playlists públicas do usuário
  const userPlaylists = playlists.filter(pl => {
    if (Number(pl.user_id) !== Number(targetUserId)) return false;
    if (Number(viewerId) === Number(targetUserId)) return true;
    if (profile.privacy?.playlists === 'private') return false;
    if (profile.privacy?.playlists === 'friends' && friendshipStatus !== 'friends') return false;
    return pl.privacy === 'public' || !pl.privacy;
  });

  // Músicas favoritas com metadados completos
  const favoriteTracks = (profile.favoriteTrackIds || []).map(tId => {
    const t = tracksCatalog.find(x => String(x.id) === String(tId) || String(x.track_id) === String(tId));
    return t || null;
  }).filter(Boolean);

  // Álbuns favoritos
  const favoriteAlbums = (profile.favoriteAlbumIds || []).map(aId => {
    const a = albumsCatalog.find(x => String(x.id) === String(aId) || String(x.album_id) === String(aId));
    return a || null;
  }).filter(Boolean);

  // Estatísticas reais
  const stats = getUserStats(targetUserId);

  // Atividade atual (Ouvindo agora)
  const activity = getNowPlayingActivity(targetUserId, viewerId);

  return {
    id: basic.id,
    name: basic.name,
    username: basic.username,
    avatar_url: profile.avatarUrl || basic.avatar_url,
    header_url: profile.headerUrl || null,
    bio: profile.bio,
    privacy: profile.privacy,
    friendsCount,
    postsCount,
    mutualFriends,
    friendshipStatus,
    friendshipId: friendshipRecord?.id || null,
    favoriteTracks,
    favoriteArtists: profile.favoriteArtistIds || [],
    favoriteAlbums,
    playlists: userPlaylists,
    stats,
    currentActivity: activity,
    createdAt: profile.createdAt
  };
}

// -------------------------------------------------------------
// 2. ESTATÍSTICAS REAIS BASEADAS EM USER_HISTORY.JSON
// -------------------------------------------------------------
function getUserStats(userId) {
  const history = readJson(HISTORY_FILE, []);
  const userHistory = history.filter(h => Number(h.user_id) === Number(userId));

  const totalPlays = userHistory.length;
  let totalDurationSec = 0;
  const artistMap = {};
  const trackMap = {};
  const albumMap = {};
  const genreMap = {};

  for (const item of userHistory) {
    const dur = Number(item.durationSec || item.duration_sec || 180);
    totalDurationSec += dur;

    // Artista
    const art = (item.artist || 'Desconhecido').trim();
    if (art) {
      artistMap[art] = (artistMap[art] || 0) + 1;
    }

    // Faixa
    const trackKey = `${item.title || 'Música'} - ${art}`;
    if (!trackMap[trackKey]) {
      trackMap[trackKey] = {
        title: item.title,
        artist: art,
        album: item.album,
        cover: item.cover || item.cover_url,
        track_id: item.track_id,
        plays: 0
      };
    }
    trackMap[trackKey].plays += 1;

    // Álbum
    if (item.album) {
      albumMap[item.album] = (albumMap[item.album] || 0) + 1;
    }

    // Gênero
    if (item.genre && item.genre !== 'Variado') {
      genreMap[item.genre] = (genreMap[item.genre] || 0) + 1;
    }
  }

  // Ordenar tops
  const topArtists = Object.entries(artistMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([artist, plays]) => ({ artist, plays }));

  const topTracks = Object.values(trackMap)
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 5);

  const topAlbums = Object.entries(albumMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([album, plays]) => ({ album, plays }));

  const topGenres = Object.entries(genreMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre, count]) => ({ genre, count }));

  // Formatar tempo total
  const totalMinutes = Math.floor(totalDurationSec / 60);
  const totalHours = (totalMinutes / 60).toFixed(1);

  return {
    totalPlays,
    totalDurationSec,
    totalMinutes,
    totalHours,
    topArtists,
    topTracks,
    topAlbums,
    topGenres,
    recentHistory: userHistory.slice(0, 10)
  };
}

// -------------------------------------------------------------
// 3. ATIVIDADE EM TEMPO REAL ("OUVINDO AGORA")
// -------------------------------------------------------------
function updateNowPlaying(userId, track, isPlaying = true) {
  const activities = readJson(ACTIVITIES_FILE, []);
  const profile = getOrCreateProfile(userId);

  let userAct = activities.find(a => Number(a.userId) === Number(userId));
  if (!userAct) {
    userAct = { userId: Number(userId) };
    activities.push(userAct);
  }

  userAct.track = track ? {
    id: track.id || track.track_id,
    title: track.title,
    artist: track.artist,
    album: track.album || '',
    cover: track.cover || track.cover_url || track.image || '',
    durationSec: track.durationSec || track.duration_sec || 0,
    youtube_video_id: track.youtube_video_id || null,
    audio_url: track.audio_url || track.preview_url || null
  } : null;
  userAct.isPlaying = !!isPlaying;
  userAct.updatedAt = new Date().toISOString();

  writeJson(ACTIVITIES_FILE, activities);
  return userAct;
}

function getNowPlayingActivity(targetUserId, viewerId = null) {
  const profile = getOrCreateProfile(targetUserId);
  if (profile.privacy?.hideCurrentListening) return null;

  // Checar privacidade de quem pode ver
  if (viewerId && Number(viewerId) !== Number(targetUserId)) {
    if (profile.privacy?.listeningActivity === 'nobody') return null;
    if (profile.privacy?.listeningActivity === 'friends') {
      const friendships = readJson(FRIENDSHIPS_FILE, []);
      const isFriend = friendships.some(f => 
        f.status === 'accepted' &&
        ((Number(f.requesterId) === Number(viewerId) && Number(f.receiverId) === Number(targetUserId)) ||
         (Number(f.requesterId) === Number(targetUserId) && Number(f.receiverId) === Number(viewerId)))
      );
      if (!isFriend) return null;
    }
  }

  const activities = readJson(ACTIVITIES_FILE, []);
  const act = activities.find(a => Number(a.userId) === Number(targetUserId));
  if (!act || !act.track) return null;

  // Considerar online se atualizado nos últimos 5 minutos
  const diffSec = (Date.now() - new Date(act.updatedAt).getTime()) / 1000;
  if (diffSec > 300) {
    return { ...act, isPlaying: false, isOnline: false };
  }

  return { ...act, isOnline: true };
}

function getFriendsActivities(userId) {
  const friendships = readJson(FRIENDSHIPS_FILE, []);
  const friendRecords = friendships.filter(f => 
    f.status === 'accepted' && (Number(f.requesterId) === Number(userId) || Number(f.receiverId) === Number(userId))
  );

  let targetIds = friendRecords.map(f => Number(f.requesterId) === Number(userId) ? Number(f.receiverId) : Number(f.requesterId));

  // Se o usuário ainda não tiver amigos aceitos, exibir ouvintes da comunidade para descoberta (estilo Airbuds)
  if (targetIds.length === 0) {
    const allUsers = readJson(USERS_FILE, []);
    targetIds = allUsers.map(u => Number(u.id)).filter(id => id !== Number(userId));
  }

  const results = [];
  const history = readJson(HISTORY_FILE, []);

  for (const fId of targetIds) {
    let act = getNowPlayingActivity(fId, userId);
    const basic = getUserBasic(fId);

    // Se não estiver ouvindo agora, buscar a última música ouvida do histórico real
    if (!act || !act.track) {
      const userHistory = history.filter(h => Number(h.user_id) === Number(fId));
      if (userHistory.length > 0) {
        const lastPlay = userHistory[0]; // mais recente
        const diffMs = Date.now() - new Date(lastPlay.played_at).getTime();
        const diffMin = Math.floor(diffMs / (60 * 1000));
        let timeLabel = 'Recentemente';
        if (diffMin < 60) timeLabel = `Há ${Math.max(1, diffMin)}m`;
        else if (diffMin < 1440) timeLabel = `Há ${Math.floor(diffMin / 60)}h`;

        act = {
          userId: Number(fId),
          track: {
            id: lastPlay.track_id || lastPlay.id,
            title: lastPlay.title,
            artist: lastPlay.artist,
            album: lastPlay.album,
            cover: lastPlay.cover || lastPlay.cover_url,
            durationSec: lastPlay.durationSec || 180,
            youtube_video_id: lastPlay.youtube_video_id || null
          },
          isPlaying: false,
          isOnline: false,
          statusLabel: timeLabel,
          updatedAt: lastPlay.played_at
        };
      }
    } else {
      act.statusLabel = 'Ouvindo agora';
    }

    if (act && act.track) {
      results.push({
        friend: basic,
        activity: act
      });
    }
  }

  return results;
}

// -------------------------------------------------------------
// 4. SISTEMA DE AMIZADES E DESCOBERTA DE PESSOAS
// -------------------------------------------------------------
function sendFriendRequest(requesterId, receiverId) {
  if (Number(requesterId) === Number(receiverId)) {
    throw new Error('Você não pode enviar solicitação de amizade para si mesmo.');
  }

  const receiverProfile = getOrCreateProfile(receiverId);
  if (receiverProfile.blockedUserIds?.includes(Number(requesterId))) {
    throw new Error('Não é possível enviar solicitação para este usuário.');
  }

  if (receiverProfile.privacy?.friendRequests === 'none') {
    throw new Error('Este usuário não está aceitando novas solicitações de amizade.');
  }

  const friendships = readJson(FRIENDSHIPS_FILE, []);
  const existing = friendships.find(f => 
    (Number(f.requesterId) === Number(requesterId) && Number(f.receiverId) === Number(receiverId)) ||
    (Number(f.requesterId) === Number(receiverId) && Number(f.receiverId) === Number(requesterId))
  );

  if (existing) {
    if (existing.status === 'accepted') {
      throw new Error('Vocês já são amigos.');
    }
    if (existing.status === 'pending') {
      if (Number(existing.requesterId) === Number(requesterId)) {
        throw new Error('Solicitação de amizade já enviada.');
      } else {
        // Se a outra pessoa já enviou solicitação para ele, auto-aceita!
        existing.status = 'accepted';
        existing.updatedAt = new Date().toISOString();
        writeJson(FRIENDSHIPS_FILE, friendships);
        createNotification(requesterId, receiverId, 'request_accepted', existing.id);
        return { status: 'accepted', message: 'Amizade estabelecida com sucesso!', record: existing };
      }
    }
  }

  const newReq = {
    id: `fr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    requesterId: Number(requesterId),
    receiverId: Number(receiverId),
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  friendships.push(newReq);
  writeJson(FRIENDSHIPS_FILE, friendships);

  // Criar notificação para o destinatário
  createNotification(receiverId, requesterId, 'friend_request', newReq.id);

  return { status: 'pending', message: 'Solicitação de amizade enviada!', record: newReq };
}

function respondFriendRequest(requestId, userId, action) {
  const friendships = readJson(FRIENDSHIPS_FILE, []);
  const reqIndex = friendships.findIndex(f => 
    String(f.id) === String(requestId) || 
    (f.status === 'pending' && Number(f.receiverId) === Number(userId) && (String(f.requesterId) === String(requestId) || String(f.id) === String(requestId)))
  );

  if (reqIndex === -1) {
    throw new Error('Solicitação não encontrada.');
  }

  const record = friendships[reqIndex];
  if (Number(record.receiverId) !== Number(userId)) {
    throw new Error('Apenas o destinatário pode responder a esta solicitação.');
  }

  if (action === 'accept') {
    record.status = 'accepted';
    record.updatedAt = new Date().toISOString();
    writeJson(FRIENDSHIPS_FILE, friendships);
    createNotification(record.requesterId, userId, 'request_accepted', record.id);
    return { success: true, status: 'accepted', message: 'Solicitação de amizade aceita!' };
  } else if (action === 'reject') {
    friendships.splice(reqIndex, 1);
    writeJson(FRIENDSHIPS_FILE, friendships);
    return { success: true, status: 'rejected', message: 'Solicitação recusada.' };
  } else {
    throw new Error('Ação inválida.');
  }
}

function cancelFriendRequest(requestId, requesterId) {
  const friendships = readJson(FRIENDSHIPS_FILE, []);
  const reqIndex = friendships.findIndex(f => 
    (String(f.id) === String(requestId) || String(f.receiverId) === String(requestId)) &&
    Number(f.requesterId) === Number(requesterId) && f.status === 'pending'
  );

  if (reqIndex === -1) {
    throw new Error('Solicitação pendente não encontrada.');
  }

  friendships.splice(reqIndex, 1);
  writeJson(FRIENDSHIPS_FILE, friendships);
  return { success: true, message: 'Solicitação cancelada com sucesso.' };
}

function removeFriend(userId, friendId) {
  const friendships = readJson(FRIENDSHIPS_FILE, []);
  const index = friendships.findIndex(f => 
    f.status === 'accepted' &&
    ((Number(f.requesterId) === Number(userId) && Number(f.receiverId) === Number(friendId)) ||
     (Number(f.requesterId) === Number(friendId) && Number(f.receiverId) === Number(userId)))
  );

  if (index === -1) {
    throw new Error('Amizade não encontrada.');
  }

  friendships.splice(index, 1);
  writeJson(FRIENDSHIPS_FILE, friendships);
  return { success: true, message: 'Amizade removida com sucesso.' };
}

function getFriendRequests(userId) {
  const friendships = readJson(FRIENDSHIPS_FILE, []);
  
  // Recebidas
  const received = friendships
    .filter(f => Number(f.receiverId) === Number(userId) && f.status === 'pending')
    .map(f => ({
      ...f,
      user: getUserBasic(f.requesterId),
      profile: getOrCreateProfile(f.requesterId)
    }));

  // Enviadas
  const sent = friendships
    .filter(f => Number(f.requesterId) === Number(userId) && f.status === 'pending')
    .map(f => ({
      ...f,
      user: getUserBasic(f.receiverId),
      profile: getOrCreateProfile(f.receiverId)
    }));

  return { received, sent };
}

function getFriends(userId) {
  const friendships = readJson(FRIENDSHIPS_FILE, []);
  const records = friendships.filter(f => 
    f.status === 'accepted' && (Number(f.requesterId) === Number(userId) || Number(f.receiverId) === Number(userId))
  );

  return records.map(f => {
    const friendId = Number(f.requesterId) === Number(userId) ? Number(f.receiverId) : Number(f.requesterId);
    const basic = getUserBasic(friendId);
    const activity = getNowPlayingActivity(friendId, userId);
    const stats = getUserStats(friendId);
    return {
      friendshipId: f.id,
      friendId,
      ...basic,
      activity,
      topArtists: stats.topArtists.slice(0, 3),
      since: f.createdAt
    };
  });
}

// Algoritmo de Descoberta de Pessoas baseado em afinidade musical real
function discoverUsers(currentUserId, query = '') {
  const users = readJson(USERS_FILE, []);
  const friendships = readJson(FRIENDSHIPS_FILE, []);
  const history = readJson(HISTORY_FILE, []);
  const profiles = readJson(PROFILES_FILE, []);
  const myProfile = getOrCreateProfile(currentUserId);
  const myStats = getUserStats(currentUserId);
  const myTopArtistNames = new Set(myStats.topArtists.map(a => a.artist.toLowerCase()));

  // Lista de amigos atuais e solicitações pendentes
  const existingRelations = {};
  for (const f of friendships) {
    if (Number(f.requesterId) === Number(currentUserId)) {
      existingRelations[Number(f.receiverId)] = f.status === 'accepted' ? 'friends' : 'pending_sent';
    } else if (Number(f.receiverId) === Number(currentUserId)) {
      existingRelations[Number(f.requesterId)] = f.status === 'accepted' ? 'friends' : 'pending_received';
    }
  }

  const results = [];

  for (const u of users) {
    const uId = Number(u.id);
    if (uId === Number(currentUserId)) continue;
    if (myProfile.blockedUserIds?.includes(uId)) continue;

    const uProfile = getOrCreateProfile(uId);
    if (uProfile.blockedUserIds?.includes(Number(currentUserId))) continue;

    const basic = getUserBasic(uId);

    // Filtro de busca por nome ou username
    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      const matchName = basic.name.toLowerCase().includes(q);
      const matchUsername = basic.username.toLowerCase().includes(q);
      if (!matchName && !matchUsername) continue;
    }

    const uStats = getUserStats(uId);
    const uTopArtists = uStats.topArtists.map(a => a.artist);

    // Calcular artistas em comum
    const commonArtists = uTopArtists.filter(art => myTopArtistNames.has(art.toLowerCase()));

    // Calcular pontuação de afinidade
    let score = 50; // base
    if (commonArtists.length > 0) score += commonArtists.length * 15;
    if (uStats.topGenres && myStats.topGenres) {
      const myGenres = new Set(myStats.topGenres.map(g => g.genre.toLowerCase()));
      const commonGenres = uStats.topGenres.filter(g => myGenres.has(g.genre.toLowerCase()));
      score += commonGenres.length * 10;
    }
    score = Math.min(99, Math.max(45, score));

    // Determinar status de relação
    const relation = existingRelations[uId] || 'none';

    results.push({
      ...basic,
      bio: uProfile.bio,
      compatibility: score,
      commonArtists,
      topArtists: uTopArtists.slice(0, 3),
      relationStatus: relation,
      totalPlays: uStats.totalPlays
    });
  }

  // Ordenar por compatibilidade se não houver busca, ou por relevância
  results.sort((a, b) => b.compatibility - a.compatibility);
  return results;
}

// -------------------------------------------------------------
// 5. FEED E PUBLICAÇÕES
// -------------------------------------------------------------
function getFeed(viewerId) {
  const posts = readJson(POSTS_FILE, []);
  const myProfile = getOrCreateProfile(viewerId);
  const friendships = readJson(FRIENDSHIPS_FILE, []);

  // Obter lista de amigos do visualizador
  const friendIds = new Set(
    friendships
      .filter(f => f.status === 'accepted' && (Number(f.requesterId) === Number(viewerId) || Number(f.receiverId) === Number(viewerId)))
      .map(f => Number(f.requesterId) === Number(viewerId) ? Number(f.receiverId) : Number(f.requesterId))
  );

  const formatted = posts
    .filter(p => {
      // Ocultar se o autor bloqueou ou foi bloqueado
      if (myProfile.blockedUserIds?.includes(Number(p.userId))) return false;
      return true;
    })
    .map(p => {
      const author = getUserBasic(p.userId);
      const isLiked = Array.isArray(p.likes) && p.likes.includes(Number(viewerId));
      const likesCount = Array.isArray(p.likes) ? p.likes.length : 0;
      const commentsCount = Array.isArray(p.comments) ? p.comments.length : 0;
      const isFriend = friendIds.has(Number(p.userId));
      const isSelf = Number(p.userId) === Number(viewerId);

      // Reações de Emojis do Airbuds (🔥, ❤️, 🎧, ⚡, 🤯)
      const rawReactions = p.reactions && typeof p.reactions === 'object' ? p.reactions : {};
      const EMOJIS = ['🔥', '❤️', '🎧', '⚡', '🤯'];
      const reactionsSummary = {};
      const userReactions = {};
      for (const em of EMOJIS) {
        const list = Array.isArray(rawReactions[em]) ? rawReactions[em] : [];
        reactionsSummary[em] = list.length;
        userReactions[em] = list.includes(Number(viewerId));
      }

      const comments = (p.comments || []).map(c => ({
        ...c,
        user: getUserBasic(c.userId),
        replies: (c.replies || []).map(r => ({
          ...r,
          user: getUserBasic(r.userId)
        }))
      }));

      return {
        ...p,
        author,
        isLiked,
        likesCount,
        reactions: reactionsSummary,
        userReactions,
        commentsCount,
        comments,
        isFriend,
        isSelf
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return formatted;
}

function createPost(userId, { type = 'status', text = '', mediaItem = null }) {
  if (!text?.trim() && !mediaItem) {
    throw new Error('A publicação precisa de um texto ou uma música/álbum/playlist associado.');
  }

  const posts = readJson(POSTS_FILE, []);
  const newPost = {
    id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    userId: Number(userId),
    type: type || 'status', // status | track | album | playlist | review | airbuds_share
    text: (text || '').trim(),
    mediaItem: mediaItem ? {
      id: mediaItem.id || mediaItem.track_id,
      title: mediaItem.title,
      artist: mediaItem.artist,
      album: mediaItem.album,
      cover: mediaItem.cover || mediaItem.cover_url || mediaItem.image,
      type: mediaItem.type || 'track',
      duration: mediaItem.duration || mediaItem.durationSec,
      youtube_video_id: mediaItem.youtube_video_id || null,
      audio_url: mediaItem.audio_url || mediaItem.preview_url || null
    } : null,
    likes: [],
    reactions: {
      '🔥': [],
      '❤️': [],
      '🎧': [],
      '⚡': [],
      '🤯': []
    },
    comments: [],
    sharesCount: 0,
    createdAt: new Date().toISOString()
  };

  posts.unshift(newPost);
  writeJson(POSTS_FILE, posts);
  return newPost;
}

function togglePostReaction(postId, userId, emoji) {
  const allowed = ['🔥', '❤️', '🎧', '⚡', '🤯'];
  if (!allowed.includes(emoji)) {
    emoji = '🔥';
  }

  const posts = readJson(POSTS_FILE, []);
  const post = posts.find(p => String(p.id) === String(postId));
  if (!post) throw new Error('Publicação não encontrada.');

  if (!post.reactions || typeof post.reactions !== 'object') {
    post.reactions = { '🔥': [], '❤️': [], '🎧': [], '⚡': [], '🤯': [] };
  }
  if (!Array.isArray(post.reactions[emoji])) {
    post.reactions[emoji] = [];
  }

  const idx = post.reactions[emoji].indexOf(Number(userId));
  let hasReacted = false;

  if (idx === -1) {
    post.reactions[emoji].push(Number(userId));
    hasReacted = true;
    if (Number(post.userId) !== Number(userId)) {
      createNotification(post.userId, userId, `reaction_${emoji}`, post.id);
    }
  } else {
    post.reactions[emoji].splice(idx, 1);
    hasReacted = false;
  }

  writeJson(POSTS_FILE, posts);

  const summary = {};
  for (const em of allowed) {
    summary[em] = (post.reactions[em] || []).length;
  }

  return {
    emoji,
    hasReacted,
    count: post.reactions[emoji].length,
    reactions: summary
  };
}

function compareUsers(userId1, userId2) {
  const stats1 = getUserStats(userId1);
  const stats2 = getUserStats(userId2);
  const user1 = getUserBasic(userId1);
  const user2 = getUserBasic(userId2);

  const artists1 = new Set(stats1.topArtists.map(a => a.artist.toLowerCase()));
  const commonArtists = stats2.topArtists.filter(a => artists1.has(a.artist.toLowerCase())).map(a => a.artist);

  const tracks1 = new Set(stats1.topTracks.map(t => (t.title || '').toLowerCase()));
  const commonTracks = stats2.topTracks.filter(t => tracks1.has((t.title || '').toLowerCase())).map(t => t.title);

  const genres1 = new Set(stats1.topGenres.map(g => g.genre.toLowerCase()));
  const commonGenres = stats2.topGenres.filter(g => genres1.has(g.genre.toLowerCase())).map(g => g.genre);

  let score = 55;
  score += commonArtists.length * 15;
  score += commonGenres.length * 10;
  score = Math.min(99, Math.max(48, score));

  let vibeDescription = 'Gostos musicais conectados';
  if (score >= 85) {
    vibeDescription = 'Gêmeos Musicais! Vocês vibram nas mesmas frequências.';
  } else if (score >= 70) {
    vibeDescription = 'Grande Sintonia! Vocês compartilham vários artistas favoritos.';
  } else {
    vibeDescription = 'Descobertas mútuas! Muito som novo para compartilhar.';
  }

  return {
    user1,
    user2,
    compatibilityScore: score,
    vibeDescription,
    commonArtists,
    commonTracks,
    commonGenres
  };
}

function toggleLikePost(postId, userId) {
  const posts = readJson(POSTS_FILE, []);
  const post = posts.find(p => String(p.id) === String(postId));
  if (!post) throw new Error('Publicação não encontrada.');

  if (!Array.isArray(post.likes)) post.likes = [];
  const idx = post.likes.indexOf(Number(userId));
  let isLiked = false;

  if (idx === -1) {
    post.likes.push(Number(userId));
    isLiked = true;
    // Notificar autor do post se for outra pessoa
    if (Number(post.userId) !== Number(userId)) {
      createNotification(post.userId, userId, 'post_like', post.id);
    }
  } else {
    post.likes.splice(idx, 1);
    isLiked = false;
  }

  writeJson(POSTS_FILE, posts);
  return { isLiked, likesCount: post.likes.length };
}

function addComment(postId, userId, text, replyToCommentId = null) {
  if (!text || !text.trim()) throw new Error('O comentário não pode ser vazio.');

  const posts = readJson(POSTS_FILE, []);
  const post = posts.find(p => String(p.id) === String(postId));
  if (!post) throw new Error('Publicação não encontrada.');

  if (!Array.isArray(post.comments)) post.comments = [];

  const commentItem = {
    id: `cmt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    userId: Number(userId),
    text: text.trim(),
    createdAt: new Date().toISOString(),
    replies: []
  };

  if (replyToCommentId) {
    const parent = post.comments.find(c => String(c.id) === String(replyToCommentId));
    if (parent) {
      if (!Array.isArray(parent.replies)) parent.replies = [];
      parent.replies.push(commentItem);
      // Notificar autor do comentário pai
      if (Number(parent.userId) !== Number(userId)) {
        createNotification(parent.userId, userId, 'comment_reply', post.id);
      }
    } else {
      post.comments.push(commentItem);
    }
  } else {
    post.comments.push(commentItem);
    // Notificar autor do post
    if (Number(post.userId) !== Number(userId)) {
      createNotification(post.userId, userId, 'post_comment', post.id);
    }
  }

  writeJson(POSTS_FILE, posts);
  return { comment: commentItem, commentsCount: post.comments.length };
}

function deletePost(postId, userId) {
  const posts = readJson(POSTS_FILE, []);
  const idx = posts.findIndex(p => String(p.id) === String(postId));
  if (idx === -1) throw new Error('Publicação não encontrada.');

  const post = posts[idx];
  const users = readJson(USERS_FILE, []);
  const u = users.find(x => Number(x.id) === Number(userId));
  const isAdmin = u && (u.role === 'admin' || u.role === 'superadmin');

  if (Number(post.userId) !== Number(userId) && !isAdmin) {
    throw new Error('Você não tem permissão para excluir esta publicação.');
  }

  posts.splice(idx, 1);
  writeJson(POSTS_FILE, posts);
  return { success: true, message: 'Publicação excluída com sucesso.' };
}

// -------------------------------------------------------------
// 6. MENSAGENS PRIVADAS (DM)
// -------------------------------------------------------------
function getConversations(userId) {
  const messages = readJson(MESSAGES_FILE, []);
  const myProfile = getOrCreateProfile(userId);
  const convMap = {};

  for (const m of messages) {
    const sId = Number(m.senderId);
    const rId = Number(m.receiverId);
    if (sId !== Number(userId) && rId !== Number(userId)) continue;

    const partnerId = sId === Number(userId) ? rId : sId;
    if (myProfile.blockedUserIds?.includes(partnerId)) continue;

    if (!convMap[partnerId]) {
      convMap[partnerId] = {
        partner: getUserBasic(partnerId),
        lastMessage: m,
        unreadCount: 0
      };
    } else {
      if (new Date(m.createdAt) > new Date(convMap[partnerId].lastMessage.createdAt)) {
        convMap[partnerId].lastMessage = m;
      }
    }

    if (rId === Number(userId) && !m.read) {
      convMap[partnerId].unreadCount += 1;
    }
  }

  return Object.values(convMap).sort((a, b) => 
    new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
  );
}

function getMessagesThread(userId, partnerId) {
  const messages = readJson(MESSAGES_FILE, []);
  let changed = false;

  const thread = messages.filter(m => {
    const sId = Number(m.senderId);
    const rId = Number(m.receiverId);
    const match = (sId === Number(userId) && rId === Number(partnerId)) ||
                  (sId === Number(partnerId) && rId === Number(userId));

    if (match && rId === Number(userId) && !m.read) {
      m.read = true;
      changed = true;
    }
    return match;
  });

  if (changed) {
    writeJson(MESSAGES_FILE, messages);
  }

  thread.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return thread;
}

function sendMessage(senderId, receiverId, { text = '', sharedMedia = null }) {
  if (!text?.trim() && !sharedMedia) {
    throw new Error('A mensagem não pode estar vazia.');
  }

  const receiverProfile = getOrCreateProfile(receiverId);
  if (receiverProfile.blockedUserIds?.includes(Number(senderId))) {
    throw new Error('Não foi possível enviar a mensagem para este usuário.');
  }

  // Verificar privacidade de mensagens
  if (receiverProfile.privacy?.messages === 'nobody') {
    throw new Error('Este usuário não aceita mensagens privadas.');
  } else if (receiverProfile.privacy?.messages === 'friends') {
    const friendships = readJson(FRIENDSHIPS_FILE, []);
    const isFriend = friendships.some(f => 
      f.status === 'accepted' &&
      ((Number(f.requesterId) === Number(senderId) && Number(f.receiverId) === Number(receiverId)) ||
       (Number(f.requesterId) === Number(receiverId) && Number(f.receiverId) === Number(senderId)))
    );
    if (!isFriend) {
      throw new Error('Este usuário só aceita mensagens de amigos.');
    }
  }

  const messages = readJson(MESSAGES_FILE, []);
  const newMsg = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    senderId: Number(senderId),
    receiverId: Number(receiverId),
    text: (text || '').trim(),
    sharedMedia: sharedMedia ? {
      id: sharedMedia.id || sharedMedia.track_id,
      title: sharedMedia.title,
      artist: sharedMedia.artist,
      album: sharedMedia.album,
      cover: sharedMedia.cover || sharedMedia.cover_url || sharedMedia.image,
      type: sharedMedia.type || 'track',
      youtube_video_id: sharedMedia.youtube_video_id || null,
      audio_url: sharedMedia.audio_url || sharedMedia.preview_url || null
    } : null,
    read: false,
    createdAt: new Date().toISOString()
  };

  messages.push(newMsg);
  writeJson(MESSAGES_FILE, messages);

  // Notificação de nova mensagem
  createNotification(receiverId, senderId, 'message', newMsg.id);

  return newMsg;
}

// -------------------------------------------------------------
// 7. NOTIFICAÇÕES
// -------------------------------------------------------------
function createNotification(userId, fromUserId, type, referenceId = null) {
  if (Number(userId) === Number(fromUserId)) return null;

  const notifications = readJson(NOTIFICATIONS_FILE, []);
  const newNotif = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    userId: Number(userId),
    fromUserId: Number(fromUserId),
    type, // 'friend_request' | 'request_accepted' | 'post_like' | 'post_comment' | 'comment_reply' | 'message'
    referenceId: referenceId ? String(referenceId) : null,
    read: false,
    createdAt: new Date().toISOString()
  };

  notifications.unshift(newNotif);
  // Limitar a 100 notificações por usuário para evitar inchaço
  if (notifications.length > 500) {
    notifications.splice(500);
  }
  writeJson(NOTIFICATIONS_FILE, notifications);
  return newNotif;
}

function getNotifications(userId) {
  const notifications = readJson(NOTIFICATIONS_FILE, []);
  const userNotifs = notifications
    .filter(n => Number(n.userId) === Number(userId))
    .map(n => ({
      ...n,
      fromUser: getUserBasic(n.fromUserId)
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = userNotifs.filter(n => !n.read).length;
  return { notifications: userNotifs, unreadCount };
}

function markNotificationAsRead(notifId, userId) {
  const notifications = readJson(NOTIFICATIONS_FILE, []);
  const n = notifications.find(x => String(x.id) === String(notifId) && Number(x.userId) === Number(userId));
  if (n) {
    n.read = true;
    writeJson(NOTIFICATIONS_FILE, notifications);
  }
  return { success: true };
}

function markAllNotificationsAsRead(userId) {
  const notifications = readJson(NOTIFICATIONS_FILE, []);
  let changed = false;
  for (const n of notifications) {
    if (Number(n.userId) === Number(userId) && !n.read) {
      n.read = true;
      changed = true;
    }
  }
  if (changed) {
    writeJson(NOTIFICATIONS_FILE, notifications);
  }
  return { success: true };
}

// -------------------------------------------------------------
// 8. BLOQUEIO DE USUÁRIO
// -------------------------------------------------------------
function blockUser(userId, targetUserId) {
  if (Number(userId) === Number(targetUserId)) {
    throw new Error('Você não pode bloquear a si mesmo.');
  }

  const profiles = readJson(PROFILES_FILE, []);
  let p = profiles.find(x => Number(x.userId) === Number(userId));
  if (!p) {
    p = getOrCreateProfile(userId);
    profiles.push(p);
  }

  if (!Array.isArray(p.blockedUserIds)) p.blockedUserIds = [];
  if (!p.blockedUserIds.includes(Number(targetUserId))) {
    p.blockedUserIds.push(Number(targetUserId));
  }

  // Romper qualquer amizade ativa ou pendente
  const friendships = readJson(FRIENDSHIPS_FILE, []);
  const filteredFriendships = friendships.filter(f => 
    !((Number(f.requesterId) === Number(userId) && Number(f.receiverId) === Number(targetUserId)) ||
      (Number(f.requesterId) === Number(targetUserId) && Number(f.receiverId) === Number(userId)))
  );
  writeJson(FRIENDSHIPS_FILE, filteredFriendships);
  writeJson(PROFILES_FILE, profiles);

  return { success: true, message: 'Usuário bloqueado com sucesso.' };
}

function unblockUser(userId, targetUserId) {
  const profiles = readJson(PROFILES_FILE, []);
  const p = profiles.find(x => Number(x.userId) === Number(userId));
  if (p && Array.isArray(p.blockedUserIds)) {
    p.blockedUserIds = p.blockedUserIds.filter(id => Number(id) !== Number(targetUserId));
    writeJson(PROFILES_FILE, profiles);
  }
  return { success: true, message: 'Usuário desbloqueado com sucesso.' };
}

module.exports = {
  getUserBasic,
  getOrCreateProfile,
  updateProfile,
  getFullUserProfile,
  getUserStats,
  updateNowPlaying,
  getNowPlayingActivity,
  getFriendsActivities,
  sendFriendRequest,
  respondFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getFriendRequests,
  getFriends,
  discoverUsers,
  getFeed,
  createPost,
  toggleLikePost,
  togglePostReaction,
  compareUsers,
  addComment,
  deletePost,
  getConversations,
  getMessagesThread,
  sendMessage,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  blockUser,
  unblockUser
};

