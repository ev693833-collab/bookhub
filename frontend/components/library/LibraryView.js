import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  ListMusic, Music, Disc, Mic2, Plus, Play, Pause, Trash2, Edit3,
  Share2, Globe, Link2, Lock, ArrowLeft, ArrowUp, ArrowDown,
  Search, Check, AlertCircle, Clock, CheckCircle2, ChevronRight, X,
  Camera, Upload, Image as ImageIcon
} from 'lucide-react';
import styles from './LibraryView.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function LibraryView({
  token,
  user,
  onPlayTrack,
  onPlayQueue,
  currentTrack,
  isPlaying,
  initialTab = 'playlists',
  initialPlaylistId = null,
  onExploreCatalog = null
}) {
  const [activeCategory, setActiveCategory] = useState(initialTab); // 'playlists' | 'tracks' | 'albums' | 'artists'
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [playlists, setPlaylists] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [catalogTracks, setCatalogTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);

  // Loading & error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Detail views (selected item)
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null);

  // Modals state
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [playlistForm, setPlaylistForm] = useState({ id: null, name: '', description: '', cover_url: '', privacy: 'private' });
  const [showPhotoUrlInput, setShowPhotoUrlInput] = useState(false);
  const modalPhotoInputRef = useRef(null);
  const detailCoverInputRef = useRef(null);

  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [trackForm, setTrackForm] = useState({ id: null, title: '', artist: '', album: '', genre: 'Variado', cover_url: '', preview_url: '', duration_sec: 210 });

  const [albumModalOpen, setAlbumModalOpen] = useState(false);
  const [albumForm, setAlbumForm] = useState({ id: null, title: '', artist_name: '', artist_id: '', cover_url: '', release_date: '', genre: 'Variado' });

  const [artistModalOpen, setArtistModalOpen] = useState(false);
  const [artistForm, setArtistForm] = useState({ id: null, name: '', bio: '', avatar_url: '', genre: 'Variado' });

  const [addToPlaylistModalOpen, setAddToPlaylistModalOpen] = useState(false);
  const [trackToAddToPlaylist, setTrackToAddToPlaylist] = useState(null);

  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ open: false, type: '', id: null, title: '' });
  const [expiredModalTrack, setExpiredModalTrack] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Disparar notificação temporária
  const showNotice = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Helper de headers autenticados
  const authHeaders = useMemo(() => {
    const h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }, [token]);

  // Carregar dados de playlists
  const fetchPlaylists = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/library/playlists`, { headers: authHeaders });
      const data = await res.json();
      if (res.ok) {
        setPlaylists(data.playlists || []);
      }
    } catch (err) {
      console.error('Erro ao buscar playlists:', err);
    }
  }, [token, authHeaders]);

  // Carregar detalhes de playlist por ID
  const fetchPlaylistDetails = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/library/playlists/${id}`, { headers: authHeaders });
      const data = await res.json();
      if (res.ok) {
        setSelectedPlaylist(data.playlist);
      } else {
        showNotice(data.error || 'Não foi possível carregar a playlist.', 'error');
      }
    } catch (err) {
      console.error('Erro ao buscar detalhes da playlist:', err);
    }
  }, [authHeaders]);

  // Carregar músicas adquiridas (compras e aluguéis) do usuário autenticado
  const fetchTracks = useCallback(async () => {
    if (!token) {
      setTracks([]);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/library/my-tracks`, { headers: authHeaders });
      const data = await res.json();
      if (res.ok && data.tracks) {
        setTracks(data.tracks);
      } else {
        // Fallback secundário para /api/companies/my-purchases
        const fallbackRes = await fetch(`${API_URL}/api/companies/my-purchases`, { headers: authHeaders });
        const fallbackData = await fallbackRes.json();
        if (fallbackRes.ok && fallbackData.purchases) {
          setTracks(fallbackData.purchases);
        } else {
          setTracks([]);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar faixas da biblioteca:', err);
      setTracks([]);
    }
  }, [token, authHeaders]);

  // Carregar catálogo geral de faixas para apoio a listas e seleção
  const fetchCatalogTracks = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/library/tracks`);
      const data = await res.json();
      if (res.ok) {
        setCatalogTracks(data.tracks || []);
      }
    } catch (err) {
      console.error('Erro ao buscar faixas do catálogo:', err);
    }
  }, []);

  // Carregar álbuns
  const fetchAlbums = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/library/albums`);
      const data = await res.json();
      if (res.ok) {
        setAlbums(data.albums || []);
      }
    } catch (err) {
      console.error('Erro ao buscar álbuns:', err);
    }
  }, []);

  // Carregar detalhes do álbum
  const fetchAlbumDetails = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/library/albums/${id}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedAlbum(data.album);
      }
    } catch (err) {
      console.error('Erro ao buscar detalhes do álbum:', err);
    }
  }, []);

  // Carregar artistas
  const fetchArtists = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/library/artists`);
      const data = await res.json();
      if (res.ok) {
        setArtists(data.artists || []);
      }
    } catch (err) {
      console.error('Erro ao buscar artistas:', err);
    }
  }, []);

  // Carregar detalhes do artista
  const fetchArtistDetails = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/library/artists/${id}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedArtist(data.artist);
      }
    } catch (err) {
      console.error('Erro ao buscar detalhes do artista:', err);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchPlaylists(),
      fetchTracks(),
      fetchCatalogTracks(),
      fetchAlbums(),
      fetchArtists()
    ]).finally(() => setLoading(false));
  }, [fetchPlaylists, fetchTracks, fetchCatalogTracks, fetchAlbums, fetchArtists]);

  // Se passou ID de playlist inicial na URL
  useEffect(() => {
    if (initialPlaylistId) {
      fetchPlaylistDetails(initialPlaylistId);
    }
  }, [initialPlaylistId, fetchPlaylistDetails]);

  // Formatação de duração
  const formatDuration = (sec) => {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Helper canônico para extrair ID numérico de faixa com segurança (ct-X, dbTrackId, track_id, id)
  const getCleanTrackId = (item) => {
    if (!item) return null;
    if (typeof item === 'number') return item;
    if (typeof item === 'string') {
      const parsed = Number(item.replace('ct-', ''));
      return isNaN(parsed) ? null : parsed;
    }
    const raw = item.dbTrackId ?? item.db_track_id ?? item.track_id ?? item.trackId ?? item.id;
    if (raw === undefined || raw === null) return null;
    const val = Number(String(raw).replace('ct-', ''));
    return isNaN(val) ? null : val;
  };

  // =========================================================================
  // HANDLERS DE PLAYLIST & FOTO DE CAPA ESTILO SPOTIFY
  // =========================================================================

  const compressImageFile = (file) => {
    return new Promise((resolve, reject) => {
      if (!file || !file.type || !file.type.startsWith('image/')) {
        return reject(new Error('Formato inválido. Escolha uma imagem (JPG, PNG ou WEBP).'));
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const maxDim = 600;
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          const canvas = document.createElement('canvas');
          const targetDim = Math.min(minSide, maxDim);
          canvas.width = targetDim;
          canvas.height = targetDim;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetDim, targetDim);
          resolve(canvas.toDataURL('image/jpeg', 0.88));
        };
        img.onerror = () => reject(new Error('Falha ao processar arquivo de imagem.'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Falha na leitura do arquivo.'));
      reader.readAsDataURL(file);
    });
  };

  const handleModalPhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file);
      setPlaylistForm(prev => ({ ...prev, cover_url: dataUrl }));
      showNotice('Foto selecionada com sucesso!');
    } catch (err) {
      showNotice(err.message || 'Erro ao carregar imagem.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleDirectDetailCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPlaylist) return;

    try {
      const dataUrl = await compressImageFile(file);
      const res = await fetch(`${API_URL}/api/library/playlists/${selectedPlaylist.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          name: selectedPlaylist.name,
          cover_url: dataUrl
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showNotice(data.error || 'Erro ao atualizar foto da playlist.', 'error');
        return;
      }
      showNotice('Foto da playlist atualizada com sucesso!');
      setSelectedPlaylist(data.playlist);
      fetchPlaylists();
    } catch (err) {
      showNotice(err.message || 'Erro ao processar imagem.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const renderPlaylistCover = (pl, isDetail = false) => {
    if (!pl) return null;

    // 1. Capa personalizada enviada pelo usuário
    if (pl.cover_url && pl.cover_url.trim()) {
      return (
        <div className={styles.coverSingle}>
          <img
            src={pl.cover_url}
            alt={pl.name || 'Playlist'}
            className={isDetail ? styles.detailCoverImg : styles.cardImage}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png';
            }}
          />
        </div>
      );
    }

    // 2. Coletar capas das faixas da playlist (modo automático)
    let covers = pl.track_covers || [];
    if ((!covers || covers.length === 0) && pl.tracks && Array.isArray(pl.tracks)) {
      const distinct = [];
      for (const t of pl.tracks) {
        const c = t.cover_url || t.cover;
        if (c && !distinct.includes(c)) {
          distinct.push(c);
          if (distinct.length === 4) break;
        }
      }
      covers = distinct;
    }

    // 2A. Estilo Spotify: Se tiver 4 ou mais capas, renderiza colagem 2x2
    if (covers.length >= 4) {
      return (
        <div className={styles.spotifyCollage}>
          {covers.slice(0, 4).map((c, idx) => (
            <div key={idx} className={styles.collageQuadrant}>
              <img src={c} alt="" />
            </div>
          ))}
        </div>
      );
    }

    // 2B. De 1 a 3 faixas: Exibe a capa da 1ª faixa preenchendo o quadro
    if (covers.length >= 1) {
      return (
        <div className={styles.coverSingle}>
          <img
            src={covers[0]}
            alt={pl.name || 'Playlist'}
            className={isDetail ? styles.detailCoverImg : styles.cardImage}
          />
        </div>
      );
    }

    // 2C. 0 faixas e sem foto: Estilo Spotify (fundo escuro #282828 com nota musical cinza)
    return (
      <div className={styles.coverEmptyPlaceholder} title={pl.name || 'Playlist'}>
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.coverEmptyNoteIcon}
        >
          <path
            d="M27.5 17H46.5V43"
            stroke="currentColor"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M27.5 17V43"
            stroke="currentColor"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="22"
            cy="43"
            r="5.5"
            stroke="currentColor"
            strokeWidth="3.6"
          />
          <circle
            cx="41"
            cy="43"
            r="5.5"
            stroke="currentColor"
            strokeWidth="3.6"
          />
        </svg>
      </div>
    );
  };

  const handleOpenCreatePlaylist = () => {
    setPlaylistForm({ id: null, name: '', description: '', cover_url: '', privacy: 'private' });
    setShowPhotoUrlInput(false);
    setPlaylistModalOpen(true);
  };

  const handleOpenEditPlaylist = (pl) => {
    setPlaylistForm({
      id: pl.id,
      name: pl.name,
      description: pl.description || '',
      cover_url: pl.cover_url || '',
      privacy: pl.privacy || 'private'
    });
    setShowPhotoUrlInput(Boolean(pl.cover_url && !pl.cover_url.startsWith('data:')));
    setPlaylistModalOpen(true);
  };

  const handleSavePlaylist = async (e) => {
    e.preventDefault();
    if (!playlistForm.name.trim()) {
      showNotice('Informe o nome da playlist.', 'error');
      return;
    }

    try {
      const isEdit = Boolean(playlistForm.id);
      const url = isEdit
        ? `${API_URL}/api/library/playlists/${playlistForm.id}`
        : `${API_URL}/api/library/playlists`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(playlistForm)
      });
      const data = await res.json();

      if (!res.ok) {
        showNotice(data.error || 'Erro ao salvar playlist.', 'error');
        return;
      }

      showNotice(data.message || 'Playlist salva com sucesso!');
      setPlaylistModalOpen(false);
      fetchPlaylists();

      if (selectedPlaylist && selectedPlaylist.id === playlistForm.id) {
        setSelectedPlaylist(data.playlist);
      }
    } catch (err) {
      showNotice('Falha na comunicação com o servidor.', 'error');
    }
  };

  const handleDeletePlaylist = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/library/playlists/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await res.json();

      if (!res.ok) {
        showNotice(data.error || 'Erro ao excluir playlist.', 'error');
        return;
      }

      showNotice('Playlist excluída com sucesso.');
      setSelectedPlaylist(null);
      fetchPlaylists();
      setDeleteConfirmModal({ open: false, type: '', id: null, title: '' });
    } catch (err) {
      showNotice('Falha ao excluir playlist.', 'error');
    }
  };

  const handleAddTrackToPlaylist = async (playlistId, trackOrId) => {
    try {
      const cleanTrackId = getCleanTrackId(trackOrId);
      if (!cleanTrackId) {
        showNotice('ID da música inválido.', 'error');
        return;
      }
      const res = await fetch(`${API_URL}/api/library/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ track_id: cleanTrackId })
      });
      const data = await res.json();

      if (!res.ok) {
        showNotice(data.error || 'Erro ao adicionar música na playlist.', 'error');
        return;
      }

      showNotice('Música adicionada à playlist!');
      setAddToPlaylistModalOpen(false);
      setTrackToAddToPlaylist(null);
      fetchPlaylists();

      if (selectedPlaylist && selectedPlaylist.id === Number(playlistId)) {
        setSelectedPlaylist(data.playlist);
      }
    } catch (err) {
      showNotice('Falha ao adicionar música.', 'error');
    }
  };

  const handleRemoveTrackFromPlaylist = async (playlistId, trackId) => {
    try {
      const cleanTrackId = typeof trackId === 'string' ? trackId.replace('ct-', '') : trackId;
      const res = await fetch(`${API_URL}/api/library/playlists/${playlistId}/tracks/${cleanTrackId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await res.json();

      if (!res.ok) {
        showNotice(data.error || 'Erro ao remover música da playlist.', 'error');
        return;
      }

      showNotice('Música removida da playlist.');
      if (selectedPlaylist && selectedPlaylist.id === Number(playlistId)) {
        setSelectedPlaylist(data.playlist);
      }
      fetchPlaylists();
    } catch (err) {
      showNotice('Falha ao remover música.', 'error');
    }
  };

  const handleMoveTrackOrder = async (playlistId, trackId, direction) => {
    if (!selectedPlaylist || !selectedPlaylist.tracks) return;
    const currentTracks = [...selectedPlaylist.tracks];
    const index = currentTracks.findIndex(t => t.id === trackId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentTracks.length) return;

    // Swap
    const temp = currentTracks[index];
    currentTracks[index] = currentTracks[newIndex];
    currentTracks[newIndex] = temp;

    const orderedIds = currentTracks.map(t => t.id);

    try {
      const res = await fetch(`${API_URL}/api/library/playlists/${playlistId}/reorder`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ track_ids: orderedIds })
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedPlaylist(data.playlist);
      } else {
        showNotice(data.error || 'Erro ao reordenar playlist.', 'error');
      }
    } catch (err) {
      showNotice('Falha ao salvar nova ordem das faixas.', 'error');
    }
  };

  const handleSharePlaylist = (playlist) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/biblioteca?playlist=${playlist.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showNotice('Link da playlist copiado para a área de transferência!');
      }).catch(() => {
        showNotice(`Link: ${shareUrl}`);
      });
    } else {
      showNotice(`Link: ${shareUrl}`);
    }
  };

  // Helper para verificar status de acesso e aluguel de uma faixa
  const getTrackAccessInfo = useCallback((trackOrId) => {
    if (!trackOrId) {
      return { isExpired: false, canPlay: true, type: 'buy', rent_price: 1.90, sale_price: 4.90 };
    }
    const rawId = typeof trackOrId === 'object' ? (trackOrId.dbTrackId || trackOrId.id) : trackOrId;
    const cleanId = Number(String(rawId).replace('ct-', ''));
    const userTrack = tracks.find(t => Number(String(t.dbTrackId || t.id).replace('ct-', '')) === cleanId);

    if (userTrack) {
      return {
        isExpired: Boolean(userTrack.isExpired),
        canPlay: Boolean(userTrack.canPlay),
        type: userTrack.type,
        rent_price: userTrack.rent_price || 1.90,
        sale_price: userTrack.sale_price || 4.90,
        remainingDays: userTrack.remainingDays,
        expiresAt: userTrack.expiresAt,
        userTrack
      };
    }

    if (typeof trackOrId === 'object' && trackOrId.isExpired !== undefined) {
      return {
        isExpired: Boolean(trackOrId.isExpired),
        canPlay: Boolean(trackOrId.canPlay),
        type: trackOrId.type || 'buy',
        rent_price: trackOrId.rent_price || 1.90,
        sale_price: trackOrId.sale_price || 4.90,
        remainingDays: trackOrId.remainingDays,
        expiresAt: trackOrId.expiresAt,
        userTrack: trackOrId
      };
    }

    return {
      isExpired: false,
      canPlay: true,
      type: 'buy',
      rent_price: 1.90,
      sale_price: 4.90,
      userTrack: null
    };
  }, [tracks]);

  // Handler para renovação de aluguel (+30 dias)
  const handleRenewRent = async (track) => {
    if (!token) {
      showNotice('Faça login para renovar o aluguel.', 'error');
      return;
    }
    const trackId = track.dbTrackId || Number(String(track.id).replace('ct-', ''));
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/library/tracks/${trackId}/renew-rent`, {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok) {
        showNotice(data.error || 'Erro ao renovar o aluguel.', 'error');
        return;
      }
      showNotice(data.message || 'Aluguel renovado com sucesso por mais 30 dias!');
      setExpiredModalTrack(null);
      await fetchTracks();
      if (selectedPlaylist) {
        await fetchPlaylistDetails(selectedPlaylist.id);
      }
      if (selectedAlbum) {
        await fetchAlbumDetails(selectedAlbum.id);
      }
    } catch (err) {
      console.error('Erro ao renovar aluguel:', err);
      showNotice('Erro ao conectar ao servidor para renovar aluguel.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler para compra definitiva (upgrade permanente)
  const handleBuyPermanent = async (track) => {
    if (!token) {
      showNotice('Faça login para comprar a música.', 'error');
      return;
    }
    const trackId = track.dbTrackId || Number(String(track.id).replace('ct-', ''));
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/library/tracks/${trackId}/buy-permanent`, {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok) {
        showNotice(data.error || 'Erro ao comprar a música.', 'error');
        return;
      }
      showNotice(data.message || 'Música comprada definitivamente! Desbloqueada para sempre.');
      setExpiredModalTrack(null);
      await fetchTracks();
      if (selectedPlaylist) {
        await fetchPlaylistDetails(selectedPlaylist.id);
      }
      if (selectedAlbum) {
        await fetchAlbumDetails(selectedAlbum.id);
      }
    } catch (err) {
      console.error('Erro ao comprar música definitivamente:', err);
      showNotice('Erro ao conectar ao servidor para comprar a música.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================================
  // HANDLERS DE ARTISTAS
  // =========================================================================

  const handleSaveArtist = async (e) => {
    e.preventDefault();
    if (!artistForm.name.trim()) {
      showNotice('Informe o nome do artista.', 'error');
      return;
    }
    try {
      const isEdit = Boolean(artistForm.id);
      const url = isEdit
        ? `${API_URL}/api/library/artists/${artistForm.id}`
        : `${API_URL}/api/library/artists`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(artistForm)
      });
      const data = await res.json();

      if (!res.ok) {
        showNotice(data.error || 'Erro ao salvar artista.', 'error');
        return;
      }

      showNotice(data.message || 'Artista salvo com sucesso!');
      setArtistModalOpen(false);
      fetchArtists();
      if (selectedArtist && selectedArtist.id === artistForm.id) {
        setSelectedArtist(data.artist);
      }
    } catch (err) {
      showNotice('Falha ao salvar artista.', 'error');
    }
  };

  const handleDeleteArtist = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/library/artists/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await res.json();

      if (!res.ok) {
        showNotice(data.error || 'Não foi possível excluir o artista.', 'error');
        return;
      }

      showNotice('Artista excluído com sucesso.');
      setSelectedArtist(null);
      fetchArtists();
      setDeleteConfirmModal({ open: false, type: '', id: null, title: '' });
    } catch (err) {
      showNotice('Falha ao excluir artista.', 'error');
    }
  };

  // =========================================================================
  // HANDLERS DE ÁLBUNS
  // =========================================================================

  const handleSaveAlbum = async (e) => {
    e.preventDefault();
    if (!albumForm.title.trim() || !albumForm.artist_name.trim()) {
      showNotice('Preencha o título e o nome do artista do álbum.', 'error');
      return;
    }
    try {
      const isEdit = Boolean(albumForm.id);
      const url = isEdit
        ? `${API_URL}/api/library/albums/${albumForm.id}`
        : `${API_URL}/api/library/albums`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(albumForm)
      });
      const data = await res.json();

      if (!res.ok) {
        showNotice(data.error || 'Erro ao salvar álbum.', 'error');
        return;
      }

      showNotice(data.message || 'Álbum salvo com sucesso!');
      setAlbumModalOpen(false);
      fetchAlbums();
      if (selectedAlbum && selectedAlbum.id === albumForm.id) {
        setSelectedAlbum(data.album);
      }
    } catch (err) {
      showNotice('Falha ao salvar álbum.', 'error');
    }
  };

  const handleDeleteAlbum = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/library/albums/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await res.json();

      if (!res.ok) {
        showNotice(data.error || 'Não foi possível excluir o álbum.', 'error');
        return;
      }

      showNotice('Álbum excluído com sucesso.');
      setSelectedAlbum(null);
      fetchAlbums();
      setDeleteConfirmModal({ open: false, type: '', id: null, title: '' });
    } catch (err) {
      showNotice('Falha ao excluir álbum.', 'error');
    }
  };

  // =========================================================================
  // HANDLERS DE MÚSICAS / FAIXAS
  // =========================================================================

  const handleSaveTrack = async (e) => {
    e.preventDefault();
    if (!trackForm.title.trim() || !trackForm.artist.trim()) {
      showNotice('Preencha título e artista da música.', 'error');
      return;
    }
    try {
      const isEdit = Boolean(trackForm.id);
      const url = isEdit
        ? `${API_URL}/api/library/tracks/${trackForm.id}`
        : `${API_URL}/api/library/tracks`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(trackForm)
      });
      const data = await res.json();

      if (!res.ok) {
        showNotice(data.error || 'Erro ao salvar música.', 'error');
        return;
      }

      showNotice(data.message || 'Música salva com sucesso!');
      setTrackModalOpen(false);
      fetchTracks();
    } catch (err) {
      showNotice('Falha ao salvar música.', 'error');
    }
  };

  const handleDeleteTrack = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/library/tracks/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await res.json();

      if (!res.ok) {
        showNotice(data.error || 'Erro ao remover música.', 'error');
        return;
      }

      showNotice(data.message || 'Música removida com sucesso.');
      fetchTracks();
      setDeleteConfirmModal({ open: false, type: '', id: null, title: '' });
    } catch (err) {
      showNotice('Falha ao remover música.', 'error');
    }
  };

  // =========================================================================
  // FILTRAGEM RÁPIDA
  // =========================================================================

  const filteredPlaylists = useMemo(() => {
    if (!searchQuery.trim()) return playlists;
    const q = searchQuery.toLowerCase().trim();
    return playlists.filter(p => (p.name || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
  }, [playlists, searchQuery]);

  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return tracks;
    const q = searchQuery.toLowerCase().trim();
    return tracks.filter(t => (t.title || '').toLowerCase().includes(q) || (t.artist || '').toLowerCase().includes(q) || (t.album || '').toLowerCase().includes(q));
  }, [tracks, searchQuery]);

  const filteredAlbums = useMemo(() => {
    if (!searchQuery.trim()) return albums;
    const q = searchQuery.toLowerCase().trim();
    return albums.filter(a => (a.title || '').toLowerCase().includes(q) || (a.artist_name || '').toLowerCase().includes(q));
  }, [albums, searchQuery]);

  const filteredArtists = useMemo(() => {
    if (!searchQuery.trim()) return artists;
    const q = searchQuery.toLowerCase().trim();
    return artists.filter(a => (a.name || '').toLowerCase().includes(q) || (a.genre || '').toLowerCase().includes(q));
  }, [artists, searchQuery]);

  // Ícone e descrição de privacidade
  const renderPrivacyBadge = (privacy) => {
    if (privacy === 'public') {
      return (
        <span className={`${styles.privacyBadge} ${styles.privacyPublic}`} title="Pública — qualquer usuário pode visualizar">
          <Globe size={11} /> Pública
        </span>
      );
    }
    if (privacy === 'unlisted') {
      return (
        <span className={`${styles.privacyBadge} ${styles.privacyUnlisted}`} title="Não listada — visível somente para quem possui o link">
          <Link2 size={11} /> Não listada
        </span>
      );
    }
    return (
      <span className={`${styles.privacyBadge} ${styles.privacyPrivate}`} title="Particular — visível apenas para você">
        <Lock size={11} /> Particular
      </span>
    );
  };

  // Seletor de privacidade no formulário
  const renderPrivacySelector = (currentValue, onChange) => {
    const options = [
      {
        value: 'public',
        name: 'Pública',
        desc: 'Qualquer pessoa pode pesquisar e visualizar esta playlist.',
        icon: <Globe size={18} />
      },
      {
        value: 'unlisted',
        name: 'Não listada',
        desc: 'Qualquer pessoa com o link direto pode visualizar.',
        icon: <Link2 size={18} />
      },
      {
        value: 'private',
        name: 'Particular',
        desc: 'Somente você tem acesso e pode gerenciar esta playlist.',
        icon: <Lock size={18} />
      }
    ];

    return (
      <div className={styles.privacySelector}>
        <span className={styles.formLabel}>Visibilidade e Privacidade</span>
        {options.map((opt) => {
          const isSelected = currentValue === opt.value;
          return (
            <div
              key={opt.value}
              className={`${styles.privacyOption} ${isSelected ? styles.privacyOptionSelected : ''}`}
              onClick={() => onChange(opt.value)}
              role="button"
              tabIndex={0}
            >
              <div className={styles.privacyIconWrapper}>
                {opt.icon}
              </div>
              <div className={styles.privacyText}>
                <span className={styles.privacyName}>{opt.name}</span>
                <span className={styles.privacyDesc}>{opt.desc}</span>
              </div>
              {isSelected && <Check size={18} style={{ color: '#3b82f6', marginTop: 8 }} />}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.container}>

      {/* Notificação / Feedback de Operações */}
      {feedback && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999,
          background: feedback.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(37, 99, 235, 0.95)',
          color: '#ffffff',
          padding: '0.75rem 1.25rem',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.9rem',
          fontWeight: 500
        }}>
          {feedback.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* HEADER DA BIBLIOTECA */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>
            <ListMusic className={styles.titleIcon} size={32} />
            Biblioteca Musical
          </h1>
        </div>

        {/* CHIPS DE CATEGORIAS (FOTO YOUTUBE MUSIC) */}
        <div className={styles.chipsRow}>
          <button
            className={`${styles.chipBtn} ${activeCategory === 'playlists' ? styles.chipBtnActive : ''}`}
            onClick={() => { setActiveCategory('playlists'); setSelectedPlaylist(null); setSelectedAlbum(null); setSelectedArtist(null); }}
          >
            <ListMusic size={16} /> Playlists ({playlists.length})
          </button>
          <button
            className={`${styles.chipBtn} ${activeCategory === 'tracks' ? styles.chipBtnActive : ''}`}
            onClick={() => { setActiveCategory('tracks'); setSelectedPlaylist(null); setSelectedAlbum(null); setSelectedArtist(null); }}
          >
            <Music size={16} /> Músicas ({tracks.length})
          </button>
          <button
            className={`${styles.chipBtn} ${activeCategory === 'albums' ? styles.chipBtnActive : ''}`}
            onClick={() => { setActiveCategory('albums'); setSelectedPlaylist(null); setSelectedAlbum(null); setSelectedArtist(null); }}
          >
            <Disc size={16} /> Álbuns ({albums.length})
          </button>
          <button
            className={`${styles.chipBtn} ${activeCategory === 'artists' ? styles.chipBtnActive : ''}`}
            onClick={() => { setActiveCategory('artists'); setSelectedPlaylist(null); setSelectedAlbum(null); setSelectedArtist(null); }}
          >
            <Mic2 size={16} /> Artistas ({artists.length})
          </button>
        </div>
      </div>

      {/* ESTADO DE CARREGAMENTO */}
      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>Carregando sua biblioteca...</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. VISÃO DETALHADA DE PLAYLIST */}
      {/* ========================================================================= */}
      {!loading && selectedPlaylist && (
        <div>
          <button className={styles.backBtn} onClick={() => setSelectedPlaylist(null)}>
            <ArrowLeft size={16} /> Voltar para todas as playlists
          </button>

          <div className={styles.detailHeader}>
            <div
              className={styles.detailCoverWrapper}
              onClick={() => {
                if (Number(selectedPlaylist.user_id) === Number(user?.id)) {
                  detailCoverInputRef.current?.click();
                }
              }}
              title={Number(selectedPlaylist.user_id) === Number(user?.id) ? "Clique para alterar a foto da playlist" : ""}
            >
              {renderPlaylistCover(selectedPlaylist, true)}
              {Number(selectedPlaylist.user_id) === Number(user?.id) && (
                <div className={styles.coverEditOverlay}>
                  <Camera size={28} />
                  <span>Alterar foto</span>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={detailCoverInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleDirectDetailCoverChange}
            />
            <div className={styles.detailInfo}>
              <span className={styles.detailPretitle}>Playlist</span>
              <h2 className={styles.detailTitle}>{selectedPlaylist.name}</h2>
              {selectedPlaylist.description && (
                <p className={styles.detailDesc}>{selectedPlaylist.description}</p>
              )}
              <div className={styles.detailStats}>
                {renderPrivacyBadge(selectedPlaylist.privacy)}
                <span>•</span>
                <span><strong>{selectedPlaylist.track_count || selectedPlaylist.tracks?.length || 0}</strong> faixas</span>
                <span>•</span>
                <span>Duração: <strong>{formatDuration(selectedPlaylist.total_duration_sec)}</strong></span>
              </div>

              <div className={styles.detailActionRow}>
                {selectedPlaylist.tracks && selectedPlaylist.tracks.length > 0 && (
                  <button
                    className={styles.playBigBtn}
                    onClick={() => {
                      const playlistTracksWithAccess = selectedPlaylist.tracks.map(t => ({
                        ...t,
                        ...getTrackAccessInfo(t)
                      }));
                      const playable = playlistTracksWithAccess.filter(t => !t.isExpired && t.canPlay !== false);
                      if (playable.length === 0) {
                        showNotice('Todas as músicas desta playlist possuem aluguel expirado. Renove o acesso para ouvir.', 'error');
                        return;
                      }
                      onPlayQueue && onPlayQueue(playlistTracksWithAccess, 0);
                    }}
                  >
                    <Play size={18} fill="currentColor" /> Reproduzir Playlist
                  </button>
                )}

                <button className={styles.secondaryBtn} onClick={() => handleSharePlaylist(selectedPlaylist)}>
                  <Share2 size={16} /> Compartilhar
                </button>

                {Number(selectedPlaylist.user_id) === Number(user?.id) && (
                  <>
                    <button className={styles.secondaryBtn} onClick={() => handleOpenEditPlaylist(selectedPlaylist)}>
                      <Edit3 size={16} /> Editar
                    </button>
                    <button
                      className={styles.secondaryBtn}
                      style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                      onClick={() => setDeleteConfirmModal({ open: true, type: 'playlist', id: selectedPlaylist.id, title: selectedPlaylist.name })}
                    >
                      <Trash2 size={16} /> Excluir
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Músicas da Playlist */}
          <div className={styles.actionBar}>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Faixas da Playlist</h3>
            {Number(selectedPlaylist.user_id) === Number(user?.id) && (
              <button
                className={styles.primaryActionBtn}
                onClick={() => { setAddToPlaylistModalOpen(true); setTrackToAddToPlaylist(null); }}
              >
                <Plus size={16} /> Adicionar Música
              </button>
            )}
          </div>

          {selectedPlaylist.tracks && selectedPlaylist.tracks.length > 0 ? (
            <table className={styles.trackTable}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Título</th>
                  <th>Álbum</th>
                  <th>Duração</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {selectedPlaylist.tracks.map((t, idx) => {
                  const access = getTrackAccessInfo(t);
                  const isExpired = access.isExpired;
                  return (
                    <tr
                      key={t.playlist_track_id || t.id}
                      className={`${styles.trackRow} ${isExpired ? styles.trackRowExpired : ''}`}
                      onClick={() => isExpired && setExpiredModalTrack({ ...t, ...access })}
                      style={{ cursor: isExpired ? 'pointer' : 'default' }}
                    >
                      <td className={styles.trackIndexCol}>{t.position || idx + 1}</td>
                      <td className={styles.trackCell}>
                        <div className={styles.trackTitleCell}>
                          <Image
                            unoptimized
                            src={t.cover_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                            alt={t.title}
                            width={42}
                            height={42}
                            className={styles.trackThumb}
                          />
                          <div className={styles.trackMeta}>
                            <span className={styles.trackName}>{t.title}</span>
                            <span className={styles.trackArtist}>
                              {t.artist}
                              {isExpired && (
                                <span style={{ marginLeft: 6, color: '#f87171', fontSize: '0.72rem', fontWeight: 600 }}>
                                  • Aluguel Expirado
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className={styles.trackCell}>{t.album || 'Single'}</td>
                      <td className={styles.trackCell}>{formatDuration(t.duration_sec)}</td>
                      <td className={styles.trackCell}>
                        <div className={styles.trackActions}>
                          {isExpired ? (
                            <button
                              className={styles.lockIconBtn}
                              title="Aluguel expirado - Clique para renovar ou comprar"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpiredModalTrack({ ...t, ...access });
                              }}
                            >
                              <Lock size={15} />
                            </button>
                          ) : (
                            <button
                              className={styles.iconBtn}
                              title="Reproduzir"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlayTrack && onPlayTrack(t);
                              }}
                            >
                              <Play size={16} fill="currentColor" />
                            </button>
                          )}

                        {Number(selectedPlaylist.user_id) === Number(user?.id) && (
                          <>
                            <button
                              className={styles.iconBtn}
                              title="Subir posição"
                              disabled={idx === 0}
                              onClick={() => handleMoveTrackOrder(selectedPlaylist.id, t.id, 'up')}
                            >
                              <ArrowUp size={15} />
                            </button>
                            <button
                              className={styles.iconBtn}
                              title="Descer posição"
                              disabled={idx === selectedPlaylist.tracks.length - 1}
                              onClick={() => handleMoveTrackOrder(selectedPlaylist.id, t.id, 'down')}
                            >
                              <ArrowDown size={15} />
                            </button>
                            <button
                              className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                              title="Remover da playlist"
                              onClick={() => handleRemoveTrackFromPlaylist(selectedPlaylist.id, t.id)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}><Music size={28} /></div>
              <h4 className={styles.emptyTitle}>Esta playlist está vazia</h4>
              <p className={styles.emptyDesc}>Adicione músicas do acervo para começar a ouvir.</p>
              {Number(selectedPlaylist.user_id) === Number(user?.id) && (
                <button
                  className={styles.primaryActionBtn}
                  onClick={() => { setAddToPlaylistModalOpen(true); setTrackToAddToPlaylist(null); }}
                >
                  <Plus size={16} /> Adicionar primeira música
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VISÃO DETALHADA DE ÁLBUM */}
      {/* ========================================================================= */}
      {!loading && selectedAlbum && !selectedPlaylist && (
        <div>
          <button className={styles.backBtn} onClick={() => setSelectedAlbum(null)}>
            <ArrowLeft size={16} /> Voltar para todos os álbuns
          </button>

          <div className={styles.detailHeader}>
            <Image
              unoptimized
              src={selectedAlbum.cover_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
              alt={selectedAlbum.title}
              width={220}
              height={220}
              className={styles.detailCover}
            />
            <div className={styles.detailInfo}>
              <span className={styles.detailPretitle}>Álbum • {selectedAlbum.genre || 'Música'}</span>
              <h2 className={styles.detailTitle}>{selectedAlbum.title}</h2>
              <p className={styles.detailDesc}>Por <strong>{selectedAlbum.artist_name}</strong></p>
              <div className={styles.detailStats}>
                <span>Lançamento: <strong>{selectedAlbum.release_date || 'Recente'}</strong></span>
                <span>•</span>
                <span><strong>{selectedAlbum.tracks?.length || 0}</strong> faixas</span>
                <span>•</span>
                <span>Duração: <strong>{formatDuration(selectedAlbum.total_duration_sec)}</strong></span>
              </div>

              <div className={styles.detailActionRow}>
                {selectedAlbum.tracks && selectedAlbum.tracks.length > 0 && (
                  <button
                    className={styles.playBigBtn}
                    onClick={() => onPlayQueue && onPlayQueue(selectedAlbum.tracks, 0)}
                  >
                    <Play size={18} fill="currentColor" /> Reproduzir Álbum
                  </button>
                )}
                <button
                  className={styles.secondaryBtn}
                  onClick={() => {
                    setAlbumForm({
                      id: selectedAlbum.id,
                      title: selectedAlbum.title,
                      artist_name: selectedAlbum.artist_name,
                      artist_id: selectedAlbum.artist_id || '',
                      cover_url: selectedAlbum.cover_url || '',
                      release_date: selectedAlbum.release_date || '',
                      genre: selectedAlbum.genre || 'Variado'
                    });
                    setAlbumModalOpen(true);
                  }}
                >
                  <Edit3 size={16} /> Editar Álbum
                </button>
                <button
                  className={styles.secondaryBtn}
                  style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                  onClick={() => setDeleteConfirmModal({ open: true, type: 'album', id: selectedAlbum.id, title: selectedAlbum.title })}
                >
                  <Trash2 size={16} /> Excluir Álbum
                </button>
              </div>
            </div>
          </div>

          <h3 style={{ margin: '1.5rem 0 1rem', fontSize: '1.2rem' }}>Faixas do Álbum</h3>
          {selectedAlbum.tracks && selectedAlbum.tracks.length > 0 ? (
            <table className={styles.trackTable}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Título</th>
                  <th>Artista</th>
                  <th>Duração</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {selectedAlbum.tracks.map((t, idx) => {
                  const access = getTrackAccessInfo(t);
                  const isExpired = access.isExpired;
                  return (
                    <tr
                      key={t.id}
                      className={`${styles.trackRow} ${isExpired ? styles.trackRowExpired : ''}`}
                      onClick={() => isExpired && setExpiredModalTrack({ ...t, ...access })}
                      style={{ cursor: isExpired ? 'pointer' : 'default' }}
                    >
                      <td className={styles.trackIndexCol}>{idx + 1}</td>
                      <td className={styles.trackCell}>
                        <div className={styles.trackTitleCell}>
                          <Image
                            unoptimized
                            src={t.cover_url || selectedAlbum.cover_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                            alt={t.title}
                            width={42}
                            height={42}
                            className={styles.trackThumb}
                          />
                          <div className={styles.trackMeta}>
                            <span className={styles.trackName}>{t.title}</span>
                            <span className={styles.trackArtist}>
                              {t.artist}
                              {isExpired && (
                                <span style={{ marginLeft: 6, color: '#f87171', fontSize: '0.72rem', fontWeight: 600 }}>
                                  • Aluguel Expirado
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className={styles.trackCell}>{t.artist}</td>
                      <td className={styles.trackCell}>{formatDuration(t.duration_sec)}</td>
                      <td className={styles.trackCell}>
                        <div className={styles.trackActions}>
                          {isExpired ? (
                            <button
                              className={styles.lockIconBtn}
                              title="Aluguel expirado - Clique para renovar ou comprar"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpiredModalTrack({ ...t, ...access });
                              }}
                            >
                              <Lock size={15} />
                            </button>
                          ) : (
                            <button
                              className={styles.iconBtn}
                              title="Reproduzir"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlayTrack && onPlayTrack(t);
                              }}
                            >
                              <Play size={16} fill="currentColor" />
                            </button>
                          )}
                          <button
                            className={styles.iconBtn}
                            title="Adicionar à playlist"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTrackToAddToPlaylist(t);
                              setAddToPlaylistModalOpen(true);
                            }}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}><Disc size={28} /></div>
              <h4 className={styles.emptyTitle}>Nenhuma faixa cadastrada neste álbum</h4>
              <p className={styles.emptyDesc}>Adicione músicas vinculadas a este álbum pelo gerenciador de faixas.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VISÃO DETALHADA DE ARTISTA */}
      {/* ========================================================================= */}
      {!loading && selectedArtist && !selectedPlaylist && !selectedAlbum && (
        <div>
          <button className={styles.backBtn} onClick={() => setSelectedArtist(null)}>
            <ArrowLeft size={16} /> Voltar para todos os artistas
          </button>

          <div className={styles.detailHeader}>
            <Image
              unoptimized
              src={selectedArtist.avatar_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
              alt={selectedArtist.name}
              width={200}
              height={200}
              className={`${styles.detailCover} ${styles.detailCoverCircle}`}
            />
            <div className={styles.detailInfo}>
              <span className={styles.detailPretitle}>Artista • {selectedArtist.genre || 'Gênero musical'}</span>
              <h2 className={styles.detailTitle}>{selectedArtist.name}</h2>
              {selectedArtist.bio && <p className={styles.detailDesc}>{selectedArtist.bio}</p>}
              <div className={styles.detailStats}>
                <span><strong>{selectedArtist.tracks?.length || 0}</strong> músicas</span>
                <span>•</span>
                <span><strong>{selectedArtist.albums?.length || 0}</strong> álbuns</span>
              </div>

              <div className={styles.detailActionRow}>
                {selectedArtist.tracks && selectedArtist.tracks.length > 0 && (
                  <button
                    className={styles.playBigBtn}
                    onClick={() => onPlayQueue && onPlayQueue(selectedArtist.tracks, 0)}
                  >
                    <Play size={18} fill="currentColor" /> Ouvir Músicas do Artista
                  </button>
                )}
                <button
                  className={styles.secondaryBtn}
                  onClick={() => {
                    setArtistForm({
                      id: selectedArtist.id,
                      name: selectedArtist.name,
                      bio: selectedArtist.bio || '',
                      avatar_url: selectedArtist.avatar_url || '',
                      genre: selectedArtist.genre || 'Variado'
                    });
                    setArtistModalOpen(true);
                  }}
                >
                  <Edit3 size={16} /> Editar Artista
                </button>
                <button
                  className={styles.secondaryBtn}
                  style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                  onClick={() => setDeleteConfirmModal({ open: true, type: 'artist', id: selectedArtist.id, title: selectedArtist.name })}
                >
                  <Trash2 size={16} /> Excluir Artista
                </button>
              </div>
            </div>
          </div>

          {/* Músicas do Artista */}
          <h3 style={{ margin: '1.5rem 0 1rem', fontSize: '1.2rem' }}>Músicas do Artista</h3>
          {selectedArtist.tracks && selectedArtist.tracks.length > 0 ? (
            <table className={styles.trackTable}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Título</th>
                  <th>Álbum</th>
                  <th>Duração</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {selectedArtist.tracks.map((t, idx) => {
                  const access = getTrackAccessInfo(t);
                  const isExpired = access.isExpired;
                  return (
                    <tr
                      key={t.id}
                      className={`${styles.trackRow} ${isExpired ? styles.trackRowExpired : ''}`}
                      onClick={() => isExpired && setExpiredModalTrack({ ...t, ...access })}
                      style={{ cursor: isExpired ? 'pointer' : 'default' }}
                    >
                      <td className={styles.trackIndexCol}>{idx + 1}</td>
                      <td className={styles.trackCell}>
                        <div className={styles.trackTitleCell}>
                          <Image
                            unoptimized
                            src={t.cover_url || selectedArtist.avatar_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                            alt={t.title}
                            width={42}
                            height={42}
                            className={styles.trackThumb}
                          />
                          <div className={styles.trackMeta}>
                            <span className={styles.trackName}>{t.title}</span>
                            <span className={styles.trackArtist}>
                              {t.artist}
                              {isExpired && (
                                <span style={{ marginLeft: 6, color: '#f87171', fontSize: '0.72rem', fontWeight: 600 }}>
                                  • Aluguel Expirado
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className={styles.trackCell}>{t.album || 'Single'}</td>
                      <td className={styles.trackCell}>{formatDuration(t.duration_sec)}</td>
                      <td className={styles.trackCell}>
                        <div className={styles.trackActions}>
                          {isExpired ? (
                            <button
                              className={styles.lockIconBtn}
                              title="Aluguel expirado - Clique para renovar ou comprar"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpiredModalTrack({ ...t, ...access });
                              }}
                            >
                              <Lock size={15} />
                            </button>
                          ) : (
                            <button
                              className={styles.iconBtn}
                              title="Reproduzir"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlayTrack && onPlayTrack(t);
                              }}
                            >
                              <Play size={16} fill="currentColor" />
                            </button>
                          )}
                          <button
                            className={styles.iconBtn}
                            title="Adicionar à playlist"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTrackToAddToPlaylist(t);
                              setAddToPlaylistModalOpen(true);
                            }}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}><Mic2 size={28} /></div>
              <h4 className={styles.emptyTitle}>Nenhuma música cadastrada para este artista</h4>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. VISÃO PRINCIPAL DAS CATEGORIAS (QUANDO NENHUM DETALHE ESTÁ ABERTO) */}
      {/* ========================================================================= */}
      {!loading && !selectedPlaylist && !selectedAlbum && !selectedArtist && (
        <>
          {/* BARRA DE AÇÃO & BUSCA */}
          <div className={styles.actionBar}>
            <div className={styles.searchBox}>
              <Search size={16} style={{ color: '#888888' }} />
              <input
                type="text"
                placeholder={`Pesquisar em ${activeCategory}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 0 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* BOTÕES DE CRIAÇÃO POR ABA */}
            {activeCategory === 'playlists' && (
              <button className={styles.primaryActionBtn} onClick={handleOpenCreatePlaylist}>
                <Plus size={16} /> Nova Playlist
              </button>
            )}
            {activeCategory === 'albums' && (
              <button
                className={styles.primaryActionBtn}
                onClick={() => {
                  setAlbumForm({ id: null, title: '', artist_name: '', artist_id: '', cover_url: '', release_date: '', genre: 'Variado' });
                  setAlbumModalOpen(true);
                }}
              >
                <Plus size={16} /> Novo Álbum
              </button>
            )}
            {activeCategory === 'artists' && (
              <button
                className={styles.primaryActionBtn}
                onClick={() => {
                  setArtistForm({ id: null, name: '', bio: '', avatar_url: '', genre: 'Variado' });
                  setArtistModalOpen(true);
                }}
              >
                <Plus size={16} /> Novo Artista
              </button>
            )}
          </div>

          {/* ABA: PLAYLISTS */}
          {activeCategory === 'playlists' && (
            <div>
              {filteredPlaylists.length > 0 ? (
                <div className={styles.grid}>
                  {filteredPlaylists.map((pl) => (
                    <div
                      key={pl.id}
                      className={styles.card}
                      onClick={() => fetchPlaylistDetails(pl.id)}
                    >
                      <div className={styles.cardMedia}>
                        {renderPlaylistCover(pl, false)}
                        <button
                          className={styles.playOverlay}
                          title="Abrir playlist"
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchPlaylistDetails(pl.id);
                          }}
                        >
                          <Play size={20} fill="currentColor" />
                        </button>
                      </div>
                      <div className={styles.cardInfo}>
                        <h4 className={styles.cardTitle}>{pl.name}</h4>
                        <span className={styles.cardSubtitle}>
                          {pl.track_count || 0} {pl.track_count === 1 ? 'música' : 'músicas'}
                        </span>
                        {renderPrivacyBadge(pl.privacy)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}><ListMusic size={32} /></div>
                  <h3 className={styles.emptyTitle}>Sua biblioteca não possui playlists</h3>
                  <p className={styles.emptyDesc}>
                    Crie playlists personalizadas para organizar suas faixas favoritas durante o desenvolvimento de código.
                  </p>
                  <button className={styles.primaryActionBtn} onClick={handleOpenCreatePlaylist}>
                    <Plus size={16} /> Criar primeira playlist
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ABA: MÚSICAS */}
          {activeCategory === 'tracks' && (
            <div>
              {filteredTracks.length > 0 ? (
                <table className={styles.trackTable}>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>#</th>
                      <th>Título</th>
                      <th>Artista</th>
                      <th>Álbum</th>
                      <th>Licença</th>
                      <th>Duração</th>
                      <th style={{ textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTracks.map((t, idx) => (
                      <tr
                        key={t.purchaseId || t.id}
                        className={`${styles.trackRow} ${t.isExpired ? styles.trackRowExpired : ''}`}
                        onClick={() => t.isExpired && setExpiredModalTrack(t)}
                        style={{ cursor: t.isExpired ? 'pointer' : 'default' }}
                      >
                        <td className={styles.trackIndexCol}>{idx + 1}</td>
                        <td className={styles.trackCell}>
                          <div className={styles.trackTitleCell}>
                            <Image
                              unoptimized
                              src={t.cover_url || t.cover || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                              alt={t.title}
                              width={42}
                              height={42}
                              className={styles.trackThumb}
                            />
                            <div className={styles.trackMeta}>
                              <span className={styles.trackName}>{t.title}</span>
                              <span className={styles.trackArtist}>
                                {t.genre || t.companyName || 'Variado'}
                                {t.isExpired && (
                                  <span style={{ marginLeft: 6, color: '#f87171', fontSize: '0.72rem', fontWeight: 600 }}>
                                    • Aluguel Expirado
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className={styles.trackCell}>{t.artist}</td>
                        <td className={styles.trackCell}>{t.album || 'Single'}</td>
                        <td className={styles.trackCell}>
                          {t.type === 'buy' || (!t.type && !t.expiresAt) ? (
                            <span className={styles.licenseBadgeBuy}>Comprada</span>
                          ) : t.isExpired ? (
                            <span className={styles.licenseBadgeExpired} title="Período de aluguel terminado">
                              <Lock size={12} /> Aluguel Expirado
                            </span>
                          ) : (
                            <span className={styles.licenseBadgeRent}>
                              {`Aluguel (${t.remainingDays !== null ? `${t.remainingDays}d` : '30d'})`}
                            </span>
                          )}
                        </td>
                        <td className={styles.trackCell}>{formatDuration(t.duration_sec || t.durationSec)}</td>
                        <td className={styles.trackCell}>
                          <div className={styles.trackActions}>
                            {t.isExpired ? (
                              <button
                                className={styles.lockIconBtn}
                                title="Aluguel expirado - Clique para renovar ou comprar"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpiredModalTrack(t);
                                }}
                              >
                                <Lock size={15} />
                              </button>
                            ) : (
                              <button
                                className={styles.iconBtn}
                                title="Reproduzir"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPlayTrack && onPlayTrack(t);
                                }}
                              >
                                <Play size={16} fill="currentColor" />
                              </button>
                            )}
                            <button
                              className={styles.iconBtn}
                              title="Adicionar à playlist"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTrackToAddToPlaylist(t);
                                setAddToPlaylistModalOpen(true);
                              }}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}><Music size={32} /></div>
                  <h3 className={styles.emptyTitle}>Sua biblioteca de músicas está vazia</h3>
                  <p className={styles.emptyDesc}>
                    {searchQuery
                      ? 'Nenhuma música adquirida corresponde aos termos pesquisados.'
                      : 'As músicas que você comprar ou alugar na plataforma aparecerão aqui para você ouvir quando quiser e adicionar às suas playlists.'}
                  </p>
                  {!searchQuery && onExploreCatalog && (
                    <button className={styles.primaryActionBtn} onClick={onExploreCatalog} style={{ marginTop: '0.75rem' }}>
                      <Disc size={16} /> Explorar Catálogo de Músicas
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ABA: ÁLBUNS */}
          {activeCategory === 'albums' && (
            <div>
              {filteredAlbums.length > 0 ? (
                <div className={styles.grid}>
                  {filteredAlbums.map((alb) => (
                    <div
                      key={alb.id}
                      className={styles.card}
                      onClick={() => fetchAlbumDetails(alb.id)}
                    >
                      <div className={styles.cardMedia}>
                        <Image
                          unoptimized
                          src={alb.cover_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                          alt={alb.title}
                          width={180}
                          height={180}
                          className={styles.cardImage}
                        />
                        <button
                          className={styles.playOverlay}
                          title="Abrir álbum"
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchAlbumDetails(alb.id);
                          }}
                        >
                          <Play size={20} fill="currentColor" />
                        </button>
                      </div>
                      <div className={styles.cardInfo}>
                        <h4 className={styles.cardTitle}>{alb.title}</h4>
                        <span className={styles.cardSubtitle}>{alb.artist_name}</span>
                        <span style={{ fontSize: '0.75rem', color: '#888888' }}>
                          {alb.release_date ? String(alb.release_date).substring(0, 4) : 'Álbum'} • {alb.tracks_count || 0} faixas
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}><Disc size={32} /></div>
                  <h3 className={styles.emptyTitle}>Nenhum álbum encontrado</h3>
                  <p className={styles.emptyDesc}>Adicione álbuns para agrupar faixas e lançamentos discográficos.</p>
                </div>
              )}
            </div>
          )}

          {/* ABA: ARTISTAS */}
          {activeCategory === 'artists' && (
            <div>
              {filteredArtists.length > 0 ? (
                <div className={styles.grid}>
                  {filteredArtists.map((art) => (
                    <div
                      key={art.id}
                      className={styles.card}
                      onClick={() => fetchArtistDetails(art.id)}
                    >
                      <div className={`${styles.cardMedia} ${styles.cardMediaCircle}`}>
                        <Image
                          unoptimized
                          src={art.avatar_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                          alt={art.name}
                          width={180}
                          height={180}
                          className={styles.cardImage}
                        />
                        <button
                          className={styles.playOverlay}
                          title="Ver artista"
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchArtistDetails(art.id);
                          }}
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                      <div className={styles.cardInfo} style={{ textAlign: 'center', alignItems: 'center' }}>
                        <h4 className={styles.cardTitle}>{art.name}</h4>
                        <span className={styles.cardSubtitle}>{art.genre || 'Artista'}</span>
                        <span style={{ fontSize: '0.75rem', color: '#888888' }}>
                          {art.tracks_count || 0} faixas • {art.albums_count || 0} álbuns
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}><Mic2 size={32} /></div>
                  <h3 className={styles.emptyTitle}>Nenhum artista cadastrado</h3>
                  <p className={styles.emptyDesc}>Cadastre artistas para associá-los a músicas e álbuns.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR / EDITAR PLAYLIST COM SELETOR DE PRIVACIDADE */}
      {/* ========================================================================= */}
      {playlistModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setPlaylistModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{playlistForm.id ? 'Editar Playlist' : 'Nova Playlist'}</h3>
              <button className={styles.iconBtn} onClick={() => setPlaylistModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSavePlaylist}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nome da Playlist *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Coding Beats, Lofi para Estudar..."
                    className={styles.formInput}
                    value={playlistForm.name}
                    onChange={(e) => setPlaylistForm({ ...playlistForm, name: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Descrição (opcional)</label>
                  <textarea
                    placeholder="Descreva o propósito ou clima desta playlist..."
                    className={styles.formTextarea}
                    value={playlistForm.description}
                    onChange={(e) => setPlaylistForm({ ...playlistForm, description: e.target.value })}
                  />
                </div>

                {/* Opção de Foto da Playlist (exibida apenas ao editar playlist existente) */}
                {playlistForm.id && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Foto de Capa</label>
                    <div className={styles.photoUploadBox}>
                      <div className={styles.photoUploadPreview}>
                        {playlistForm.cover_url ? (
                          <img src={playlistForm.cover_url} alt="Prévia da capa" />
                        ) : selectedPlaylist && playlistForm.id ? (
                          renderPlaylistCover(selectedPlaylist, false)
                        ) : (
                          renderPlaylistCover({ name: playlistForm.name, track_covers: [] }, false)
                        )}
                      </div>

                      <div className={styles.photoUploadActions}>
                        <input
                          type="file"
                          ref={modalPhotoInputRef}
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleModalPhotoSelect}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          <button
                            type="button"
                            className={styles.photoUploadBtn}
                            onClick={() => modalPhotoInputRef.current?.click()}
                          >
                            <Upload size={14} /> Escolher Foto
                          </button>
                          {playlistForm.cover_url && (
                            <button
                              type="button"
                              className={styles.photoRemoveBtn}
                              onClick={() => setPlaylistForm({ ...playlistForm, cover_url: '' })}
                              title="Voltar para a capa automática das músicas"
                            >
                              <X size={14} /> Remover Foto
                            </button>
                          )}
                        </div>
                        <p className={styles.photoHint}>
                          {playlistForm.cover_url
                            ? '✓ Foto personalizada ativa. Clique em "Remover" para voltar à capa automática.'
                            : 'Caso não escolha uma foto, a capa usará automaticamente a imagem das músicas (colagem 2x2 estilo Spotify).'}
                        </p>
                        <div>
                          <button
                            type="button"
                            className={styles.photoUrlToggle}
                            onClick={() => setShowPhotoUrlInput(prev => !prev)}
                          >
                            {showPhotoUrlInput ? 'Ocultar campo de URL' : 'Ou colar link URL de imagem'}
                          </button>
                          {showPhotoUrlInput && (
                            <input
                              type="url"
                              placeholder="https://exemplo.com/capa.jpg"
                              className={styles.formInput}
                              style={{ marginTop: '0.4rem' }}
                              value={playlistForm.cover_url || ''}
                              onChange={(e) => setPlaylistForm({ ...playlistForm, cover_url: e.target.value })}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Seletor de Privacidade (Inspirado no YouTube - Seção 12) */}
                {renderPrivacySelector(playlistForm.privacy, (newPriv) => {
                  setPlaylistForm({ ...playlistForm, privacy: newPriv });
                })}
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setPlaylistModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.primaryActionBtn}>
                  {playlistForm.id ? 'Salvar Alterações' : 'Criar Playlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADICIONAR MÚSICA À PLAYLIST */}
      {/* ========================================================================= */}
      {addToPlaylistModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setAddToPlaylistModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {trackToAddToPlaylist
                  ? `Adicionar "${trackToAddToPlaylist.title}" a uma Playlist`
                  : 'Adicionar Música à Playlist'}
              </h3>
              <button className={styles.iconBtn} onClick={() => setAddToPlaylistModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {/* Se estamos escolhendo qual playlist adicionar uma faixa já selecionada */}
              {trackToAddToPlaylist && (
                <div>
                  <span className={styles.formLabel}>Selecione a playlist de destino:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.65rem' }}>
                    {playlists.length > 0 ? (
                      playlists.map((pl) => {
                        const targetTrackId = getCleanTrackId(trackToAddToPlaylist);
                        const alreadyLinked = Boolean(
                          targetTrackId && (
                            (pl.track_ids && pl.track_ids.includes(targetTrackId)) ||
                            (pl.tracks && pl.tracks.some(pt => getCleanTrackId(pt) === targetTrackId)) ||
                            (selectedPlaylist && selectedPlaylist.id === pl.id && selectedPlaylist.tracks?.some(pt => getCleanTrackId(pt) === targetTrackId))
                          )
                        );

                        return (
                          <div
                            key={pl.id}
                            className={styles.privacyOption}
                            style={{
                              opacity: alreadyLinked ? 0.65 : 1,
                              cursor: alreadyLinked ? 'default' : 'pointer',
                              background: alreadyLinked ? 'rgba(34, 197, 94, 0.05)' : undefined,
                              border: alreadyLinked ? '1px solid rgba(34, 197, 94, 0.28)' : undefined
                            }}
                            title={alreadyLinked ? 'Esta música já foi vinculada a esta playlist' : 'Adicionar a esta playlist'}
                            onClick={() => {
                              if (alreadyLinked) {
                                showNotice('Esta música já foi vinculada a esta playlist.', 'error');
                                return;
                              }
                              handleAddTrackToPlaylist(pl.id, targetTrackId);
                            }}
                          >
                            <div className={styles.privacyIconWrapper} style={{ width: 38, height: 38, position: 'relative', borderRadius: 6, overflow: 'hidden', flexShrink: 0, padding: 0 }}>
                              {renderPlaylistCover(pl, false)}
                            </div>
                            <div className={styles.privacyText}>
                              <span className={styles.privacyName}>{pl.name}</span>
                              <span className={styles.privacyDesc}>{pl.track_count || 0} músicas • {pl.privacy}</span>
                            </div>
                            {alreadyLinked ? (
                              <span style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Check size={15} /> Já vinculada
                              </span>
                            ) : (
                              <Plus size={18} style={{ color: '#3b82f6' }} />
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p style={{ color: '#888', fontSize: '0.85rem' }}>Nenhuma playlist criada. Crie uma playlist primeiro.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Se estamos na visão de uma playlist e queremos escolher uma faixa para adicionar */}
              {!trackToAddToPlaylist && selectedPlaylist && (
                <div>
                  <span className={styles.formLabel}>Selecione uma música da sua biblioteca:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto', marginTop: '0.65rem' }}>
                    {tracks.map((t) => {
                      const tCleanId = getCleanTrackId(t);
                      const alreadyIn = Boolean(
                        tCleanId && (
                          (selectedPlaylist.track_ids && selectedPlaylist.track_ids.includes(tCleanId)) ||
                          selectedPlaylist.tracks?.some(pt => getCleanTrackId(pt) === tCleanId)
                        )
                      );

                      return (
                        <div
                          key={t.id}
                          className={styles.privacyOption}
                          style={{
                            opacity: alreadyIn ? 0.65 : 1,
                            cursor: alreadyIn ? 'default' : 'pointer',
                            background: alreadyIn ? 'rgba(34, 197, 94, 0.05)' : undefined,
                            border: alreadyIn ? '1px solid rgba(34, 197, 94, 0.28)' : undefined
                          }}
                          title={alreadyIn ? 'Esta música já foi vinculada a esta playlist' : 'Adicionar a esta playlist'}
                          onClick={() => {
                            if (alreadyIn) {
                              showNotice('Esta música já foi vinculada a esta playlist.', 'error');
                              return;
                            }
                            handleAddTrackToPlaylist(selectedPlaylist.id, tCleanId);
                          }}
                        >
                          <Image
                            unoptimized
                            src={t.cover_url || t.cover || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                            alt={t.title}
                            width={36}
                            height={36}
                            style={{ borderRadius: 4, objectFit: 'cover' }}
                          />
                          <div className={styles.privacyText}>
                            <span className={styles.privacyName}>{t.title}</span>
                            <span className={styles.privacyDesc}>{t.artist} • {formatDuration(t.duration_sec || t.durationSec)}</span>
                          </div>
                          {alreadyIn ? (
                            <span style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Check size={15} /> Já vinculada
                            </span>
                          ) : (
                            <Plus size={18} style={{ color: '#3b82f6' }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.secondaryBtn} onClick={() => setAddToPlaylistModalOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR / EDITAR ARTISTA */}
      {/* ========================================================================= */}
      {artistModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setArtistModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{artistForm.id ? 'Editar Artista' : 'Novo Artista'}</h3>
              <button className={styles.iconBtn} onClick={() => setArtistModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveArtist}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nome do Artista *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: BK, Veigh, Justin Bieber..."
                    className={styles.formInput}
                    value={artistForm.name}
                    onChange={(e) => setArtistForm({ ...artistForm, name: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Gênero Principal</label>
                  <input
                    type="text"
                    placeholder="Ex: Rap, Trap, Piseiro, Pop..."
                    className={styles.formInput}
                    value={artistForm.genre}
                    onChange={(e) => setArtistForm({ ...artistForm, genre: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>URL da Foto / Avatar</label>
                  <input
                    type="url"
                    placeholder="https://exemplo.com/avatar.jpg"
                    className={styles.formInput}
                    value={artistForm.avatar_url}
                    onChange={(e) => setArtistForm({ ...artistForm, avatar_url: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Biografia / Descrição</label>
                  <textarea
                    placeholder="Breve história ou conquistas do artista..."
                    className={styles.formTextarea}
                    value={artistForm.bio}
                    onChange={(e) => setArtistForm({ ...artistForm, bio: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setArtistModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.primaryActionBtn}>
                  {artistForm.id ? 'Salvar Artista' : 'Cadastrar Artista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR / EDITAR ÁLBUM */}
      {/* ========================================================================= */}
      {albumModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setAlbumModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{albumForm.id ? 'Editar Álbum' : 'Novo Álbum'}</h3>
              <button className={styles.iconBtn} onClick={() => setAlbumModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveAlbum}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Título do Álbum *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: ICARUS, Dos Prédios Deluxe..."
                    className={styles.formInput}
                    value={albumForm.title}
                    onChange={(e) => setAlbumForm({ ...albumForm, title: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Artista Principal *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nome do artista correspondente"
                    className={styles.formInput}
                    value={albumForm.artist_name}
                    onChange={(e) => setAlbumForm({ ...albumForm, artist_name: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Gênero</label>
                  <input
                    type="text"
                    placeholder="Ex: Trap, Hip-Hop, Pop..."
                    className={styles.formInput}
                    value={albumForm.genre}
                    onChange={(e) => setAlbumForm({ ...albumForm, genre: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Data de Lançamento</label>
                  <input
                    type="date"
                    className={styles.formInput}
                    value={albumForm.release_date}
                    onChange={(e) => setAlbumForm({ ...albumForm, release_date: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>URL da Imagem de Capa</label>
                  <input
                    type="url"
                    placeholder="https://exemplo.com/capa-album.jpg"
                    className={styles.formInput}
                    value={albumForm.cover_url}
                    onChange={(e) => setAlbumForm({ ...albumForm, cover_url: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setAlbumModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.primaryActionBtn}>
                  {albumForm.id ? 'Salvar Álbum' : 'Cadastrar Álbum'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR / EDITAR MÚSICA */}
      {/* ========================================================================= */}
      {trackModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setTrackModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{trackForm.id ? 'Editar Música' : 'Nova Música'}</h3>
              <button className={styles.iconBtn} onClick={() => setTrackModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveTrack}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Título da Faixa *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Músicas de amor nunca mais"
                    className={styles.formInput}
                    value={trackForm.title}
                    onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Artista *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: BK"
                    className={styles.formInput}
                    value={trackForm.artist}
                    onChange={(e) => setTrackForm({ ...trackForm, artist: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Álbum</label>
                  <input
                    type="text"
                    placeholder="Ex: ICARUS (ou Single)"
                    className={styles.formInput}
                    value={trackForm.album}
                    onChange={(e) => setTrackForm({ ...trackForm, album: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Gênero</label>
                  <input
                    type="text"
                    placeholder="Ex: Rap, Trap, Piseiro..."
                    className={styles.formInput}
                    value={trackForm.genre}
                    onChange={(e) => setTrackForm({ ...trackForm, genre: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Duração em segundos</label>
                  <input
                    type="number"
                    min="10"
                    max="1800"
                    placeholder="Ex: 214"
                    className={styles.formInput}
                    value={trackForm.duration_sec}
                    onChange={(e) => setTrackForm({ ...trackForm, duration_sec: Number(e.target.value) })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>URL da Capa</label>
                  <input
                    type="url"
                    placeholder="https://exemplo.com/capa.jpg"
                    className={styles.formInput}
                    value={trackForm.cover_url}
                    onChange={(e) => setTrackForm({ ...trackForm, cover_url: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>URL de Áudio / Preview (opcional)</label>
                  <input
                    type="url"
                    placeholder="https://exemplo.com/audio.mp3"
                    className={styles.formInput}
                    value={trackForm.preview_url}
                    onChange={(e) => setTrackForm({ ...trackForm, preview_url: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setTrackModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.primaryActionBtn}>
                  {trackForm.id ? 'Salvar Alterações' : 'Cadastrar no Acervo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO */}
      {/* ========================================================================= */}
      {deleteConfirmModal.open && (
        <div className={styles.modalBackdrop} onClick={() => setDeleteConfirmModal({ open: false, type: '', id: null, title: '' })}>
          <div className={styles.modal} style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ color: '#ef4444' }}>Confirmar Exclusão</h3>
              <button className={styles.iconBtn} onClick={() => setDeleteConfirmModal({ open: false, type: '', id: null, title: '' })}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5, color: '#e5e5e5' }}>
                Tem certeza de que deseja excluir <strong>"{deleteConfirmModal.title}"</strong>?
              </p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#a7a7a7' }}>
                {deleteConfirmModal.type === 'track' && 'As regras de integridade comercial serão aplicadas: se a faixa tiver compras vinculadas, será desativada/arquivada.'}
                {deleteConfirmModal.type === 'playlist' && 'Esta playlist e seu ordenamento serão removidos definitivamente.'}
                {(deleteConfirmModal.type === 'artist' || deleteConfirmModal.type === 'album') && 'A exclusão só será permitida se não houver faixas vinculadas.'}
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setDeleteConfirmModal({ open: false, type: '', id: null, title: '' })}
              >
                Cancelar
              </button>
              <button
                type="button"
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 20,
                  padding: '0.55rem 1.25rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={() => {
                  if (deleteConfirmModal.type === 'playlist') handleDeletePlaylist(deleteConfirmModal.id);
                  if (deleteConfirmModal.type === 'artist') handleDeleteArtist(deleteConfirmModal.id);
                  if (deleteConfirmModal.type === 'album') handleDeleteAlbum(deleteConfirmModal.id);
                  if (deleteConfirmModal.type === 'track') handleDeleteTrack(deleteConfirmModal.id);
                }}
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ALUGUEL EXPIRADO & BLOQUEIO AUTOMÁTICO (DevSongs)                  */}
      {/* ========================================================================= */}
      {expiredModalTrack && (
        <div className={styles.modalBackdrop} onClick={() => !actionLoading && setExpiredModalTrack(null)}>
          <div className={styles.expiredModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.expiredModalHeader}>
              <div className={styles.expiredModalBadgeIcon}>
                <Lock size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff', fontWeight: 700 }}>
                  Aluguel Expirado
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#a1a1aa' }}>
                  O período de acesso a esta faixa terminou. Escolha como deseja continuar ouvindo.
                </p>
              </div>
              <button
                className={styles.iconBtn}
                style={{ marginLeft: 'auto' }}
                onClick={() => setExpiredModalTrack(null)}
                disabled={actionLoading}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.expiredTrackInfoBox}>
              <Image
                unoptimized
                src={expiredModalTrack.cover_url || expiredModalTrack.cover || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                alt={expiredModalTrack.title}
                width={52}
                height={52}
                className={styles.expiredTrackCover}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {expiredModalTrack.title}
                </h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#888' }}>
                  {expiredModalTrack.artist} • {expiredModalTrack.album || 'Single'}
                </p>
              </div>
            </div>

            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, color: '#ef4444' }} />
              <span>A reprodução desta faixa está bloqueada até a renovação do aluguel ou aquisição definitiva.</span>
            </div>

            <div className={styles.expiredActionsGrid}>
              <button
                type="button"
                className={styles.renewRentBtn}
                onClick={() => handleRenewRent(expiredModalTrack)}
                disabled={actionLoading}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={16} /> Renovar Aluguel (30 dias)
                </span>
                <span style={{ fontWeight: 700 }}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expiredModalTrack.rent_price || expiredModalTrack.rentPrice || 1.90)}
                </span>
              </button>

              <button
                type="button"
                className={styles.buyPermanentBtn}
                onClick={() => handleBuyPermanent(expiredModalTrack)}
                disabled={actionLoading}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} /> Comprar Definitivamente
                </span>
                <span style={{ fontWeight: 700 }}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expiredModalTrack.sale_price || expiredModalTrack.salePrice || 4.90)}
                </span>
              </button>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setExpiredModalTrack(null)}
                disabled={actionLoading}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

