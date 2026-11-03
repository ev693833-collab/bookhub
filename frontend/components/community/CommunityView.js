import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Users, MessageSquare, Flame, UserPlus, UserCheck, Heart,
  Share2, Play, Music, Radio, Settings, Bell, Check, X,
  Search, Shield, Lock, Eye, EyeOff, Sparkles, Send,
  Headphones, Disc, Trash2, Clock, CheckCircle2, BarChart3,
  Award, Zap, Smile, Volume2, TrendingUp, Layers
} from 'lucide-react';
import styles from './CommunityView.module.css';
import { getSafeCover } from '../../utils/coverHelper';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const AIRBUDS_EMOJIS = ['🔥', '❤️', '🎧', '⚡', '🤯'];

export default function CommunityView({
  user,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onOpenArtist,
  onOpenAlbum
}) {
  // Abas principais: 'feed' | 'discover' | 'friends' | 'requests' | 'activity' | 'messages' | 'stats'
  const [activeTab, setActiveTab] = useState('feed');

  // Estados de dados
  const [feedPosts, setFeedPosts] = useState([]);
  const [discoverPeople, setDiscoverPeople] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [requests, setRequests] = useState({ received: [], sent: [] });
  const [friendsActivity, setFriendsActivity] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Post & Compartilhamento Airbuds
  const [postText, setPostText] = useState('');
  const [attachedMusic, setAttachedMusic] = useState(null);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // Mensagens privadas
  const [conversations, setConversations] = useState([]);
  const [activeChatPartner, setActiveChatPartner] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');

  // Modais
  const [profileModalUserId, setProfileModalUserId] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [compareData, setCompareData] = useState(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mySettings, setMySettings] = useState(null);

  // Estatísticas Pessoais
  const [myStats, setMyStats] = useState(null);

  // Busca e Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [friendsFilter, setFriendsFilter] = useState('all'); // 'all' | 'listening'

  // Toast
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getHeaders = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, []);

  // -------------------------------------------------------------
  // BUSCA DE DADOS
  // -------------------------------------------------------------
  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/community/feed`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setFeedPosts(data.posts || []);
    } catch (e) {
      console.warn('Erro ao carregar feed:', e);
    }
  }, [getHeaders]);

  const fetchFriendsActivity = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/community/activity/friends`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setFriendsActivity(data.activities || []);
    } catch (e) {
      console.warn('Erro ao carregar atividade dos amigos:', e);
    }
  }, [getHeaders]);

  const fetchDiscover = useCallback(async (q = '') => {
    try {
      const res = await fetch(`${API_URL}/api/community/discover?q=${encodeURIComponent(q)}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setDiscoverPeople(data.people || []);
    } catch (e) {
      console.warn('Erro ao carregar descobrir:', e);
    }
  }, [getHeaders]);

  const fetchFriends = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/community/friends`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setFriendsList(data.friends || []);
    } catch (e) {
      console.warn('Erro ao carregar amigos:', e);
    }
  }, [getHeaders]);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/community/friend-requests`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setRequests({ received: data.received || [], sent: data.sent || [] });
    } catch (e) {
      console.warn('Erro ao carregar solicitações:', e);
    }
  }, [getHeaders]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/community/notifications`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadNotifCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.warn('Erro ao carregar notificações:', e);
    }
  }, [getHeaders]);

  const fetchMyProfileAndStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/community/me`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setMySettings(data.profile);
        setMyStats(data.profile.stats);
      }
    } catch (e) {
      console.warn('Erro ao carregar perfil próprio:', e);
    }
  }, [getHeaders]);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/community/messages/conversations`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setConversations(data.conversations || []);
    } catch (e) {
      console.warn('Erro ao carregar conversas:', e);
    }
  }, [getHeaders]);

  const fetchMessagesThread = useCallback(async (partnerId) => {
    try {
      const res = await fetch(`${API_URL}/api/community/messages/${partnerId}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setChatMessages(data.messages || []);
        setActiveChatPartner(data.partner);
      }
    } catch (e) {
      console.warn('Erro ao carregar mensagens:', e);
    }
  }, [getHeaders]);

  // Carregar dados conforme troca de aba
  useEffect(() => {
    fetchNotifications();
    fetchMyProfileAndStats();
    fetchFriendsActivity();

    if (activeTab === 'feed') {
      fetchFeed();
    } else if (activeTab === 'discover') {
      fetchDiscover(searchQuery);
    } else if (activeTab === 'friends') {
      fetchFriends();
    } else if (activeTab === 'requests') {
      fetchRequests();
    } else if (activeTab === 'messages') {
      fetchConversations();
    }
  }, [activeTab, searchQuery, fetchFeed, fetchFriendsActivity, fetchDiscover, fetchFriends, fetchRequests, fetchNotifications, fetchMyProfileAndStats, fetchConversations]);

  // Polling em background a cada 10s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
      fetchFriendsActivity();
      if (activeTab === 'messages' && activeChatPartner) {
        fetchMessagesThread(activeChatPartner.id);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [activeTab, activeChatPartner, fetchNotifications, fetchFriendsActivity, fetchMessagesThread]);

  // -------------------------------------------------------------
  // REAÇÕES DE EMOJIS AIRBUDS (🔥, ❤️, 🎧, ⚡, 🤯)
  // -------------------------------------------------------------
  const handleEmojiReaction = async (postId, emoji) => {
    try {
      const res = await fetch(`${API_URL}/api/community/posts/${postId}/react`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ emoji })
      });
      const data = await res.json();
      if (data.success) {
        setFeedPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              reactions: data.reactions,
              userReactions: {
                ...(p.userReactions || {}),
                [emoji]: data.hasReacted
              }
            };
          }
          return p;
        }));
      }
    } catch (e) {
      console.warn('Erro ao reagir com emoji:', e);
    }
  };

  // Reação rápida em card do Ouvindo Agora
  const handleReactToNowPlaying = (friendName, emoji) => {
    showToast(`Você reagiu com ${emoji} ao som de ${friendName}!`);
  };

  // -------------------------------------------------------------
  // COMPARTILHAR O SOM ATUAL (AIRBUDS 1-CLICK SHARE)
  // -------------------------------------------------------------
  const handleShareCurrentTrack = async () => {
    const trackToShare = currentTrack || attachedMusic;
    if (!trackToShare) {
      showToast('Dê o play em qualquer música para compartilhar no Airbuds!');
      return;
    }

    setIsSubmittingPost(true);
    try {
      const res = await fetch(`${API_URL}/api/community/posts`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          type: 'airbuds_share',
          text: postText.trim() || `Ouvindo agora no DevSongs 🔥`,
          mediaItem: {
            id: trackToShare.id || trackToShare.track_id,
            title: trackToShare.title,
            artist: trackToShare.artist,
            album: trackToShare.album || '',
            cover: getSafeCover(trackToShare),
            durationSec: trackToShare.durationSec || 180,
            youtube_video_id: trackToShare.youtube_video_id || null,
            audio_url: trackToShare.audio_url || trackToShare.preview_url || null
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setPostText('');
        setAttachedMusic(null);
        showToast('Música compartilhada no Feed!');
        fetchFeed();
      } else {
        showToast(data.error || 'Erro ao compartilhar.');
      }
    } catch (e) {
      showToast('Erro ao publicar música.');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Comentários
  const [commentInputs, setCommentInputs] = useState({});
  const handleAddComment = async (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/community/posts/${postId}/comment`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.success) {
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        fetchFeed();
        showToast('Comentário enviado!');
      }
    } catch (e) {
      showToast('Erro ao comentar.');
    }
  };

  // -------------------------------------------------------------
  // AMIZADES
  // -------------------------------------------------------------
  const handleSendFriendRequest = async (receiverId) => {
    try {
      const res = await fetch(`${API_URL}/api/community/friend-requests`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ receiverId })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Solicitação enviada!');
        if (activeTab === 'discover') fetchDiscover(searchQuery);
        if (profileModalUserId) openUserProfile(profileModalUserId);
      } else {
        showToast(data.error || 'Erro ao enviar solicitação.');
      }
    } catch (e) {
      showToast('Erro ao enviar solicitação.');
    }
  };

  const handleRespondRequest = async (requestId, action) => {
    try {
      const res = await fetch(`${API_URL}/api/community/friend-requests/${requestId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        fetchRequests();
        fetchFriends();
      }
    } catch (e) {
      showToast('Erro ao processar solicitação.');
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm('Desfazer amizade com este usuário?')) return;
    try {
      const res = await fetch(`${API_URL}/api/community/friends/${friendId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        showToast('Amizade desfeita.');
        fetchFriends();
        if (profileModalUserId) openUserProfile(profileModalUserId);
      }
    } catch (e) {
      showToast('Erro ao remover amizade.');
    }
  };

  // -------------------------------------------------------------
  // PERFIL E COMPARAÇÃO MUSICAL AIRBUDS
  // -------------------------------------------------------------
  const openUserProfile = async (userId) => {
    setProfileModalUserId(userId);
    setIsLoadingProfile(true);
    try {
      const res = await fetch(`${API_URL}/api/community/profile/${userId}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setProfileData(data.profile);
      } else {
        showToast(data.error || 'Erro ao abrir perfil.');
        setProfileModalUserId(null);
      }
    } catch (e) {
      showToast('Erro ao carregar perfil.');
      setProfileModalUserId(null);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const openTasteCompare = async (targetUserId) => {
    try {
      const res = await fetch(`${API_URL}/api/community/compare/${targetUserId}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setCompareData(data.comparison);
        setIsCompareOpen(true);
      }
    } catch (e) {
      showToast('Erro ao gerar comparativo musical.');
    }
  };

  // -------------------------------------------------------------
  // MENSAGENS PRIVADAS
  // -------------------------------------------------------------
  const handleSendMessage = async () => {
    if (!chatInputText.trim() || !activeChatPartner) return;
    const text = chatInputText;
    setChatInputText('');
    try {
      const res = await fetch(`${API_URL}/api/community/messages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          receiverId: activeChatPartner.id,
          text
        })
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages(prev => [...prev, data.message]);
        fetchConversations();
      }
    } catch (e) {
      showToast('Erro ao enviar mensagem.');
    }
  };

  // -------------------------------------------------------------
  // CONFIGURAÇÕES E PRIVACIDADE
  // -------------------------------------------------------------
  const handleSaveSettings = async (settings) => {
    try {
      const res = await fetch(`${API_URL}/api/community/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        setMySettings(data.profile);
        showToast('Configurações salvas!');
        setIsSettingsOpen(false);
      }
    } catch (e) {
      showToast('Erro ao salvar configurações.');
    }
  };

  return (
    <div className={styles.communityContainer}>
      {/* Toast flutuante */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 999999,
          background: '#1db954',
          color: '#000',
          padding: '0.9rem 1.5rem',
          borderRadius: '16px',
          fontWeight: 800,
          boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem'
        }}>
          <CheckCircle2 size={22} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. HEADER DA COMUNIDADE
          ───────────────────────────────────────────────────────────── */}
      <div className={styles.communityHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIconBadge}>
            <Radio size={28} />
          </div>
          <div>
            <h1 className={styles.headerTitle}>Comunidade DevSongs</h1>
            <p className={styles.headerSubtitle}>
              A rede social onde você descobre o que seus amigos estão ouvindo em tempo real.
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          {/* Sino Notificações */}
          <button
            className={`${styles.headerBtn} ${styles.notifBtn}`}
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            title="Notificações"
          >
            <Bell size={18} />
            {unreadNotifCount > 0 && (
              <span className={styles.notifBadge}>{unreadNotifCount}</span>
            )}
          </button>

          {/* Dropdown Notificações */}
          {isNotifOpen && (
            <div className={styles.notifDropdown}>
              <div className={styles.notifHeader}>
                <span>Notificações</span>
                {unreadNotifCount > 0 && (
                  <button
                    className={styles.markAllBtn}
                    onClick={async () => {
                      await fetch(`${API_URL}/api/community/notifications/read-all`, { method: 'PUT', headers: getHeaders() });
                      setUnreadNotifCount(0);
                      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                    }}
                  >
                    Marcar todas lidas
                  </button>
                )}
              </div>
              <div className={styles.notifList}>
                {notifications.length === 0 ? (
                  <div className={styles.emptyNotifs}>Nenhuma notificação por enquanto.</div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`${styles.notifItem} ${!n.read ? styles.notifUnread : ''}`}
                      onClick={() => {
                        if (n.fromUser?.id) openUserProfile(n.fromUser.id);
                        setIsNotifOpen(false);
                      }}
                    >
                      <img src={n.fromUser?.avatar_url || 'https://ui-avatars.com/api/?name=User'} alt="" className={styles.notifAvatar} />
                      <div className={styles.notifContent}>
                        <p className={styles.notifText}>
                          <strong>{n.fromUser?.name || 'Alguém'}</strong>{' '}
                          {n.type === 'friend_request' && 'enviou uma solicitação de amizade.'}
                          {n.type === 'request_accepted' && 'aceitou sua solicitação de amizade!'}
                          {n.type === 'post_like' && 'curtiu seu som no feed.'}
                          {n.type.startsWith('reaction_') && `reagiu com ${n.type.replace('reaction_', '')} ao seu som!`}
                          {n.type === 'post_comment' && 'comentou na sua música.'}
                          {n.type === 'message' && 'enviou uma nova mensagem.'}
                        </p>
                        <span className={styles.notifTime}>
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Meu Perfil */}
          <button
            className={styles.headerBtn}
            onClick={() => user?.id && openUserProfile(user.id)}
          >
            <img
              src={mySettings?.avatar_url || user?.avatar_url || 'https://ui-avatars.com/api/?name=User'}
              alt=""
              style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
            />
            <span>Meu Perfil</span>
          </button>

          {/* Privacidade */}
          <button
            className={styles.headerBtn}
            onClick={() => setIsSettingsOpen(true)}
            title="Privacidade e Configurações"
          >
            <Settings size={18} />
            <span>Privacidade</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. NAVEGAÇÃO DE ABAS — ESTILO TUNEIN & AIRBUDS
          ───────────────────────────────────────────────────────────── */}
      <nav className={styles.communityNavTrack} aria-label="Navegação da Comunidade DevSongs">
        <div className={styles.navInnerPills}>
          <button
            type="button"
            className={`${styles.navTabItem} ${activeTab === 'feed' ? styles.navTabItemActive : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            <Flame className={styles.navTabIcon} size={17} />
            <span>Feed de Atividades</span>
          </button>

          <button
            type="button"
            className={`${styles.navTabItem} ${activeTab === 'discover' ? styles.navTabItemActive : ''}`}
            onClick={() => setActiveTab('discover')}
          >
            <Sparkles className={styles.navTabIcon} size={17} />
            <span>Descobrir Pessoas</span>
          </button>

          <button
            type="button"
            className={`${styles.navTabItem} ${activeTab === 'friends' ? styles.navTabItemActive : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            <Users className={styles.navTabIcon} size={17} />
            <span>Amigos</span>
            {friendsList.length > 0 && <span className={styles.navTabCount}>({friendsList.length})</span>}
          </button>

          <button
            type="button"
            className={`${styles.navTabItem} ${activeTab === 'requests' ? styles.navTabItemActive : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <UserPlus className={styles.navTabIcon} size={17} />
            <span>Solicitações</span>
            {requests.received.length > 0 && (
              <span className={styles.navTabBadge}>{requests.received.length}</span>
            )}
          </button>

          <button
            type="button"
            className={`${styles.navTabItem} ${activeTab === 'messages' ? styles.navTabItemActive : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            <MessageSquare className={styles.navTabIcon} size={17} />
            <span>Mensagens</span>
          </button>

          <button
            type="button"
            className={`${styles.navTabItem} ${activeTab === 'stats' ? styles.navTabItemActive : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <BarChart3 className={styles.navTabIcon} size={17} />
            <span>Estatísticas & Recap</span>
          </button>
        </div>
      </nav>

      {/* ─────────────────────────────────────────────────────────────
          3. AIRBUDS LIVE LISTENING SHELF (CAROUSEL DE AMIGOS AO VIVO)
          ───────────────────────────────────────────────────────────── */}
      <div className={styles.airbudsLiveShelf}>
        <div className={styles.shelfTopHeader}>
          <div className={styles.shelfTitleRow}>
            <span className={styles.livePulseDot} />
            <h3 className={styles.shelfTitle}>
              Ouvindo Agora no DevSongs
            </h3>
          </div>

          {currentTrack && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '0.82rem', color: '#1db954', fontWeight: 700 }}>
                ▶ Você: {currentTrack.title}
              </span>
              <button
                className={styles.attachTagBtn}
                style={{ background: '#1db954', color: '#000', borderColor: '#1db954', fontWeight: 800 }}
                onClick={handleShareCurrentTrack}
              >
                <Share2 size={13} /> Compartilhar meu som
              </button>
            </div>
          )}
        </div>

        {friendsActivity.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#888', fontSize: '0.88rem' }}>
            Nenhum amigo ouvindo música agora. Dê o play em qualquer som para aparecer aqui!
          </div>
        ) : (
          <div className={styles.liveCardsGrid}>
            {friendsActivity.slice(0, 4).map(({ friend, activity }) => {
              const track = activity.track;
              if (!track) return null;
              return (
                <div key={friend.id} className={styles.airbudsFriendCard}>
                  {/* Topo do Card: Avatar e Horário */}
                  <div className={styles.friendTopBar}>
                    <div className={styles.friendUserBadge} onClick={() => openUserProfile(friend.id)}>
                      <img src={friend.avatar_url} alt="" className={styles.friendUserAvatar} />
                      <div>
                        <span className={styles.friendNameText}>{friend.name}</span>
                        <span className={styles.friendStatusLabel}>
                          {activity.isPlaying ? (
                            <>
                              <span className={styles.livePulseDot} style={{ width: 6, height: 6 }} /> Ouvindo agora
                            </>
                          ) : (
                            activity.statusLabel || 'Recentemente'
                          )}
                        </span>
                      </div>
                    </div>

                    <button
                      className={styles.attachTagBtn}
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.74rem' }}
                      onClick={() => openTasteCompare(friend.id)}
                      title="Comparar gosto musical"
                    >
                      <Sparkles size={12} color="#1db954" /> Afinidade
                    </button>
                  </div>

                  {/* Miolo do Card: Capa + Vinil Animado + Play */}
                  <div className={styles.musicDisplayBox}>
                    <div className={styles.musicCoverWrap}>
                      <img src={getSafeCover(track)} alt="" className={styles.musicCover} />
                      {activity.isPlaying && <div className={styles.spinningVinylDisc} />}
                    </div>

                    <div className={styles.musicDetails}>
                      <h4 className={styles.trackTitle}>{track.title}</h4>
                      <p className={styles.artistTitle}>{track.artist}</p>
                    </div>

                    <button
                      className={styles.cardPlayBtn}
                      onClick={() => onPlayTrack && onPlayTrack(track)}
                      title={`Ouvir junto: ${track.title}`}
                    >
                      <Play size={16} fill="#000" color="#000" />
                    </button>
                  </div>

                  {/* Reações Rápidas do Airbuds (Emoji Dock) */}
                  <div className={styles.airbudsReactionsDock}>
                    {AIRBUDS_EMOJIS.map(em => (
                      <button
                        key={em}
                        className={styles.emojiBtn}
                        onClick={() => handleReactToNowPlaying(friend.name, em)}
                        title={`Reagir com ${em}`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. ABA: FEED DE ATIVIDADES DOS AMIGOS (AIRBUDS TIMELINE)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'feed' && (
        <div className={styles.feedLayout}>
          <div className={styles.feedMain}>
            {/* Box Compartilhar Som Atual / Post */}
            <div className={styles.airbudsShareBox}>
              <div className={styles.shareBoxHeader}>
                <img
                  src={mySettings?.avatar_url || user?.avatar_url || 'https://ui-avatars.com/api/?name=User'}
                  alt=""
                  className={styles.userAvatarSelf}
                />
                <textarea
                  className={styles.shareTextarea}
                  placeholder="Compartilhe o que achou de um som, deixe uma recomendação ou faça uma pergunta..."
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                />
              </div>

              {/* Prévia do som anexado */}
              {(attachedMusic || currentTrack) && (
                <div className={styles.nowPlayingPill}>
                  <div className={styles.nowPlayingInfo}>
                    <img
                      src={getSafeCover(attachedMusic || currentTrack)}
                      alt=""
                      className={styles.nowPlayingCover}
                    />
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: '#fff', display: 'block' }}>
                        {(attachedMusic || currentTrack).title}
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: '#aaa' }}>
                        {(attachedMusic || currentTrack).artist}
                      </span>
                    </div>
                  </div>
                  {attachedMusic && (
                    <button
                      onClick={() => setAttachedMusic(null)}
                      style={{ background: 'none', border: 'none', color: '#ff4757', cursor: 'pointer' }}
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              )}

              <div className={styles.shareBoxFooter}>
                <div className={styles.attachButtonsRow}>
                  {!attachedMusic && currentTrack && (
                    <button
                      className={styles.attachTagBtn}
                      onClick={() => setAttachedMusic(currentTrack)}
                    >
                      <Music size={14} color="#1db954" /> Anexar Som Tocando
                    </button>
                  )}
                </div>

                <button
                  className={styles.publishShareBtn}
                  disabled={isSubmittingPost || (!postText.trim() && !attachedMusic && !currentTrack)}
                  onClick={handleShareCurrentTrack}
                >
                  {isSubmittingPost ? 'Compartilhando...' : 'Compartilhar no Feed'}
                </button>
              </div>
            </div>

            {/* Lista de Atividades do Feed */}
            {feedPosts.length === 0 ? (
              <div className={styles.emptyState}>
                <Flame className={styles.emptyStateIcon} />
                <h3 style={{ fontSize: '1.2rem', color: '#bbb', margin: '0 0 0.4rem' }}>Feed sem postagens ainda</h3>
                <p style={{ fontSize: '0.9rem', color: '#777', maxWidth: 420 }}>
                  Compartilhe sua primeira música tocando agora para iniciar a conversa com a galera!
                </p>
              </div>
            ) : (
              feedPosts.map(post => {
                const reactions = post.reactions || {};
                const userReactions = post.userReactions || {};
                return (
                  <div key={post.id} className={styles.feedPostCard}>
                    {/* Cabeçalho do Post */}
                    <div className={styles.postHeader}>
                      <div className={styles.postAuthorProfile} onClick={() => openUserProfile(post.author.id)}>
                        <img src={post.author.avatar_url} alt="" className={styles.postAuthorAvatar} />
                        <div>
                          <span className={styles.postAuthorName}>{post.author.name}</span>
                          <span className={styles.postAuthorHandle}>{post.author.username}</span>
                        </div>
                      </div>
                      <span className={styles.postTimeAgo}>
                        {new Date(post.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                      </span>
                    </div>

                    {/* Texto / Legenda */}
                    {post.text && <p className={styles.postCaption}>{post.text}</p>}

                    {/* Embed de Música Playable */}
                    {post.mediaItem && (
                      <div className={styles.postMusicEmbed}>
                        <img src={getSafeCover(post.mediaItem)} alt="" className={styles.postMusicCover} />
                        <div className={styles.postMusicMeta}>
                          <h4 className={styles.postMusicTitle}>{post.mediaItem.title}</h4>
                          <p className={styles.postMusicArtist}>
                            {post.mediaItem.artist} • {post.mediaItem.album || 'Single'}
                          </p>
                        </div>
                        <button
                          className={styles.cardPlayBtn}
                          onClick={() => onPlayTrack && onPlayTrack(post.mediaItem)}
                          title={`Tocar ${post.mediaItem.title}`}
                        >
                          <Play size={18} fill="#000" color="#000" />
                        </button>
                      </div>
                    )}

                    {/* Barra de Reações com os 5 Emojis do Airbuds */}
                    <div className={styles.postActionsBar}>
                      <div className={styles.reactionGroup}>
                        {AIRBUDS_EMOJIS.map(em => {
                          const count = reactions[em] || 0;
                          const hasReacted = !!userReactions[em];
                          return (
                            <button
                              key={em}
                              className={`${styles.emojiBtn} ${hasReacted ? styles.emojiBtnActive : ''}`}
                              onClick={() => handleEmojiReaction(post.id, em)}
                              title={`Reagir com ${em}`}
                            >
                              <span>{em}</span>
                              {count > 0 && <span className={styles.emojiCount}>{count}</span>}
                            </button>
                          );
                        })}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                          className={styles.actionBtnSubtle}
                          onClick={() => {
                            const input = document.getElementById(`comment-input-${post.id}`);
                            if (input) input.focus();
                          }}
                        >
                          <MessageSquare size={16} />
                          <span>{post.commentsCount || 0}</span>
                        </button>

                        <button
                          className={styles.actionBtnSubtle}
                          onClick={() => {
                            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                              navigator.clipboard.writeText(window.location.href);
                              showToast('Link da atividade copiado!');
                            }
                          }}
                        >
                          <Share2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Comentários */}
                    <div className={styles.commentsContainer}>
                      {post.comments && post.comments.map(c => (
                        <div key={c.id} className={styles.singleComment}>
                          <img src={c.user.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                          <div className={styles.commentBubble}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <strong style={{ fontSize: '0.85rem', color: '#fff' }}>{c.user.name}</strong>
                              <span style={{ fontSize: '0.72rem', color: '#777' }}>
                                {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p style={{ margin: '0.2rem 0 0', fontSize: '0.88rem', color: '#ccc' }}>{c.text}</p>
                          </div>
                        </div>
                      ))}

                      <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem' }}>
                        <input
                          id={`comment-input-${post.id}`}
                          type="text"
                          placeholder="Escreva um comentário sobre esse som..."
                          style={{
                            flex: 1,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '20px',
                            padding: '0.55rem 1rem',
                            color: '#fff',
                            fontSize: '0.88rem',
                            outline: 'none'
                          }}
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddComment(post.id);
                          }}
                        />
                        <button
                          className={styles.publishShareBtn}
                          style={{ padding: '0.55rem 1.1rem', fontSize: '0.82rem' }}
                          onClick={() => handleAddComment(post.id)}
                        >
                          Enviar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar Direita: Widgets Airbuds */}
          <div className={styles.feedSidebar}>
            {/* Widget 1: Comparativo com Amigo do Momento */}
            <div className={styles.sidebarCard}>
              <h4 className={styles.sidebarCardTitle}>
                <Sparkles size={18} color="#1db954" />
                <span>Sintonia Musical</span>
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#aaa', margin: '0 0 1rem', lineHeight: 1.45 }}>
                Descubra quem compartilha o mesmo DNA musical que você na comunidade.
              </p>
              {discoverPeople.length > 0 && (
                <div
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px',
                    padding: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => openTasteCompare(discoverPeople[0].id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <img src={discoverPeople[0].avatar_url} alt="" style={{ width: 38, height: 38, borderRadius: '50%' }} />
                    <div>
                      <strong style={{ fontSize: '0.88rem', color: '#fff', display: 'block' }}>{discoverPeople[0].name}</strong>
                      <span style={{ fontSize: '0.76rem', color: '#1db954', fontWeight: 700 }}>
                        {discoverPeople[0].compatibility}% Afinidade
                      </span>
                    </div>
                  </div>
                  <Sparkles size={16} color="#1db954" />
                </div>
              )}
            </div>

            {/* Widget 2: Comunidade DevSongs Vibe */}
            <div className={styles.sidebarCard}>
              <h4 className={styles.sidebarCardTitle}>
                <Zap size={18} color="#ffd700" />
                <span>Vibe da Semana</span>
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#ccc', lineHeight: 1.5, margin: 0 }}>
                Ouvintes conectados ao Trap Urbano, Rap Nacional, MPB e Lo-Fi de foco para desenvolvedores!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. ABA: DESCOBRIR PESSOAS (MATCH MUSICAL AIRBUDS)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'discover' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 850, margin: 0 }}>Descobrir Novos Amigos</h2>
              <p style={{ fontSize: '0.86rem', color: '#888', margin: '0.2rem 0 0' }}>
                Algoritmo do Airbuds baseado nos artistas e faixas reais que você mais escuta.
              </p>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              background: '#181818', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px',
              padding: '0.6rem 1.25rem', width: 300
            }}>
              <Search size={16} color="#888" />
              <input
                type="text"
                placeholder="Buscar por nome ou @..."
                style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize: '0.88rem' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.matchGrid}>
            {discoverPeople.length === 0 ? (
              <div className={styles.emptyState} style={{ gridColumn: '1 / -1' }}>
                <Search className={styles.emptyStateIcon} />
                <h3 style={{ color: '#bbb' }}>Nenhum usuário encontrado</h3>
              </div>
            ) : (
              discoverPeople.map(p => (
                <div key={p.id} className={styles.matchCard}>
                  {/* Badge % Afinidade */}
                  <div className={styles.matchBadgeCorner}>
                    <Sparkles size={12} />
                    <span>{p.compatibility}% Match</span>
                  </div>

                  <img src={p.avatar_url} alt="" className={styles.matchAvatar} />
                  <h3 className={styles.matchName}>{p.name}</h3>
                  <span className={styles.matchHandle}>{p.username}</span>
                  <p className={styles.matchBio}>{p.bio || 'Amante de música no DevSongs 🎧'}</p>

                  {/* Tags de Sintonia */}
                  <div className={styles.tasteTags}>
                    {p.commonArtists && p.commonArtists.length > 0 ? (
                      p.commonArtists.slice(0, 2).map((a, i) => (
                        <span key={i} className={styles.tasteTag}>❤️ Curte {a}</span>
                      ))
                    ) : p.topArtists && p.topArtists.length > 0 ? (
                      p.topArtists.slice(0, 2).map((a, i) => (
                        <span key={i} className={styles.tasteTag}>🎧 {a}</span>
                      ))
                    ) : null}
                  </div>

                  <div className={styles.matchActions}>
                    <button
                      className={styles.attachTagBtn}
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => openTasteCompare(p.id)}
                    >
                      Comparar
                    </button>

                    {p.relationStatus === 'friends' ? (
                      <button className={styles.publishShareBtn} style={{ flex: 1, background: '#333', color: '#fff' }}>
                        <UserCheck size={14} /> Amigos
                      </button>
                    ) : p.relationStatus === 'pending_sent' ? (
                      <button className={styles.attachTagBtn} style={{ flex: 1, justifyContent: 'center', opacity: 0.7 }} disabled>
                        Enviada
                      </button>
                    ) : (
                      <button
                        className={styles.publishShareBtn}
                        style={{ flex: 1 }}
                        onClick={() => handleSendFriendRequest(p.id)}
                      >
                        <UserPlus size={14} /> Adicionar
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. ABA: AMIGOS
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'friends' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 850, margin: 0 }}>
              Meus Amigos ({friendsList.length})
            </h2>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className={`${styles.attachTagBtn} ${friendsFilter === 'all' ? styles.tabBtnActive : ''}`}
                onClick={() => setFriendsFilter('all')}
              >
                Todos
              </button>
              <button
                className={`${styles.attachTagBtn} ${friendsFilter === 'listening' ? styles.tabBtnActive : ''}`}
                onClick={() => setFriendsFilter('listening')}
              >
                <Radio size={14} color="#1db954" /> Ouvindo Agora
              </button>
            </div>
          </div>

          {friendsList.length === 0 ? (
            <div className={styles.emptyState}>
              <Users className={styles.emptyStateIcon} />
              <h3 style={{ color: '#bbb' }}>Sua lista de amigos está vazia</h3>
              <p style={{ color: '#777', maxWidth: 400 }}>Conecte-se com pessoas para acompanhar o que elas escutam!</p>
              <button className={styles.publishShareBtn} onClick={() => setActiveTab('discover')}>
                Descobrir Pessoas
              </button>
            </div>
          ) : (
            <div className={styles.matchGrid}>
              {friendsList
                .filter(f => friendsFilter === 'all' || (f.activity && f.activity.track))
                .map(f => (
                  <div key={f.friendId} className={styles.matchCard}>
                    <img src={f.avatar_url} alt="" className={styles.matchAvatar} />
                    <h3 className={styles.matchName}>{f.name}</h3>
                    <span className={styles.matchHandle}>{f.username}</span>

                    {f.activity?.track ? (
                      <div style={{
                        background: 'rgba(29, 185, 84, 0.1)',
                        border: '1px solid rgba(29, 185, 84, 0.3)',
                        borderRadius: '12px',
                        padding: '0.55rem 0.85rem',
                        fontSize: '0.8rem',
                        color: '#1db954',
                        margin: '0.5rem 0 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}>
                        <span className={styles.livePulseDot} style={{ width: 6, height: 6 }} />
                        <span>Ouvindo: {f.activity.track.title}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: '#777', margin: '0.5rem 0 1rem' }}>Offline</span>
                    )}

                    <div className={styles.matchActions}>
                      <button
                        className={styles.attachTagBtn}
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => openUserProfile(f.friendId)}
                      >
                        Perfil
                      </button>
                      <button
                        className={styles.publishShareBtn}
                        style={{ flex: 1 }}
                        onClick={() => {
                          setActiveTab('messages');
                          fetchMessagesThread(f.friendId);
                        }}
                      >
                        Mensagem
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. ABA: SOLICITAÇÕES
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'requests' && (
        <div style={{ maxWidth: 720 }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 850, marginBottom: '1.25rem' }}>
            Solicitações de Amizade
          </h2>

          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1db954', margin: '1.5rem 0 0.85rem' }}>
            Recebidas ({requests.received.length})
          </h3>

          {requests.received.length === 0 ? (
            <p style={{ color: '#777', fontSize: '0.88rem' }}>Nenhuma solicitação pendente.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {requests.received.map(req => (
                <div key={req.id} className={styles.feedPostCard} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }} onClick={() => openUserProfile(req.user.id)}>
                    <img src={req.user.avatar_url} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <strong style={{ fontSize: '0.96rem', color: '#fff', display: 'block' }}>{req.user.name}</strong>
                      <span style={{ fontSize: '0.8rem', color: '#888' }}>{req.user.username}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.55rem' }}>
                    <button
                      className={styles.publishShareBtn}
                      style={{ padding: '0.5rem 1.1rem', fontSize: '0.84rem' }}
                      onClick={() => handleRespondRequest(req.id, 'accept')}
                    >
                      Aceitar
                    </button>
                    <button
                      className={styles.attachTagBtn}
                      style={{ padding: '0.5rem 1.1rem', fontSize: '0.84rem' }}
                      onClick={() => handleRespondRequest(req.id, 'reject')}
                    >
                      Recusar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#aaa', margin: '2rem 0 0.85rem' }}>
            Enviadas ({requests.sent.length})
          </h3>

          {requests.sent.length === 0 ? (
            <p style={{ color: '#777', fontSize: '0.88rem' }}>Nenhuma solicitação enviada aguardando resposta.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {requests.sent.map(req => (
                <div key={req.id} className={styles.feedPostCard} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <img src={req.user.avatar_url} alt="" style={{ width: 44, height: 44, borderRadius: '50%' }} />
                    <div>
                      <strong style={{ fontSize: '0.96rem', color: '#fff', display: 'block' }}>{req.user.name}</strong>
                      <span style={{ fontSize: '0.78rem', color: '#888' }}>Aguardando resposta...</span>
                    </div>
                  </div>
                  <button
                    className={styles.attachTagBtn}
                    onClick={async () => {
                      await fetch(`${API_URL}/api/community/friend-requests/${req.id}`, { method: 'DELETE', headers: getHeaders() });
                      fetchRequests();
                      showToast('Solicitação cancelada.');
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          8. ABA: MENSAGENS PRIVADAS (DM COM MÚSICA)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'messages' && (
        <div style={{
          display: 'grid', gridTemplateColumns: '320px 1fr', background: '#181818',
          border: '1px solid rgba(255,255,255,0.09)', borderRadius: '20px', height: '620px', overflow: 'hidden'
        }}>
          {/* Lista de Conversas */}
          <div style={{ borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 800, fontSize: '1.1rem' }}>
              Mensagens
            </div>
            {conversations.length === 0 ? (
              <p style={{ padding: '2rem 1rem', textAlign: 'center', color: '#777', fontSize: '0.86rem' }}>
                Nenhuma conversa ainda. Abra o perfil de um amigo para bater um papo!
              </p>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.partner.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.95rem 1.25rem',
                    borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer',
                    background: activeChatPartner?.id === conv.partner.id ? 'rgba(29, 185, 84, 0.12)' : 'transparent'
                  }}
                  onClick={() => fetchMessagesThread(conv.partner.id)}
                >
                  <img src={conv.partner.avatar_url} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <strong style={{ fontSize: '0.92rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {conv.partner.name}
                      </strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.lastMessage.text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Painel do Chat */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {activeChatPartner ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src={activeChatPartner.avatar_url} alt="" style={{ width: 42, height: 42, borderRadius: '50%' }} />
                    <div>
                      <strong style={{ fontSize: '0.96rem', display: 'block' }}>{activeChatPartner.name}</strong>
                      <span style={{ fontSize: '0.78rem', color: '#888' }}>{activeChatPartner.username}</span>
                    </div>
                  </div>
                  <button className={styles.attachTagBtn} onClick={() => openUserProfile(activeChatPartner.id)}>
                    Ver Perfil
                  </button>
                </div>

                <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {chatMessages.map(msg => {
                    const isMine = Number(msg.senderId) === Number(user?.id);
                    return (
                      <div
                        key={msg.id}
                        style={{
                          maxWidth: '70%',
                          padding: '0.8rem 1.1rem',
                          borderRadius: '16px',
                          alignSelf: isMine ? 'flex-end' : 'flex-start',
                          background: isMine ? '#1db954' : 'rgba(255,255,255,0.08)',
                          color: isMine ? '#000' : '#fff',
                          fontWeight: 500,
                          fontSize: '0.92rem'
                        }}
                      >
                        {msg.text}
                        {msg.sharedMedia && (
                          <div style={{
                            marginTop: '0.65rem', padding: '0.6rem',
                            background: isMine ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.06)',
                            borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.65rem'
                          }}>
                            <img src={getSafeCover(msg.sharedMedia)} alt="" style={{ width: 38, height: 38, borderRadius: '6px' }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <strong style={{ fontSize: '0.84rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {msg.sharedMedia.title}
                              </strong>
                              <span style={{ fontSize: '0.76rem', opacity: 0.8 }}>{msg.sharedMedia.artist}</span>
                            </div>
                            <button
                              onClick={() => onPlayTrack && onPlayTrack(msg.sharedMedia)}
                              style={{ width: 30, height: 30, borderRadius: '50%', background: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                              <Play size={14} fill="#000" color="#000" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <input
                    type="text"
                    placeholder="Digite sua mensagem..."
                    style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '0.7rem 1.25rem', color: '#fff', outline: 'none' }}
                    value={chatInputText}
                    onChange={(e) => setChatInputText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                  />
                  <button className={styles.publishShareBtn} style={{ padding: '0.7rem 1.2rem' }} onClick={handleSendMessage}>
                    <Send size={16} />
                  </button>
                </div>
              </>
            ) : (
              <div style={{ margin: 'auto', textAlign: 'center', color: '#777' }}>
                <MessageSquare size={44} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                <h3>Selecione uma conversa</h3>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          9. ABA: ESTATÍSTICAS & AIRBUDS RECAP
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'stats' && (
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 850, marginBottom: '1.5rem' }}>
            Seu Airbuds Musical Recap
          </h2>

          {/* Cards KPI */}
          <div className={styles.statsHeroGrid}>
            <div className={styles.statsKpiCard}>
              <div className={styles.kpiValue}>{myStats?.totalPlays || 0}</div>
              <div className={styles.kpiLabel}>Reproduções Totais</div>
            </div>
            <div className={styles.statsKpiCard}>
              <div className={styles.kpiValue}>{myStats?.totalHours || 0}h</div>
              <div className={styles.kpiLabel}>Horas de Som</div>
            </div>
            <div className={styles.statsKpiCard}>
              <div className={styles.kpiValue}>{myStats?.topArtists?.length || 0}</div>
              <div className={styles.kpiLabel}>Artistas Explorados</div>
            </div>
            <div className={styles.statsKpiCard}>
              <div className={styles.kpiValue}>{friendsList.length}</div>
              <div className={styles.kpiLabel}>Conexões Musicais</div>
            </div>
          </div>

          {/* Pódio dos Top 3 Artistas (Airbuds Podium) */}
          {myStats?.topArtists && myStats.topArtists.length >= 3 && (
            <div className={styles.podiumContainer}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, textAlign: 'center', color: '#ffd700' }}>
                🏆 Pódio dos Seus Artistas Mais Ouvidos
              </h3>

              <div className={styles.podiumRow}>
                {/* 2º Lugar */}
                <div className={styles.podiumSpot}>
                  <img src={myStats.topArtists[1].cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4'} alt="" className={styles.podiumAvatar} style={{ borderColor: '#c0c0c0' }} />
                  <strong style={{ fontSize: '0.94rem', color: '#fff' }}>{myStats.topArtists[1].artist}</strong>
                  <span style={{ fontSize: '0.78rem', color: '#aaa' }}>{myStats.topArtists[1].plays} plays</span>
                  <div className={styles.podiumPillar} style={{ height: 110, background: '#333', color: '#c0c0c0' }}>
                    2º
                  </div>
                </div>

                {/* 1º Lugar */}
                <div className={styles.podiumSpot}>
                  <img src={myStats.topArtists[0].cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4'} alt="" className={styles.podiumAvatar} style={{ borderColor: '#ffd700', width: 90, height: 90 }} />
                  <strong style={{ fontSize: '1.05rem', color: '#ffd700' }}>{myStats.topArtists[0].artist}</strong>
                  <span style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 700 }}>{myStats.topArtists[0].plays} plays</span>
                  <div className={styles.podiumPillar} style={{ height: 150, background: '#1db954', color: '#000' }}>
                    1º
                  </div>
                </div>

                {/* 3º Lugar */}
                <div className={styles.podiumSpot}>
                  <img src={myStats.topArtists[2].cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4'} alt="" className={styles.podiumAvatar} style={{ borderColor: '#cd7f32' }} />
                  <strong style={{ fontSize: '0.94rem', color: '#fff' }}>{myStats.topArtists[2].artist}</strong>
                  <span style={{ fontSize: '0.78rem', color: '#aaa' }}>{myStats.topArtists[2].plays} plays</span>
                  <div className={styles.podiumPillar} style={{ height: 80, background: '#252525', color: '#cd7f32' }}>
                    3º
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Músicas Mais Tocadas */}
          {myStats?.topTracks && myStats.topTracks.length > 0 && (
            <div className={styles.feedPostCard}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1rem', color: '#fff' }}>
                Músicas Mais Tocadas (Em Loop)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {myStats.topTracks.map((t, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <span style={{ fontWeight: 800, color: '#1db954', fontSize: '0.92rem', width: 22 }}>#{i + 1}</span>
                      <img src={getSafeCover(t)} alt="" style={{ width: 42, height: 42, borderRadius: '8px' }} />
                      <div>
                        <strong style={{ fontSize: '0.92rem', color: '#fff', display: 'block' }}>{t.title}</strong>
                        <span style={{ fontSize: '0.78rem', color: '#888' }}>{t.artist} • {t.plays} reproduções</span>
                      </div>
                    </div>

                    <button
                      className={styles.cardPlayBtn}
                      onClick={() => onPlayTrack && onPlayTrack(t)}
                      style={{ width: 34, height: 34 }}
                    >
                      <Play size={14} fill="#000" color="#000" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: PERFIL DO USUÁRIO
          ───────────────────────────────────────────────────────────── */}
      {profileModalUserId && (
        <div className={styles.modalOverlay} onClick={() => setProfileModalUserId(null)}>
          <div style={{
            background: '#181818', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px',
            width: 680, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeModalBtn} onClick={() => setProfileModalUserId(null)}>
              <X size={20} />
            </button>

            {isLoadingProfile || !profileData ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: '#888' }}>Carregando perfil...</div>
            ) : (
              <div>
                <div style={{ height: 130, background: 'linear-gradient(135deg, #1db954 0%, #0d5427 100%)', position: 'relative' }}>
                  <img
                    src={profileData.avatar_url}
                    alt=""
                    style={{
                      width: 90, height: 90, borderRadius: '50%', objectFit: 'cover',
                      border: '4px solid #181818', position: 'absolute', bottom: -35, left: 24, boxShadow: '0 6px 18px rgba(0,0,0,0.5)'
                    }}
                  />
                </div>

                <div style={{ padding: '3.25rem 1.5rem 1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.45rem', fontWeight: 850, margin: 0 }}>{profileData.name}</h2>
                      <span style={{ fontSize: '0.85rem', color: '#888' }}>{profileData.username}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {profileData.friendshipStatus !== 'self' && (
                        <button
                          className={styles.attachTagBtn}
                          onClick={() => {
                            setProfileModalUserId(null);
                            openTasteCompare(profileData.id);
                          }}
                        >
                          <Sparkles size={14} color="#1db954" /> Comparar Gosto
                        </button>
                      )}

                      {profileData.friendshipStatus === 'self' ? (
                        <button className={styles.attachTagBtn} onClick={() => setIsSettingsOpen(true)}>
                          Editar Perfil
                        </button>
                      ) : profileData.friendshipStatus === 'friends' ? (
                        <button
                          className={styles.publishShareBtn}
                          onClick={() => {
                            setProfileModalUserId(null);
                            setActiveTab('messages');
                            fetchMessagesThread(profileData.id);
                          }}
                        >
                          Mensagem
                        </button>
                      ) : (
                        <button className={styles.publishShareBtn} onClick={() => handleSendFriendRequest(profileData.id)}>
                          <UserPlus size={14} /> Adicionar
                        </button>
                      )}
                    </div>
                  </div>

                  <p style={{ fontSize: '0.92rem', color: '#ccc', margin: '0.85rem 0 1.25rem', lineHeight: 1.5 }}>
                    {profileData.bio || 'Membro do DevSongs 🎧'}
                  </p>

                  {/* KPIs */}
                  <div className={styles.statsHeroGrid} style={{ marginBottom: '1.5rem' }}>
                    <div className={styles.statsKpiCard}>
                      <div className={styles.kpiValue} style={{ fontSize: '1.4rem' }}>{profileData.friendsCount || 0}</div>
                      <div className={styles.kpiLabel}>Amigos</div>
                    </div>
                    <div className={styles.statsKpiCard}>
                      <div className={styles.kpiValue} style={{ fontSize: '1.4rem' }}>{profileData.postsCount || 0}</div>
                      <div className={styles.kpiLabel}>Posts</div>
                    </div>
                    <div className={styles.statsKpiCard}>
                      <div className={styles.kpiValue} style={{ fontSize: '1.4rem' }}>{profileData.stats?.totalPlays || 0}</div>
                      <div className={styles.kpiLabel}>Plays</div>
                    </div>
                    <div className={styles.statsKpiCard}>
                      <div className={styles.kpiValue} style={{ fontSize: '1.4rem' }}>{profileData.stats?.totalHours || 0}h</div>
                      <div className={styles.kpiLabel}>Horas</div>
                    </div>
                  </div>

                  {/* Top Artistas do Perfil */}
                  {profileData.stats?.topArtists && profileData.stats.topArtists.length > 0 && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1db954', margin: '0 0 0.65rem' }}>
                        Artistas Favoritos
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                        {profileData.stats.topArtists.map((a, i) => (
                          <span
                            key={i}
                            className={styles.attachTagBtn}
                            onClick={() => onOpenArtist && onOpenArtist(a.artist)}
                          >
                            #{i + 1} {a.artist} ({a.plays}x)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: COMPARATIVO MUSICAL AIRBUDS (VERSUS TASTE MATCH)
          ───────────────────────────────────────────────────────────── */}
      {isCompareOpen && compareData && (
        <div className={styles.modalOverlay} onClick={() => setIsCompareOpen(false)}>
          <div className={styles.compareModalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeModalBtn} onClick={() => setIsCompareOpen(false)}>
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 850, textAlign: 'center', margin: '0 0 0.5rem' }}>
              Sintonia Musical Airbuds
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#888', textAlign: 'center', margin: 0 }}>
              {compareData.vibeDescription}
            </p>

            <div className={styles.versusRow}>
              <div className={styles.versusUser}>
                <img src={compareData.user1.avatar_url} alt="" className={styles.versusAvatar} />
                <strong style={{ fontSize: '0.95rem' }}>Você</strong>
              </div>

              <div className={styles.versusScoreBadge}>
                {compareData.compatibilityScore}%
              </div>

              <div className={styles.versusUser}>
                <img src={compareData.user2.avatar_url} alt="" className={styles.versusAvatar} />
                <strong style={{ fontSize: '0.95rem' }}>{compareData.user2.name}</strong>
              </div>
            </div>

            {compareData.commonArtists && compareData.commonArtists.length > 0 && (
              <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
                <h4 style={{ fontSize: '0.92rem', color: '#1db954', margin: '0 0 0.5rem' }}>
                  Artistas em Comum
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.45rem' }}>
                  {compareData.commonArtists.map((art, i) => (
                    <span key={i} className={styles.tasteTag}>❤️ {art}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button className={styles.publishShareBtn} onClick={() => setIsCompareOpen(false)}>
                Fechar Comparativo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: PRIVACIDADE & CONFIGURAÇÕES
          ───────────────────────────────────────────────────────────── */}
      {isSettingsOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsSettingsOpen(false)}>
          <div style={{
            background: '#181818', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px',
            width: 540, maxWidth: '95vw', padding: '1.75rem', position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeModalBtn} onClick={() => setIsSettingsOpen(false)}>
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 850, margin: '0 0 1.25rem' }}>
              Privacidade & Configurações da Comunidade
            </h2>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.82rem', color: '#888', display: 'block', marginBottom: '0.35rem' }}>Nome de Usuário (@)</label>
              <input
                type="text"
                className={styles.shareTextarea}
                style={{ minHeight: 'auto', padding: '0.65rem' }}
                defaultValue={mySettings?.username?.replace('@', '') || ''}
                id="airbuds-username-input"
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.82rem', color: '#888', display: 'block', marginBottom: '0.35rem' }}>Biografia</label>
              <textarea
                className={styles.shareTextarea}
                defaultValue={mySettings?.bio || ''}
                id="airbuds-bio-input"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.9rem' }}>Ocultar música que estou ouvindo</span>
              <input
                type="checkbox"
                defaultChecked={mySettings?.privacy?.hideCurrentListening}
                id="airbuds-hide-listening"
                style={{ width: 20, height: 20, accentColor: '#1db954' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.9rem' }}>Quem pode me enviar solicitações</span>
              <select
                defaultValue={mySettings?.privacy?.friendRequests || 'everyone'}
                id="airbuds-friend-reqs"
                style={{ background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '8px', padding: '0.4rem 0.6rem' }}
              >
                <option value="everyone">Todos</option>
                <option value="none">Ninguém</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 0' }}>
              <span style={{ fontSize: '0.9rem' }}>Quem pode me enviar mensagens</span>
              <select
                defaultValue={mySettings?.privacy?.messages || 'everyone'}
                id="airbuds-msgs"
                style={{ background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '8px', padding: '0.4rem 0.6rem' }}
              >
                <option value="everyone">Todos</option>
                <option value="friends">Apenas Amigos</option>
                <option value="nobody">Ninguém</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className={styles.attachTagBtn} onClick={() => setIsSettingsOpen(false)}>Cancelar</button>
              <button
                className={styles.publishShareBtn}
                onClick={() => {
                  const bio = document.getElementById('airbuds-bio-input')?.value;
                  const username = document.getElementById('airbuds-username-input')?.value;
                  const hideCurrentListening = document.getElementById('airbuds-hide-listening')?.checked;
                  const friendRequests = document.getElementById('airbuds-friend-reqs')?.value;
                  const messages = document.getElementById('airbuds-msgs')?.value;

                  handleSaveSettings({
                    bio,
                    username,
                    privacy: {
                      hideCurrentListening,
                      friendRequests,
                      messages
                    }
                  });
                }}
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
