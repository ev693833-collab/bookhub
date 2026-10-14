import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  Home, Compass, Bookmark, Award, Plus, Menu, Search,
  Tv, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat,
  Volume2, VolumeX, Video, Music, LogOut, ShieldCheck, Heart,
  ChevronLeft, ChevronRight, MoreVertical, Maximize2, Minimize2,
  Radio, X
} from 'lucide-react';
import styles from '../styles/home.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Activity / Mood pills exatamente como no YouTube Music (Foto 1)
const YT_PILLS = [
  'Podcasts', 'Positividade', 'Relax', 'Festa', 'Para treinar',
  'Romance', 'Energia', 'Para ouvir no trânsito', 'Foco', 'Tristeza'
];

// Top 5 faixas idênticas às exibidas na Foto 1
const JUSTIN_TOP_TRACKS = [
  {
    id: 'track-baby',
    title: 'Baby (part. Ludacris)',
    artist: 'Justin Bieber',
    album: 'My World 2.0',
    cover: '/img/justin_my_world.jpg',
    plays: 'Tocou 4,8 bi vezes',
    durationSec: 214,
    duration: '3:34',
    explicit: false
  },
  {
    id: 'track-beauty',
    title: 'Beauty and a Beat (part. Nicki Minaj)',
    artist: 'Justin Bieber',
    album: 'Believe',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/73/08/1a/73081a96-0f7c-b5f8-2757-5c17fb714323/12UMGIM31899.rgb.jpg/600x600bb.jpg',
    plays: 'Tocou 2 bi vezes',
    durationSec: 228,
    duration: '3:48',
    explicit: false
  },
  {
    id: 'track-stay',
    title: 'STAY',
    artist: 'The Kid LAROI e Justin Bieber',
    album: 'STAY',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/b9/ef/10/b9ef10c6-3023-ffb7-da50-cb93786193ff/886449419197.jpg/600x600bb.jpg',
    plays: 'Tocou 2,3 bi vezes',
    durationSec: 141,
    duration: '2:21',
    explicit: true
  },
  {
    id: 'track-sorry',
    title: 'Sorry',
    artist: 'Justin Bieber',
    album: 'Purpose',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/81/a4/dc/81a4dc50-8d7e-6ae5-71d3-f83393348248/15UMGIM59807.rgb.jpg/600x600bb.jpg',
    plays: 'Tocou 5,2 bi vezes',
    durationSec: 200,
    duration: '3:20',
    explicit: false
  },
  {
    id: 'track-confident',
    title: 'Confident (part. Chance The Rapper)',
    artist: 'Justin Bieber',
    album: 'Journals',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/6e/c3/0f/6ec30fdf-d668-37f2-1a48-4cb5038b36a1/13UMGIM81995.rgb.jpg/600x600bb.jpg',
    plays: 'Tocou 1 bi vezes',
    durationSec: 247,
    duration: '4:07',
    explicit: false
  }
];

// Álbuns idênticos aos da Foto 1
const JUSTIN_ALBUMS = [
  {
    id: 'alb-coachella-2',
    title: 'SWAG LIVE FROM COACHELLA (Weekend II)',
    year: '2026',
    cover: '/img/coachella_w2.jpg',
    explicit: true
  },
  {
    id: 'alb-coachella-1',
    title: 'SWAG LIVE FROM COACHELLA (Weekend I)',
    year: '2026',
    cover: '/img/coachella_w1.jpg',
    explicit: true
  },
  {
    id: 'alb-swag-2',
    title: 'SWAG II',
    year: '2025',
    cover: '/img/swag_two.jpg',
    explicit: true
  },
  {
    id: 'alb-swag',
    title: 'SWAG',
    year: '2025',
    cover: '/img/swag.jpg',
    explicit: true
  },
  {
    id: 'alb-justice',
    title: 'Justice',
    year: '2021',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e0/92/da/e092da2d-9f6d-11dc-7843-2021e95a2b61/21UMGIM17518.rgb.jpg/600x600bb.jpg',
    explicit: false
  },
  {
    id: 'alb-changes',
    title: 'Changes',
    year: '2020',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/d2/21/4e/d2214ea9-97ff-46ef-ac45-7fca6fb73839/20UMGIM03126.rgb.jpg/600x600bb.jpg',
    explicit: false
  },
  {
    id: 'alb-purpose',
    title: 'Purpose',
    year: '2015',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/81/a4/dc/81a4dc50-8d7e-6ae5-71d3-f83393348248/15UMGIM59807.rgb.jpg/600x600bb.jpg',
    explicit: false
  },
  {
    id: 'alb-believe',
    title: 'Believe (Deluxe Edition)',
    year: '2012',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/73/08/1a/73081a96-0f7c-b5f8-2757-5c17fb714323/12UMGIM31899.rgb.jpg/600x600bb.jpg',
    explicit: false
  },
  {
    id: 'alb-myworld',
    title: 'My World 2.0',
    year: '2010',
    cover: '/img/justin_my_world.jpg',
    explicit: false
  }
];

// Singles e EPs idênticos aos da Foto 1
const JUSTIN_SINGLES = [
  {
    id: 'sgl-freefire',
    title: 'BEAUTIFUL LOVE (FREE FIRE)',
    year: '2022',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/ca/98/c1/ca98c1fd-9725-f9ba-d8e3-189831b8e62a/22UMGIM92316.rgb.jpg/600x600bb.jpg',
    explicit: false
  },
  {
    id: 'sgl-honest',
    title: 'HONEST',
    year: '2022',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/24/85/80/248580fb-1d8e-f80a-bf61-53233625f28f/22UMGIM45370.rgb.jpg/600x600bb.jpg',
    explicit: false
  },
  {
    id: 'sgl-funny',
    title: 'i feel funny',
    year: '2022',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/e8/eb/ae/e8ebae4c-6112-35bf-8b8c-9a7aca683fb8/22UMGIM45371.rgb.jpg/600x600bb.jpg',
    explicit: false
  },
  {
    id: 'sgl-attention',
    title: 'ATTENTION (with Omah Lay)',
    year: '2022',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/e1/91/38/e1913867-27b2-6c2e-cefc-6b45f44e138a/22UMGIM13926.rgb.jpg/600x600bb.jpg',
    explicit: false
  },
  {
    id: 'sgl-dontgo',
    title: "DON'T GO",
    year: '2021',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/e0/75/a6/e075a6f2-bfeb-dbbf-24ff-be1ca34d6ca7/075679774644.jpg/600x600bb.jpg',
    explicit: false
  },
  {
    id: 'sgl-stay',
    title: 'STAY',
    year: '2021',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/b9/ef/10/b9ef10c6-3023-ffb7-da50-cb93786193ff/886449419197.jpg/600x600bb.jpg',
    explicit: true
  },
  {
    id: 'sgl-ghost',
    title: 'Ghost',
    year: '2021',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/e0/92/da/e092da2d-9f6d-11dc-7843-2021e95a2b61/21UMGIM17518.rgb.jpg/600x600bb.jpg',
    explicit: false
  },
  {
    id: 'sgl-holy',
    title: 'Holy (feat. Chance The Rapper)',
    year: '2020',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/c8/fc/40/c8fc4073-75e0-7b42-6eed-117d1ed86ca5/20UMGIM74696.rgb.jpg/600x600bb.jpg',
    explicit: false
  }
];

// Dados oficiais do artista BK (Fotos 1 e 2 enviadas pelo usuário)
const BK_TOP_TRACKS = [
  {
    id: 'bk-gatilhos',
    title: 'Gatilhos',
    artist: 'BK',
    album: 'PRODUTO DO AMBIENTE',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/93/61/4e/93614e0e-5732-f65e-ae0e-9890bc8121bc/199806625002.jpg/600x600bb.jpg',
    plays: 'Tocou 1,5 mi vezes',
    durationSec: 190,
    duration: '3:10',
    explicit: true
  },
  {
    id: 'bk-em-nome',
    title: 'Em nome do que sinto (part. Gigantes)',
    artist: 'BK',
    album: 'ICARUS',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/3b/2e/21/3b2e21b4-57f7-f735-16b1-2a622626e3a0/8445162776523.jpg/600x600bb.jpg',
    plays: 'Tocou 7,6 mi vezes',
    durationSec: 207,
    duration: '3:27',
    explicit: false
  },
  {
    id: 'bk-abaixo-das-nuvens',
    title: 'Abaixo Das Nuvens (part. Nansy Silvvz e ...)',
    artist: 'BK',
    album: 'Diamantes, Lágrimas e Rostos para Esquecer',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/13/98/4c/13984c56-f8fc-318e-9bc4-65b925b4783b/8447053281338.jpg/600x600bb.jpg',
    plays: 'Tocou 6 mi vezes',
    durationSec: 283,
    duration: '4:43',
    explicit: true
  },
  {
    id: 'bk-morro-sem-voce',
    title: 'Morro Sem Você',
    artist: 'BK e Paulo DK',
    album: 'PRODUTO DO AMBIENTE',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/93/61/4e/93614e0e-5732-f65e-ae0e-9890bc8121bc/199806625002.jpg/600x600bb.jpg',
    plays: 'Tocou 3,1 mi vezes',
    durationSec: 205,
    duration: '3:25',
    explicit: true
  },
  {
    id: 'bk-so-eu-sei',
    title: 'Só Eu Sei (part. Djavan)',
    artist: 'BK e Nansy Silvvz',
    album: 'Diamantes, Lágrimas e Rostos para Esquecer',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/13/98/4c/13984c56-f8fc-318e-9bc4-65b925b4783b/8447053281338.jpg/600x600bb.jpg',
    plays: 'Tocou 6,1 mi vezes',
    durationSec: 242,
    duration: '4:02',
    explicit: false
  },
  {
    id: 'bk-real',
    title: 'Real',
    artist: 'BK, Maui e JXNV$',
    album: 'Diamantes, Lágrimas e Rostos para Esquecer',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/13/98/4c/13984c56-f8fc-318e-9bc4-65b925b4783b/8447053281338.jpg/600x600bb.jpg',
    plays: 'Tocou 8,2 mi vezes',
    durationSec: 221,
    duration: '3:41',
    explicit: true
  },
  {
    id: 'bk-nome-nas-ruas',
    title: 'Nome nas ruas',
    artist: 'BK',
    album: 'Castelos & Ruínas',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/5c/a5/92/5ca592ca-ed9b-441a-a9d7-3a8930a8dff4/689407286431.jpg/600x600bb.jpg',
    plays: 'Tocou 4,5 mi vezes',
    durationSec: 210,
    duration: '3:30',
    explicit: true
  },
  {
    id: 'bk-planos',
    title: 'Planos (part. Luccas Carlos e Arit)',
    artist: 'BK',
    album: 'Gigantes',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/b9/78/fa/b978fac2-a626-ea2e-ea93-5f7e7bf642b4/8429006299409.jpg/600x600bb.jpg',
    plays: 'Tocou 149 mi vezes',
    durationSec: 230,
    duration: '3:50',
    explicit: false
  },
  {
    id: 'bk-cacos-de-vidro',
    title: 'Cacos De Vidro (sample: Esperar pra Ver) (part. Evin...)',
    artist: 'BK e Kolo',
    album: 'Diamantes, Lágrimas e Rostos para Esquecer',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/13/98/4c/13984c56-f8fc-318e-9bc4-65b925b4783b/8447053281338.jpg/600x600bb.jpg',
    plays: 'Tocou 12 mi vezes',
    durationSec: 250,
    duration: '4:10',
    explicit: true
  }
];

const BK_ALBUMS = [
  {
    id: 'bk-alb-diamantes',
    title: 'Diamantes, Lágrimas e Rostos para Esquecer',
    year: '2025',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/13/98/4c/13984c56-f8fc-318e-9bc4-65b925b4783b/8447053281338.jpg/600x600bb.jpg',
    explicit: true
  },
  {
    id: 'bk-alb-icarus',
    title: 'ICARUS',
    year: '2022',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/3b/2e/21/3b2e21b4-57f7-f735-16b1-2a622626e3a0/8445162776523.jpg/600x600bb.jpg',
    explicit: true
  },
  {
    id: 'bk-alb-lider',
    title: 'O Líder em Movimento',
    year: '2020',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/80/35/49/8035491d-5e84-98d3-29e0-6035162fc4f0/8445162199414.jpg/600x600bb.jpg',
    explicit: true
  },
  {
    id: 'bk-alb-gigantes',
    title: 'Gigantes',
    year: '2018',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/b9/78/fa/b978fac2-a626-ea2e-ea93-5f7e7bf642b4/8429006299409.jpg/600x600bb.jpg',
    explicit: true
  },
  {
    id: 'bk-alb-castelos',
    title: 'Castelos & Ruínas',
    year: '2016',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/5c/a5/92/5ca592ca-ed9b-441a-a9d7-3a8930a8dff4/689407286431.jpg/600x600bb.jpg',
    explicit: false
  }
];

const BK_SINGLES = [
  {
    id: 'bk-sgl-produto',
    title: 'PRODUTO DO AMBIENTE',
    year: '2024',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/93/61/4e/93614e0e-5732-f65e-ae0e-9890bc8121bc/199806625002.jpg/600x600bb.jpg',
    explicit: true
  },
  {
    id: 'bk-sgl-cidade',
    title: 'Cidade do Pecado - EP',
    year: '2021',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/fa/f2/1b/faf21b71-b6d7-42db-cb3f-efce327b6bbd/8445162557290.jpg/600x600bb.jpg',
    explicit: true
  },
  {
    id: 'bk-sgl-ceu',
    title: 'O Céu É o Limite',
    year: '2018',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/d3/9d/1a/d39d1a9b-7c2e-d79b-f921-978baa33ac24/0.jpg/600x600bb.jpg',
    explicit: true
  }
];

// Sugestões de busca de texto idênticas à Foto 1
const BK_SEARCH_QUERIES = [
  'bk cacos de vidro',
  'bk album',
  'bk as melhores',
  'bk planos',
  'bk castelos e ruinas',
  'bk amanhecer'
];

// Entidades com thumbnail idênticas à Foto 1
const BK_SEARCH_ENTITIES = [
  {
    type: 'song',
    title: 'Cacos De Vidro (sample: Esperar pra Ver) (part. Evin...',
    sub: 'Música • BK e Kolo • Toc... • Diamantes, Lágrimas e ...',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/13/98/4c/13984c56-f8fc-318e-9bc4-65b925b4783b/8447053281338.jpg/600x600bb.jpg',
    trackId: 'bk-cacos-de-vidro'
  },
  {
    type: 'album',
    title: 'Diamantes, Lágrimas e Rostos para Esquecer',
    sub: 'Álbum • BK • 2025',
    explicit: true,
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/13/98/4c/13984c56-f8fc-318e-9bc4-65b925b4783b/8447053281338.jpg/600x600bb.jpg'
  },
  {
    type: 'playlist',
    title: 'bk as melhores',
    sub: 'Playlist • vitor • 1,5 mi de visualizações',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/3b/2e/21/3b2e21b4-57f7-f735-16b1-2a622626e3a0/8445162776523.jpg/600x600bb.jpg'
  },
  {
    type: 'song',
    title: 'Planos (part. Luccas Carlos e Arit)',
    sub: 'Música • BK • Tocou 149 mi vezes • Gigantes',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/b9/78/fa/b978fac2-a626-ea2e-ea93-5f7e7bf642b4/8429006299409.jpg/600x600bb.jpg',
    trackId: 'bk-planos'
  },
  {
    type: 'album',
    title: 'Castelos & Ruínas',
    sub: 'Álbum • BK, El Lif Beatz e JXNV$ • 2016',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/5c/a5/92/5ca592ca-ed9b-441a-a9d7-3a8930a8dff4/689407286431.jpg/600x600bb.jpg'
  }
];

// Chips de filtro da tela de resultados de busca (Foto 2)
const SEARCH_FILTER_PILLS = [
  'Artistas', 'Músicas', 'Playlists da comunidade', 'Vídeos',
  'Podcasts', 'Episódios', 'Álbuns', 'Perfis', 'Playlists em alta'
];

export default function HomeUnifiedYouTubeMusic() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedPill, setSelectedPill] = useState('Relax');
  const [tracks, setTracks] = useState(JUSTIN_TOP_TRACKS);
  const [showAllTopTracks, setShowAllTopTracks] = useState(false);
  const [albums, setAlbums] = useState(JUSTIN_ALBUMS);
  const [singles, setSingles] = useState(JUSTIN_SINGLES);

  // View Mode: 'artist' (Perfil) | 'search' (Resultados) | 'album' (Álbum dedicado estilo YouTube Music)
  const [viewMode, setViewMode] = useState('artist');
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumTracks, setAlbumTracks] = useState([]);
  const [isAlbumLoading, setIsAlbumLoading] = useState(false);
  const [activeArtist, setActiveArtist] = useState({
    id: 'justin',
    name: 'Justin Bieber',
    listeners: '523 mi ouvintes mensais',
    bio: 'Justin Drew Bieber é um cantor, compositor e ator canadense. Considerado um ícone pop, ele é conhecido por suas performances musicais multigênero. Ele foi descoberto por Scooter Braun em...',
    bannerImg: '/img/artist_banner_justin.jpg',
    avatarImg: '/img/justin_my_world.jpg',
    subscribers: '78,6 mi'
  });

  // Search & Autocomplete (Foto 1 & 2)
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSubTab, setSearchSubTab] = useState('YT MUSIC');
  const [selectedSearchFilter, setSelectedSearchFilter] = useState('Artistas');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestQueries, setSuggestQueries] = useState([]);
  const [suggestEntities, setSuggestEntities] = useState([]);

  // Busca em tempo real sugestões de texto e músicas correspondentes com base no que o usuário digita
  useEffect(() => {
    const qTrim = searchQuery.trim().toLowerCase();
    if (!qTrim) {
      setSuggestQueries([]);
      setSuggestEntities([]);
      return;
    }

    if (qTrim === 'bk' || qTrim === "bk'" || qTrim.startsWith('bk ')) {
      setSuggestQueries(BK_SEARCH_QUERIES);
      setSuggestEntities(BK_SEARCH_ENTITIES);
      return;
    }

    let isMounted = true;

    const timer = setTimeout(async () => {
      try {
        // 1. Sugestões de texto oficiais do YouTube Music
        const sugPromise = fetch(`${API_URL}/api/youtube/suggest?q=${encodeURIComponent(searchQuery)}`)
          .then(r => r.json())
          .then(d => d.queries || [])
          .catch(() => [
            `${searchQuery.trim()} as melhores`,
            `${searchQuery.trim()} album`,
            `${searchQuery.trim()} ao vivo`,
            `${searchQuery.trim()} novas`,
            `${searchQuery.trim()} playlist`
          ]);

        // 2. Músicas reais e artista correspondentes pesquisados no catálogo
        const musicPromise = fetch(`${API_URL}/api/music/search?q=${encodeURIComponent(searchQuery)}`)
          .then(r => r.json())
          .then(d => {
            const list = [];
            if (d.artist) {
              list.push({
                id: d.artist.id,
                type: 'artist',
                title: d.artist.name,
                artist: d.artist.name,
                album: '',
                sub: `Artista • ${d.artist.listeners}`,
                cover: d.artist.avatarImg,
                preview: null,
                durationSec: 0,
                duration: '',
                plays: '',
                explicit: false
              });
            }
            if (d.tracks && d.tracks.length > 0) {
              list.push(...d.tracks.slice(0, 4));
            }
            return list;
          })
          .catch(() => []);

        const [queries, entities] = await Promise.all([sugPromise, musicPromise]);
        if (isMounted) {
          setSuggestQueries(queries.slice(0, 6));
          setSuggestEntities(entities);
        }
      } catch (_) {}
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(214); // Real duration in seconds
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [likedMap, setLikedMap] = useState({});
  const [activeTab, setActiveTab] = useState('inicio');

  // Bio expand
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  // YouTube Full Track Engine (Inicia nulo para não tocar ou carregar nada sozinho)
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [showVideoDock, setShowVideoDock] = useState(false);

  // Refs
  const audioFallbackRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const progressTimerRef = useRef(null);
  const pillsBarRef = useRef(null);
  const albumsRowRef = useRef(null);
  const singlesRowRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchFilterBarRef = useRef(null);
  const isClosingRef = useRef(false);
  const currentTrackRef = useRef(null);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  // Rolar carrosséis horizontalmente
  const scrollRow = (ref, dir) => {
    if (ref.current) {
      ref.current.scrollBy({ left: dir === 'left' ? -420 : 420, behavior: 'smooth' });
    }
  };

  // 1. Auth check
  useEffect(() => {
    try {
      const stored = localStorage.getItem('userData');
      const token = localStorage.getItem('token');
      if (!stored || !token) {
        router.push('/login');
        return;
      }
      setUser(JSON.parse(stored));
    } catch (_) {
      router.push('/login');
    }
  }, [router]);

  // Plays count generator realista para a tabela do YouTube Music
  const generatePlaysCount = (idx) => {
    const counts = [
      'Tocou 4,8 bi vezes',
      'Tocou 2,0 bi vezes',
      'Tocou 2,3 bi vezes',
      'Tocou 1,9 bi vezes',
      'Tocou 2,6 bi vezes',
      'Tocou 2,8 bi vezes',
      'Tocou 1,1 bi vezes',
      'Tocou 1,7 bi vezes',
      'Tocou 890 mi vezes',
      'Tocou 740 mi vezes',
      'Tocou 680 mi vezes',
      'Tocou 590 mi vezes'
    ];
    return counts[idx % counts.length];
  };

  // 2. Load Full Tracks for the artist
  const fetchArtistTracks = useCallback(async (query) => {
    setIsSearching(true);
    try {
      const qLower = (query || '').toLowerCase().trim();
      const isJustin = !query || qLower.includes('justin bieber') || qLower === 'justin';
      const isBK = qLower === 'bk' || qLower === "bk'" || qLower.startsWith('bk ');

      if (isBK) {
        setTracks(BK_TOP_TRACKS);
        setAlbums(BK_ALBUMS);
        setSingles(BK_SINGLES);
        setActiveArtist({
          id: 'bk',
          name: 'BK',
          listeners: '9,36 mi ouvintes mensais',
          bio: "Abebe Bikila Costa Santos, mais conhecido pelo nome artístico BK', é um rapper, compositor e empresário brasileiro. Considerado uma das vozes mais influentes e celebradas do rap nacional...",
          bannerImg: '/img/bk_banner.jpg',
          avatarImg: '/img/bk_avatar.png',
          subscribers: '3,2 mi'
        });
        setIsSearching(false);
        return;
      }

      if (isJustin) {
        setTracks(JUSTIN_TOP_TRACKS);
        setAlbums(JUSTIN_ALBUMS);
        setSingles(JUSTIN_SINGLES);
        setActiveArtist({
          id: 'justin',
          name: 'Justin Bieber',
          listeners: '523 mi ouvintes mensais',
          bio: 'Justin Drew Bieber é um cantor, compositor e ator canadense. Considerado um ícone pop, ele é conhecido por suas performances musicais multigênero. Ele foi descoberto por Scooter Braun em...',
          bannerImg: '/img/artist_banner_justin.jpg',
          avatarImg: '/img/justin_my_world.jpg',
          subscribers: '78,6 mi'
        });
        setIsSearching(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/music/artist?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (data && data.artist) {
        setActiveArtist(data.artist);
        setTracks(data.tracks || []);
        if (data.albums) setAlbums(data.albums);
        if (data.singles) setSingles(data.singles);
      }
    } catch (err) {
      console.error('Erro ao carregar faixas:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    fetchArtistTracks('Justin Bieber');
  }, [fetchArtistTracks]);

  // 3. YouTube Player API Setup (Sem autoplay automático para não tocar sozinho)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setupYT = () => {
      if (!window.YT || !window.YT.Player) return;
      if (ytPlayerRef.current) return;

      try {
        const playerConfig = {
          height: '100%',
          width: '100%',
          playerVars: {
            autoplay: 0, // Nunca toca sozinho
            controls: 1,
            enablejsapi: 1,
            modestbranding: 1,
            rel: 0,
            origin: window.location.origin
          },
          events: {
            onReady: (e) => {
              e.target.setVolume(volume * 100);
            },
            onStateChange: (e) => {
              if (isClosingRef.current) return;
              if (e.data === 1) setIsPlaying(true);
              if (e.data === 2) setIsPlaying(false);
              if (e.data === 0) {
                if (!isClosingRef.current && currentTrackRef.current) {
                  handleNextTrack();
                }
              }
            }
          }
        };

        if (activeVideoId) {
          playerConfig.videoId = activeVideoId;
        }

        ytPlayerRef.current = new window.YT.Player('devsongs-yt-frame', playerConfig);
      } catch (e) {
        console.warn('YT Player init:', e);
      }
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = setupYT;
    } else {
      setupYT();
    }
  }, [activeVideoId, volume]);

  // Real-time progress timer
  useEffect(() => {
    if (isPlaying) {
      progressTimerRef.current = setInterval(() => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
          try {
            const cur = ytPlayerRef.current.getCurrentTime() || 0;
            const dur = ytPlayerRef.current.getDuration() || 0;
            if (dur > 0) {
              setCurrentTime(cur);
              setDuration(dur);
            } else {
              setCurrentTime(prev => prev + 0.5);
            }
          } catch (_) {
            setCurrentTime(prev => prev + 0.5);
          }
        } else {
          setCurrentTime(prev => prev + 0.5);
        }
      }, 500);
    } else {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    }

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPlaying]);

  // Play full song without 30s cut
  const playTrack = async (track) => {
    isClosingRef.current = false;
    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(track.durationSec || 214);

    try {
      const res = await fetch(`${API_URL}/api/youtube/search?q=${encodeURIComponent(track.title + ' ' + track.artist)}`);
      const data = await res.json();
      const targetVideoId = data.videoId || 'gdx7gN1UyX0';
      setActiveVideoId(targetVideoId);

      if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
        ytPlayerRef.current.loadVideoById(targetVideoId);
        ytPlayerRef.current.playVideo();
      } else {
        if (audioFallbackRef.current && track.preview) {
          audioFallbackRef.current.src = track.preview;
          audioFallbackRef.current.play().catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Fallback preview:', err);
      if (audioFallbackRef.current && track.preview) {
        audioFallbackRef.current.src = track.preview;
        audioFallbackRef.current.play().catch(() => {});
      }
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        ytPlayerRef.current.pauseVideo();
      }
      if (audioFallbackRef.current) audioFallbackRef.current.pause();
      setIsPlaying(false);
    } else {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
        ytPlayerRef.current.playVideo();
      }
      if (audioFallbackRef.current && audioFallbackRef.current.src) {
        audioFallbackRef.current.play().catch(() => {});
      }
      setIsPlaying(true);
    }
  };

  const handleNextTrack = () => {
    if (isClosingRef.current || !currentTrackRef.current) return;
    if (tracks.length === 0) return;
    const currentIndex = tracks.findIndex(t => t.id === currentTrackRef.current?.id);
    let nextIndex;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * tracks.length);
    } else {
      nextIndex = (currentIndex + 1) % tracks.length;
    }
    playTrack(tracks[nextIndex]);
  };

  const handlePrevTrack = () => {
    if (isClosingRef.current || !currentTrackRef.current) return;
    if (tracks.length === 0) return;
    const currentIndex = tracks.findIndex(t => t.id === currentTrackRef.current?.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    playTrack(tracks[prevIndex]);
  };

  const handleClosePlayer = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    isClosingRef.current = true;

    // 1. Interrompe e pausa YouTube Player
    if (ytPlayerRef.current) {
      try {
        if (typeof ytPlayerRef.current.pauseVideo === 'function') {
          ytPlayerRef.current.pauseVideo();
        }
        if (typeof ytPlayerRef.current.stopVideo === 'function') {
          ytPlayerRef.current.stopVideo();
        }
      } catch (err) {
        console.warn('Erro ao parar YT player:', err);
      }
    }

    // 2. Limpa timer de progresso
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }

    // 3. Limpa áudio fallback se existir
    if (audioFallbackRef.current) {
      try {
        audioFallbackRef.current.pause();
        audioFallbackRef.current.currentTime = 0;
      } catch (_) {}
    }

    // 4. Zera estado e remove player
    setIsPlaying(false);
    setShowVideoDock(false);
    setCurrentTrack(null);
    setCurrentTime(0);

    // Mantém trava ativa por 1s para absorver eventos de parada do YouTube Iframe
    setTimeout(() => {
      isClosingRef.current = false;
    }, 1000);
  };

  const handleSeek = (e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percent * duration;
    setCurrentTime(newTime);

    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      ytPlayerRef.current.seekTo(newTime, true);
    }
  };

  const handleVolumeChange = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(percent);
    setIsMuted(false);

    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      ytPlayerRef.current.setVolume(percent * 100);
      ytPlayerRef.current.unMute();
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.unMute === 'function') {
        ytPlayerRef.current.unMute();
        ytPlayerRef.current.setVolume(volume * 100);
      }
    } else {
      setIsMuted(true);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.mute === 'function') {
        ytPlayerRef.current.mute();
      }
    }
  };

  const toggleLike = (trackId) => {
    setLikedMap(prev => ({ ...prev, [trackId]: !prev[trackId] }));
  };

  // Fechar dropdown de sugestões ao clicar fora (Foto 1)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Abre a página de perfil completo do artista (Foto 3 mantida)
  const openArtistProfile = (artistName) => {
    setViewMode('artist');
    setSelectedAlbum(null);
    setShowSuggestions(false);
    const aLower = (artistName || '').toLowerCase().trim();
    if (!artistName || aLower.includes('justin')) {
      setActiveArtist({
        id: 'justin',
        name: 'Justin Bieber',
        listeners: '523 mi ouvintes mensais',
        bio: 'Justin Drew Bieber é um cantor, compositor e ator canadense. Considerado um ícone pop, ele é conhecido por suas performances musicais multigênero. Ele foi descoberto por Scooter Braun em...',
        bannerImg: '/img/artist_banner_justin.jpg',
        avatarImg: '/img/justin_my_world.jpg',
        subscribers: '78,6 mi'
      });
      setTracks(JUSTIN_TOP_TRACKS);
      setAlbums(JUSTIN_ALBUMS);
      setSingles(JUSTIN_SINGLES);
    } else if (aLower === 'bk' || aLower === "bk'" || aLower.startsWith('bk ')) {
      setActiveArtist({
        id: 'bk',
        name: 'BK',
        listeners: '9,36 mi ouvintes mensais',
        bio: "Abebe Bikila Costa Santos, mais conhecido pelo nome artístico BK', é um rapper, compositor e empresário brasileiro. Considerado uma das vozes mais influentes do rap nacional...",
        bannerImg: '/img/bk_banner.jpg',
        avatarImg: '/img/bk_avatar.png',
        subscribers: '3,2 mi'
      });
      setTracks(BK_TOP_TRACKS);
      setAlbums(BK_ALBUMS);
      setSingles(BK_SINGLES);
    } else {
      fetchArtistTracks(artistName);
    }
  };

  // Dispara a busca e vai para a tela de resultados do YouTube Music (Foto 2)
  const handleSearchSubmit = (queryStr) => {
    const q = (queryStr !== undefined ? queryStr : searchQuery).trim();
    if (!q) return;
    setSearchQuery(q);
    setShowSuggestions(false);
    setSelectedAlbum(null);
    setViewMode('search');

    const qLower = q.toLowerCase();
    if (qLower === 'bk' || qLower === "bk'" || qLower.startsWith('bk ')) {
      setTracks(BK_TOP_TRACKS);
      setAlbums(BK_ALBUMS);
      setSingles(BK_SINGLES);
      setActiveArtist({
        id: 'bk',
        name: 'BK',
        listeners: '9,36 mi ouvintes mensais',
        bio: "Abebe Bikila Costa Santos, mais conhecido pelo nome artístico BK', é um rapper, compositor e empresário brasileiro. Considerado uma das vozes mais influentes do rap nacional...",
        bannerImg: '/img/bk_banner.jpg',
        avatarImg: '/img/bk_avatar.png',
        subscribers: '3,2 mi'
      });
    } else {
      fetchArtistTracks(q);
    }
  };

  // Ao clicar em um álbum, abre a visualização dedicada do Álbum (Foto do YouTube Music)
  const handleSelectAlbum = async (album) => {
    try {
      setIsSearching(true);
      setIsAlbumLoading(true);
      setSelectedAlbum(album);
      setViewMode('album');

      const albumIdParam = album.albumId || album.id || '';
      const artistNameParam = album.artist || activeArtist.name || '';
      const albumTitleParam = album.title || '';

      const res = await fetch(
        `${API_URL}/api/music/album-tracks?albumId=${encodeURIComponent(albumIdParam)}&title=${encodeURIComponent(albumTitleParam)}&artist=${encodeURIComponent(artistNameParam)}`
      );
      const data = await res.json();

      if (data && data.album) {
        setSelectedAlbum(data.album);
      }
      if (data && data.tracks && data.tracks.length > 0) {
        setAlbumTracks(data.tracks);
        setTracks(data.tracks);
      } else {
        // Fallback local ou iTunes caso o backend não retorne faixas
        const isBK = artistNameParam.toLowerCase().includes('bk');
        const allLocal = isBK ? BK_TOP_TRACKS : JUSTIN_TOP_TRACKS;
        const matches = allLocal.filter(t => 
          (t.album && t.album.toLowerCase().includes(albumTitleParam.toLowerCase())) || 
          (albumTitleParam && albumTitleParam.toLowerCase().includes(t.album?.toLowerCase()))
        );
        if (matches.length > 0) {
          setAlbumTracks(matches);
          setTracks(matches);
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar faixas do álbum:', err);
    } finally {
      setIsSearching(false);
      setIsAlbumLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    handleSearchSubmit(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const scrollSearchFilters = (direction) => {
    if (searchFilterBarRef.current) {
      const scrollAmount = direction === 'left' ? -250 : 250;
      searchFilterBarRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollPills = (direction) => {
    if (pillsBarRef.current) {
      const scrollAmount = direction === 'left' ? -250 : 250;
      pillsBarRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const formatSeconds = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const formatDurationSummary = (sec) => {
    if (!sec || isNaN(sec)) return '35 minutos';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h} hora${h > 1 ? 's' : ''} e ${m} minuto${m !== 1 ? 's' : ''}`;
    return `${m} minutos`;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    router.push('/login');
  };

  const isSuperAdmin = user?.role === 'admin';

  return (
    <>
      <Head>
        <title>DevSongs — Streaming de Músicas</title>
        <meta name="description" content="Streaming oficial DevSongs inspirado no YouTube Music e Spotify com músicas 100% completas." />
        <meta name="referrer" content="no-referrer" />
        <link rel="icon" href="/favicon.png" type="image/png" />
      </Head>

      <audio ref={audioFallbackRef} style={{ display: 'none' }} />

      <div className={styles.appContainer}>

        {/* ─── YOUTUBE MUSIC ORGANIZED SIDEBAR (DevSongs Identity) ─── */}
        <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.sidebarCollapsed : ''}`}>
          <div className={styles.sidebarHeader}>
            <button
              className={styles.hamburgerBtn}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Recolher menu"
            >
              <Menu size={22} />
            </button>
            <div
              className={styles.ytMusicLogoRow}
              onClick={() => {
                setViewMode('artist');
                setSelectedAlbum(null);
              }}
              style={{ cursor: 'pointer' }}
              title="Ir para página inicial"
            >
              <Image
                src="/img/logo-devsongs.png"
                alt="DevSongs"
                width={26}
                height={26}
                style={{ objectFit: 'contain' }}
              />
              <span className={styles.ytMusicBrandText}>
                Dev<span className={styles.brandHighlight}>Songs</span>
              </span>
            </div>
          </div>

          <nav className={styles.navSection}>
            <button
              onClick={() => {
                setActiveTab('inicio');
                setViewMode('artist');
                setSelectedAlbum(null);
              }}
              className={`${styles.navItem} ${activeTab === 'inicio' ? styles.navItemActive : ''}`}
            >
              <Home size={22} />
              <span>Início</span>
            </button>
            <button
              onClick={() => setActiveTab('explorar')}
              className={`${styles.navItem} ${activeTab === 'explorar' ? styles.navItemActive : ''}`}
            >
              <Compass size={22} />
              <span>Explorar</span>
            </button>
            <button
              onClick={() => setActiveTab('biblioteca')}
              className={`${styles.navItem} ${activeTab === 'biblioteca' ? styles.navItemActive : ''}`}
            >
              <Bookmark size={22} />
              <span>Biblioteca</span>
            </button>
            <button
              onClick={() => setActiveTab('upgrade')}
              className={`${styles.navItem} ${activeTab === 'upgrade' ? styles.navItemActive : ''}`}
            >
              <Award size={22} />
              <span>Upgrade</span>
            </button>
          </nav>

          <div className={styles.sidebarDivider} />

          {/* Botão + Nova Playlist (Foto 1) */}
          <button className={styles.newPlaylistBtn} onClick={() => alert('Criar nova playlist')}>
            <Plus size={18} />
            <span>Nova playlist</span>
          </button>

          <div className={styles.autoPlaylistSection}>
            <span className={styles.autoPlaylistTitle}>Episódios para mais tarde</span>
            <span className={styles.autoPlaylistSub}>Playlist automática</span>
          </div>

          <div className={styles.playlistList}>
            <div className={styles.playlistItem} onClick={() => openArtistProfile('Justin Bieber')}>
              <span>🎵 Justin Bieber (50 faixas)</span>
            </div>
            <div className={styles.playlistItem} onClick={() => openArtistProfile('BK')}>
              <span>🎵 BK (Destaque)</span>
            </div>
            <div className={styles.playlistItem} onClick={() => openArtistProfile('The Weeknd')}>
              <span>🎵 The Weeknd</span>
            </div>
            <div className={styles.playlistItem} onClick={() => openArtistProfile('Taylor Swift')}>
              <span>🎵 Taylor Swift</span>
            </div>
            <div className={styles.playlistItem} onClick={() => openArtistProfile('Drake')}>
              <span>🎵 Drake</span>
            </div>
            <div className={styles.playlistItem} onClick={() => openArtistProfile('Coldplay')}>
              <span>🎵 Coldplay</span>
            </div>
          </div>
        </aside>

        {/* ─── MAIN CONTENT (Page background #090909) ──────────────── */}
        <main className={styles.mainContent}>

          {/* Top Header Bar (Foto 1 & 2) */}
          <header className={styles.topAppBar}>
            {!sidebarOpen && (
              <button
                className={styles.hamburgerBtn}
                onClick={() => setSidebarOpen(true)}
                style={{ marginRight: 8 }}
                title="Expandir menu"
              >
                <Menu size={22} />
              </button>
            )}

            {/* Campo de pesquisa com Autocomplete Dropdown (Foto 1) */}
            <div className={styles.searchWrap} ref={searchContainerRef}>
              <Search size={20} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Pesquise músicas, álbuns, artistas, podcasts"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (searchQuery.trim().length > 0) setShowSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchSubmit(searchQuery);
                  }
                }}
                className={styles.searchField}
              />
              {searchQuery.length > 0 && (
                <button
                  type="button"
                  className={styles.searchClearBtn}
                  onClick={handleClearSearch}
                  aria-label="Limpar pesquisa"
                >
                  <X size={18} />
                </button>
              )}

              {/* ─── DROPDOWN DE SUGESTÕES DE BUSCA (Foto 1) ─── */}
              {showSuggestions && searchQuery.trim().length > 0 && (() => {
                const qTrim = searchQuery.trim().toLowerCase();
                const isBKSearch = qTrim === 'bk' || qTrim === "bk'" || qTrim.startsWith('bk ');
                const queriesToRender = isBKSearch
                  ? BK_SEARCH_QUERIES
                  : (suggestQueries && suggestQueries.length > 0
                      ? suggestQueries
                      : [
                          `${searchQuery.trim()} as melhores`,
                          `${searchQuery.trim()} album`,
                          `${searchQuery.trim()} ao vivo`,
                          `${searchQuery.trim()} novas`,
                          `${searchQuery.trim()} playlist`,
                          `${searchQuery.trim()} discografia`
                        ]);
                const entitiesToRender = isBKSearch
                  ? BK_SEARCH_ENTITIES
                  : (suggestEntities || []);

                return (
                  <div className={styles.searchDropdown}>
                    {/* Lista 1: Consultas de texto com ícone de lupa */}
                    {queriesToRender.map((queryItem, idx) => (
                      <div
                        key={`sug-${idx}`}
                        className={styles.searchSuggestionItem}
                        onClick={() => handleSearchSubmit(queryItem)}
                      >
                        <Search size={18} className={styles.searchSuggestionIcon} />
                        <span className={styles.searchSuggestionText}>{queryItem}</span>
                      </div>
                    ))}

                    {entitiesToRender.length > 0 && (
                      <div className={styles.searchDropdownDivider} />
                    )}

                    {/* Lista 2: Resultados enriquecidos com thumbnail de músicas correspondentes à pesquisa */}
                    {entitiesToRender.map((entity, idx) => (
                      <div
                        key={`ent-${idx}`}
                        className={`${styles.searchEntityItem} ${idx === 1 && isBKSearch ? styles.searchEntityItemActive : ''}`}
                        onClick={() => {
                          if (entity.type === 'song') {
                            setTracks(prev => {
                              if (!prev.some(t => t.id === entity.id)) {
                                return [entity, ...prev];
                              }
                              return prev;
                            });
                            playTrack(entity);
                            setShowSuggestions(false);
                          } else if (entity.type === 'artist') {
                            openArtistProfile(entity.title);
                            setShowSuggestions(false);
                          } else if (entity.type === 'album') {
                            handleSelectAlbum({
                              title: entity.title,
                              cover: entity.cover,
                              explicit: entity.explicit,
                              artist: entity.title.toLowerCase().includes('bk') ? 'BK' : (entity.artist || activeArtist.name)
                            });
                            setShowSuggestions(false);
                          } else {
                            handleSearchSubmit(entity.title);
                          }
                        }}
                      >
                        <img
                          src={entity.cover || '/img/logo-devsongs.png'}
                          alt={entity.title}
                          className={styles.searchEntityThumb}
                          referrerPolicy="no-referrer"
                          onError={(e) => { e.currentTarget.src = '/img/logo-devsongs.png'; }}
                        />
                        <div className={styles.searchEntityContent}>
                          <span className={styles.searchEntityTitle}>{entity.title}</span>
                          <span className={styles.searchEntitySub}>
                            {entity.explicit && <span className={styles.explicitTag}>E</span>}
                            <span>{entity.sub}</span>
                          </span>
                        </div>
                        <div className={styles.searchEntityMore}>
                          <MoreVertical size={16} />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className={styles.topActions}>
              <button className={styles.castBtn} title="Transmitir para TV / Chromecast">
                <Tv size={20} />
              </button>

              {isSuperAdmin && (
                <div className={styles.adminPill}>
                  <ShieldCheck size={14} />
                  <span>Superadmin</span>
                </div>
              )}

              {/* Profile Avatar Circle with letter E (Foto 1 & 2) */}
              <div className={styles.userBtn} title={user?.full_name || 'Enzo'}>
                {user?.full_name?.charAt(0) || 'E'}
              </div>

              <button onClick={handleLogout} className={styles.logoutBtn} title="Sair da Conta">
                <LogOut size={18} />
              </button>
            </div>
          </header>

          {/* ══════════════════════════════════════════════════════════
              CONDITIONAL VIEW: ÁLBUM DEDICADO | SEARCH RESULTS | ARTIST PROFILE
              ══════════════════════════════════════════════════════════ */}
          {viewMode === 'album' && selectedAlbum ? (
            /* ─── TELA DO ÁLBUM ESTILO YOUTUBE MUSIC (Foto do Usuário) ─── */
            <div className={styles.albumViewContainer}>
              {/* Coluna Esquerda: Mini Artista, Cover HD, Título, Estatísticas e Ações */}
              <div className={styles.albumHeroColumn}>
                <div
                  className={styles.albumArtistRow}
                  onClick={() => openArtistProfile(selectedAlbum.artistName || activeArtist.name)}
                  title={`Voltar ao perfil de ${selectedAlbum.artistName || activeArtist.name}`}
                >
                  <img
                    src={selectedAlbum.artistAvatar || activeArtist.avatarImg || '/img/bk_avatar.png'}
                    alt={selectedAlbum.artistName || activeArtist.name}
                    className={styles.albumArtistMiniAvatar}
                    referrerPolicy="no-referrer"
                    onError={(e) => { e.currentTarget.src = '/img/logo-devsongs.png'; }}
                  />
                  <span>{selectedAlbum.artistName || activeArtist.name}</span>
                </div>

                <div className={styles.albumHeroCoverWrap}>
                  <img
                    src={selectedAlbum.cover || '/img/logo-devsongs.png'}
                    alt={selectedAlbum.title}
                    className={styles.albumHeroCover}
                    referrerPolicy="no-referrer"
                    onError={(e) => { e.currentTarget.src = '/img/logo-devsongs.png'; }}
                  />
                </div>

                <h1 className={styles.albumHeroTitle}>{selectedAlbum.title}</h1>

                <div className={styles.albumHeroMeta}>
                  {selectedAlbum.explicit && <span className={styles.explicitTagSmall}>E</span>}
                  <span>Álbum</span>
                  <span className={styles.albumDot}>•</span>
                  <span>{selectedAlbum.year || '2025'}</span>
                </div>

                <div className={styles.albumHeroStats}>
                  <span>
                    {selectedAlbum.nbTracks || albumTracks.length || 0} músicas • {formatDurationSummary(selectedAlbum.durationSec || albumTracks.reduce((acc, t) => acc + (t.durationSec || 0), 0))}
                  </span>
                </div>

                <div className={styles.albumActionButtonsRow}>
                  <button
                    type="button"
                    className={styles.albumActionCircleBtn}
                    title="Salvar na biblioteca"
                    onClick={() => alert(`Álbum "${selectedAlbum.title}" adicionado à sua biblioteca!`)}
                  >
                    <Bookmark size={20} />
                  </button>

                  <button
                    type="button"
                    className={styles.albumBigPlayBtn}
                    title="Tocar álbum completo"
                    onClick={() => {
                      if (albumTracks.length > 0) {
                        playTrack(albumTracks[0]);
                      }
                    }}
                  >
                    <Play size={24} fill="#0f0f0f" color="#0f0f0f" style={{ marginLeft: '3px' }} />
                  </button>

                  <button
                    type="button"
                    className={styles.albumActionCircleBtn}
                    title="Mais opções"
                  >
                    <MoreVertical size={20} />
                  </button>
                </div>

                {/* Botões Comerciais de Compra e Aluguel */}
                <div className={styles.albumCommerceRow}>
                  <button
                    type="button"
                    className={styles.btnBuyAlbum}
                    onClick={() => alert(`Compra do álbum "${selectedAlbum.title}" iniciada (${selectedAlbum.priceSale || 'R$ 29,90'})!`)}
                  >
                    Comprar Álbum • {selectedAlbum.priceSale || 'R$ 29,90'}
                  </button>
                  <button
                    type="button"
                    className={styles.btnRentAlbum}
                    onClick={() => alert(`Aluguel do álbum "${selectedAlbum.title}" por 30 dias (${selectedAlbum.priceRent || 'R$ 9,90'}) ativado!`)}
                  >
                    Alugar Álbum • {selectedAlbum.priceRent || 'R$ 9,90'} / mês
                  </button>
                </div>
              </div>

              {/* Coluna Direita: Tracklist Oficial com Números e Duração */}
              <div className={styles.albumTracklistColumn}>
                <div className={styles.albumTracklistHeader}>
                  <h2>Faixas</h2>
                </div>

                {isAlbumLoading ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    Carregando faixas do álbum...
                  </div>
                ) : (
                  albumTracks.map((track, idx) => {
                    const isCurrent = currentTrack?.id === track.id || currentTrack?.title === track.title;
                    return (
                      <div
                        key={track.id || idx}
                        className={`${styles.albumTrackRow} ${isCurrent ? styles.albumTrackRowActive : ''}`}
                        onClick={() => playTrack(track)}
                      >
                        <div className={styles.albumTrackNumCol}>
                          {isCurrent && isPlaying ? (
                            <Pause size={14} fill="#ffffff" color="#ffffff" />
                          ) : (
                            <>
                              <span className={styles.trackIndexNum}>{track.trackNumber || (idx + 1)}</span>
                              <Play size={14} fill="#ffffff" color="#ffffff" className={styles.trackHoverPlayIcon} />
                            </>
                          )}
                        </div>

                        <div className={styles.albumTrackMainInfo}>
                          <div className={styles.albumTrackTitle}>
                            {track.title}
                          </div>
                          <div className={styles.albumTrackMeta}>
                            {track.explicit && <span className={styles.explicitTagSmall}>E</span>}
                            <span>{track.artist || selectedAlbum.artistName || activeArtist.name}</span>
                            {track.plays && (
                              <>
                                <span className={styles.albumDot}>•</span>
                                <span>{track.plays}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className={styles.albumTrackDuration}>
                          {track.duration || '3:30'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : viewMode === 'search' ? (
            /* ─── TELA DE RESULTADOS DO YOUTUBE MUSIC (Foto 2) ─── */
            <div className={styles.searchResultsContainer}>
              {/* Abas Secundárias: YT MUSIC | BIBLIOTECA */}
              <div className={styles.searchNavTabs}>
                <button
                  type="button"
                  className={`${styles.searchNavTab} ${searchSubTab === 'YT MUSIC' ? styles.searchNavTabActive : ''}`}
                  onClick={() => setSearchSubTab('YT MUSIC')}
                >
                  YT MUSIC
                </button>
                <button
                  type="button"
                  className={`${styles.searchNavTab} ${searchSubTab === 'BIBLIOTECA' ? styles.searchNavTabActive : ''}`}
                  onClick={() => setSearchSubTab('BIBLIOTECA')}
                >
                  BIBLIOTECA
                </button>
              </div>

              {/* Barra de Filtros com Setas Horizontais (Foto 2) */}
              <div className={styles.pillsWrapper} style={{ paddingTop: '0.65rem' }}>
                <button
                  type="button"
                  className={styles.arrowBtn}
                  onClick={() => scrollSearchFilters('left')}
                  aria-label="Rolar filtros para esquerda"
                >
                  <ChevronLeft size={18} />
                </button>

                <nav className={styles.pillsBar} ref={searchFilterBarRef}>
                  {SEARCH_FILTER_PILLS.map((pill) => (
                    <button
                      key={pill}
                      type="button"
                      onClick={() => setSelectedSearchFilter(pill)}
                      className={`${styles.pillBtn} ${selectedSearchFilter === pill ? styles.pillBtnActive : ''}`}
                    >
                      {pill}
                    </button>
                  ))}
                </nav>

                <button
                  type="button"
                  className={styles.arrowBtn}
                  onClick={() => scrollSearchFilters('right')}
                  aria-label="Rolar filtros para direita"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* ─── HERO CARD DIVIDIDO (Foto 2: Card de Artista + Top 3 Músicas) ─── */}
              <div className={styles.searchHeroSplitCard}>
                {/* Lado Esquerdo: Card de Destaque do Artista (Ao clicar, entra no perfil - Foto 3) */}
                <div
                  className={styles.searchHeroArtistCard}
                  onClick={() => openArtistProfile(activeArtist.name)}
                  title={`Abrir perfil do artista ${activeArtist.name}`}
                >
                  <ChevronRight size={18} className={styles.artistCardChevronIcon} />
                  <img
                    src={activeArtist.avatarImg || '/img/bk_avatar.png'}
                    alt={activeArtist.name}
                    className={styles.artistAvatarImage}
                    referrerPolicy="no-referrer"
                    onError={(e) => { e.currentTarget.src = '/img/bk_avatar.png'; }}
                  />
                  <h2 className={styles.artistHighlightTitle}>{activeArtist.name}</h2>
                  <p className={styles.artistHighlightSub}>
                    Artista • {activeArtist.listeners}
                  </p>
                  <div className={styles.artistHighlightButtons} onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className={styles.btnArtistShuffle}
                      onClick={() => {
                        setIsShuffle(true);
                        if (tracks.length > 0) playTrack(tracks[0]);
                      }}
                    >
                      <Shuffle size={16} />
                      <span>Aleatório</span>
                    </button>
                    <button
                      type="button"
                      className={styles.btnArtistMix}
                      onClick={() => tracks.length > 0 && playTrack(tracks[0])}
                    >
                      <Radio size={16} />
                      <span>Mix</span>
                    </button>
                  </div>
                </div>

                {/* Lado Direito: Preview das 3 Melhores Músicas (Foto 2) */}
                <div className={styles.searchHeroTracksCol}>
                  {tracks.slice(0, 3).map((track) => {
                    const isCurrent = currentTrack?.id === track.id;
                    return (
                      <div
                        key={track.id}
                        className={`${styles.heroTrackRow} ${isCurrent ? styles.heroTrackRowActive : ''}`}
                        onClick={() => playTrack(track)}
                      >
                        <div className={styles.heroTrackThumbWrap}>
                          <img
                            src={track.cover || '/img/logo-devsongs.png'}
                            alt={track.title}
                            className={styles.heroTrackThumb}
                            referrerPolicy="no-referrer"
                            onError={(e) => { e.currentTarget.src = '/img/logo-devsongs.png'; }}
                          />
                          <div className={styles.heroTrackPlayHover}>
                            {isCurrent && isPlaying ? (
                              <Pause size={18} fill="#ffffff" color="#ffffff" />
                            ) : (
                              <Play size={18} fill="#ffffff" color="#ffffff" style={{ marginLeft: 2 }} />
                            )}
                          </div>
                        </div>

                        <div className={styles.heroTrackInfo}>
                          <span className={`${styles.heroTrackName} ${isCurrent ? styles.heroTrackNameActive : ''}`}>
                            {track.title}
                          </span>
                          <span className={styles.heroTrackSubtitle}>
                            Música • {track.duration || '3:30'} • {track.plays}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ─── DEMAIS MÚSICAS ENCONTRADAS (Foto 2) ─── */}
              <div className={styles.searchResultsList}>
                {tracks.slice(3).map((track) => {
                  const isCurrent = currentTrack?.id === track.id;
                  return (
                    <div
                      key={track.id}
                      className={`${styles.resultTrackItem} ${isCurrent ? styles.resultTrackItemActive : ''}`}
                      onClick={() => playTrack(track)}
                    >
                      <div className={styles.resultTrackThumbWrap}>
                        <img
                          src={track.cover || '/img/logo-devsongs.png'}
                          alt={track.title}
                          className={styles.resultTrackThumb}
                          referrerPolicy="no-referrer"
                          onError={(e) => { e.currentTarget.src = '/img/logo-devsongs.png'; }}
                        />
                        <div className={styles.resultTrackPlayHover}>
                          {isCurrent && isPlaying ? (
                            <Pause size={16} fill="#ffffff" color="#ffffff" />
                          ) : (
                            <Play size={16} fill="#ffffff" color="#ffffff" style={{ marginLeft: 2 }} />
                          )}
                        </div>
                      </div>

                      <div className={styles.resultTrackInfo}>
                        <span className={`${styles.resultTrackTitle} ${isCurrent ? styles.resultTrackTitleActive : ''}`}>
                          {track.title}
                        </span>
                        <span className={styles.resultTrackMeta}>
                          Música • {track.artist} • {track.plays}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ─── PERFIL DO ARTISTA MANTIDO (Foto 3) ─── */
            <>
              {/* YouTube Music Mood / Activity Pills with arrows (Foto 3) */}
              <div className={styles.pillsWrapper}>
                <button className={styles.arrowBtn} onClick={() => scrollPills('left')} aria-label="Rolar para esquerda">
                  <ChevronLeft size={18} />
                </button>

                <nav className={styles.pillsBar} ref={pillsBarRef}>
                  {YT_PILLS.map((pill) => (
                    <button
                      key={pill}
                      type="button"
                      onClick={() => {
                        setSelectedPill(pill);
                        if (pill === 'Romance') openArtistProfile('Justin Bieber');
                        else if (pill === 'Energia') openArtistProfile('BK');
                        else if (pill === 'Foco') fetchArtistTracks('Lo-Fi');
                        else if (pill === 'Para treinar') fetchArtistTracks('Travis Scott');
                      }}
                      className={`${styles.pillBtn} ${selectedPill === pill ? styles.pillBtnActive : ''}`}
                    >
                      {pill}
                    </button>
                  ))}
                </nav>

                <button className={styles.arrowBtn} onClick={() => scrollPills('right')} aria-label="Rolar para direita">
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Banner Cinematográfico do Artista (Foto 3) */}
              <section
                className={styles.artistBannerContainer}
                style={{ backgroundImage: `url('${activeArtist.bannerImg || '/img/artist_banner_justin.jpg'}')` }}
              >
                <div className={styles.bannerContent}>
                  <h1 className={styles.bannerArtistTitle}>{activeArtist.name}</h1>
                  <p className={styles.bannerMonthlyListeners}>{activeArtist.listeners}</p>
                  <p className={styles.bannerBio}>
                    {activeArtist.bio}
                    <span
                      className={styles.bannerBioMore}
                      onClick={() => setIsBioExpanded(!isBioExpanded)}
                    >
                      {isBioExpanded ? ' MENOS' : ' MAIS'}
                    </span>
                  </p>

                  {/* Botões de Ação do Banner (Foto 3) */}
                  <div className={styles.bannerActionsRow}>
                    <button
                      type="button"
                      className={styles.btnAleatorio}
                      onClick={() => {
                        setIsShuffle(true);
                        handleNextTrack();
                      }}
                    >
                      <Shuffle size={18} color="#090909" />
                      <span>Aleatório</span>
                    </button>

                    <button
                      type="button"
                      className={styles.btnMix}
                      onClick={() => tracks.length > 0 && playTrack(tracks[0])}
                    >
                      <Radio size={18} color="#090909" />
                      <span>Mix</span>
                    </button>

                    <button
                      type="button"
                      className={styles.btnSubscribe}
                      onClick={() => alert('Inscrição confirmada!')}
                    >
                      <span>Inscrever-se {activeArtist.subscribers || '78,6 mi'}</span>
                    </button>

                    <button type="button" className={styles.btnMoreOptions} title="Mais opções">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>
              </section>

              {/* ─── TABELA "TOP MÚSICAS" (Foto 3) ────────── */}
              <div className={styles.scrollArea}>
                <section className={styles.topMusicasSection}>
                  <h2 className={styles.topMusicasHeading}>Top músicas</h2>

                  {isSearching ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#a7a7a7' }}>
                      Carregando faixas...
                    </div>
                  ) : (
                    <>
                      <div className={styles.topMusicasTable}>
                        {(showAllTopTracks ? tracks : tracks.slice(0, 5)).map((track) => {
                          const isCurrent = currentTrack?.id === track.id;
                          return (
                            <div
                              key={track.id}
                              className={`${styles.topMusicasRow} ${isCurrent ? styles.topMusicasRowActive : ''}`}
                              onClick={() => playTrack(track)}
                            >
                              <div className={styles.topMusicasColTitle}>
                                <div className={styles.topMusicasPlayIcon}>
                                  {isCurrent && isPlaying ? (
                                    <Pause size={13} fill="#ffffff" color="#ffffff" />
                                  ) : (
                                    <Play size={13} fill={isCurrent ? '#ffffff' : '#ffffff'} color="#ffffff" />
                                  )}
                                </div>
                                <img
                                  src={track.cover || '/img/logo-devsongs.png'}
                                  alt={track.title}
                                  className={styles.topMusicasThumb}
                                  referrerPolicy="no-referrer"
                                  onError={(e) => { e.currentTarget.src = '/img/logo-devsongs.png'; }}
                                />
                                <span className={`${styles.topMusicasTrackName} ${isCurrent ? styles.topMusicasTrackNamePlaying : ''}`}>
                                  {track.title}
                                </span>
                              </div>

                              <div className={styles.topMusicasColArtist}>
                                {track.explicit && <span className={styles.explicitBadge}>E</span>}
                                <span>{track.artist}</span>
                              </div>

                              <div className={styles.topMusicasColPlays}>
                                {track.plays}
                              </div>

                              <div className={styles.topMusicasColAlbum}>
                                {track.album}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className={styles.mostrarTudoWrap}>
                        <button
                          type="button"
                          className={styles.btnMostrarTudo}
                          onClick={() => setShowAllTopTracks(!showAllTopTracks)}
                        >
                          {showAllTopTracks ? 'Mostrar menos' : 'Mostrar tudo'}
                        </button>
                      </div>
                    </>
                  )}
                </section>

                {/* ─── SEÇÃO ÁLBUNS (Foto 3) ────────────────────────── */}
                <section className={styles.carouselSection}>
                  <div className={styles.sectionHeaderRow}>
                    <h2 className={styles.sectionHeading}>Álbuns</h2>
                    <div className={styles.sectionNavControls}>
                      <button
                        type="button"
                        className={styles.btnMais}
                        onClick={() => setShowAllTopTracks(true)}
                      >
                        Mais
                      </button>
                      <button
                        type="button"
                        className={styles.carouselArrowBtn}
                        onClick={() => scrollRow(albumsRowRef, 'left')}
                        aria-label="Rolar álbuns para esquerda"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        type="button"
                        className={styles.carouselArrowBtn}
                        onClick={() => scrollRow(albumsRowRef, 'right')}
                        aria-label="Rolar álbuns para direita"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.cardsRow} ref={albumsRowRef}>
                    {albums.map((album) => (
                      <div
                        key={album.id}
                        className={styles.mediaCard}
                        onClick={() => handleSelectAlbum(album)}
                      >
                        <div className={styles.mediaCoverWrap}>
                          <img
                            src={album.cover || '/img/logo-devsongs.png'}
                            alt={album.title}
                            className={styles.mediaCover}
                            referrerPolicy="no-referrer"
                            onError={(e) => { e.currentTarget.src = '/img/logo-devsongs.png'; }}
                          />
                          <div className={styles.cardPlayOverlay}>
                            <Play size={24} fill="#ffffff" color="#ffffff" />
                          </div>
                        </div>
                        <h3 className={styles.mediaCardTitle} title={album.title}>
                          {album.title}
                        </h3>
                        <div className={styles.mediaCardSubtitle}>
                          {album.explicit && <span className={styles.explicitBadge}>E</span>}
                          <span>{album.year}</span>
                          <span className={styles.albumDot}>•</span>
                          <span className={styles.albumTypeLabel}>Álbum</span>
                        </div>
                        {album.priceSale && (
                          <div className={styles.mediaCardPricing}>
                            <span className={styles.priceSaleTag} title="Preço de Compra">Comprar {album.priceSale}</span>
                            <span className={styles.priceRentTag} title="Aluguel por 30 dias">Alugar {album.priceRent}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* ─── SEÇÃO SINGLES E EPs (Foto 3) ──────────────────── */}
                <section className={styles.carouselSection}>
                  <div className={styles.sectionHeaderRow}>
                    <h2 className={styles.sectionHeading}>Singles e EPs</h2>
                    <div className={styles.sectionNavControls}>
                      <button
                        type="button"
                        className={styles.btnMais}
                        onClick={() => setShowAllTopTracks(true)}
                      >
                        Mais
                      </button>
                      <button
                        type="button"
                        className={styles.carouselArrowBtn}
                        onClick={() => scrollRow(singlesRowRef, 'left')}
                        aria-label="Rolar singles para esquerda"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        type="button"
                        className={styles.carouselArrowBtn}
                        onClick={() => scrollRow(singlesRowRef, 'right')}
                        aria-label="Rolar singles para direita"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.cardsRow} ref={singlesRowRef}>
                    {singles.map((single) => (
                      <div
                        key={single.id}
                        className={styles.mediaCard}
                        onClick={() => handleSelectAlbum(single)}
                      >
                        <div className={styles.mediaCoverWrap}>
                          <img
                            src={single.cover || '/img/logo-devsongs.png'}
                            alt={single.title}
                            className={styles.mediaCover}
                            referrerPolicy="no-referrer"
                            onError={(e) => { e.currentTarget.src = '/img/logo-devsongs.png'; }}
                          />
                          <div className={styles.cardPlayOverlay}>
                            <Play size={24} fill="#ffffff" color="#ffffff" />
                          </div>
                        </div>
                        <h3 className={styles.mediaCardTitle} title={single.title}>
                          {single.title}
                        </h3>
                        <div className={styles.mediaCardSubtitle}>
                          {single.explicit && <span className={styles.explicitBadge}>E</span>}
                          <span>{single.year}</span>
                          <span className={styles.albumDot}>•</span>
                          <span className={styles.albumTypeLabel}>Single / EP</span>
                        </div>
                        {single.priceSale && (
                          <div className={styles.mediaCardPricing}>
                            <span className={styles.priceSaleTag} title="Preço de Compra">Comprar {single.priceSale}</span>
                            <span className={styles.priceRentTag} title="Aluguel por 30 dias">Alugar {single.priceRent}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </>
          )}
        </main>

        {/* ─── FLOATING MINI-PLAYER (Só aparece quando tem música tocando) ─── */}
        {currentTrack && (
          <div
            className={`${styles.floatingMiniPlayer} ${currentTrack ? styles.floatingMiniPlayerActive : ''}`}
            title={`${currentTrack.title} — ${currentTrack.artist}`}
            onClick={() => setShowVideoDock(!showVideoDock)}
          >
            <img
              src={currentTrack.cover}
              alt="Mini player cover"
              className={styles.floatingMiniCover}
            />
            <div className={styles.floatingMiniOverlay}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                className={styles.floatingMiniPlayBtn}
                aria-label={isPlaying ? 'Pausar' : 'Tocar'}
              >
                {isPlaying ? (
                  <Pause size={20} fill="#ffffff" color="#ffffff" />
                ) : (
                  <Play size={20} fill="#ffffff" color="#ffffff" style={{ marginLeft: 2 }} />
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── YOUTUBE MUSIC VIDEO DOCK ───────────────────────────── */}
        <div className={showVideoDock ? styles.youtubeDock : styles.youtubeDockHidden}>
          <div className={styles.dockHeader}>
            <span>🎬 Clipe Oficial: {currentTrack?.title}</span>
            <button
              type="button"
              onClick={() => setShowVideoDock(false)}
              className={styles.dockCloseBtn}
              title="Fechar clipe"
            >
              <Minimize2 size={13} />
            </button>
          </div>
          <div style={{ width: '100%', height: 'calc(100% - 25px)' }}>
            <div id="devsongs-yt-frame" style={{ width: '100%', height: '100%' }} />
          </div>
        </div>

        {/* ─── BOTTOM STICKY PLAYER (Spotify + YouTube Music) ────── */}
        {currentTrack && (
          <footer className={styles.stickyPlayer}>
            {/* Player Left: Current Track */}
            <div className={styles.playerLeft}>
              <div className={styles.playerCoverWrap}>
                <img
                  src={currentTrack?.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
                  alt={currentTrack?.title}
                  className={styles.playerCover}
                />
              </div>

              <div className={styles.playerTrackDetails}>
                <span className={styles.playerTrackTitle}>{currentTrack?.title || 'Selecione uma faixa'}</span>
                <span className={styles.playerTrackArtist}>{currentTrack?.artist || 'Artista'}</span>
              </div>

              <button
                type="button"
                onClick={() => currentTrack && toggleLike(currentTrack.id)}
                className={`${styles.likeBtn} ${currentTrack && likedMap[currentTrack.id] ? styles.likeBtnActive : ''}`}
                title="Salvar na sua biblioteca"
              >
                <Heart size={18} fill={currentTrack && likedMap[currentTrack.id] ? '#1ed760' : 'none'} />
              </button>
            </div>

            {/* Player Center: Controls & Scrubber */}
            <div className={styles.playerCenter}>
              <div className={styles.controlButtons}>
                <button
                  type="button"
                  onClick={() => setIsShuffle(!isShuffle)}
                  className={`${styles.controlBtn} ${isShuffle ? styles.controlBtnActive : ''}`}
                  title="Ordem aleatória"
                >
                  <Shuffle size={16} />
                </button>

                <button
                  type="button"
                  onClick={handlePrevTrack}
                  className={styles.controlBtn}
                  title="Faixa anterior"
                >
                  <SkipBack size={20} fill="currentColor" />
                </button>

                <button
                  type="button"
                  onClick={togglePlayPause}
                  className={styles.playPauseBtn}
                  title={isPlaying ? 'Pausar' : 'Reproduzir'}
                >
                  {isPlaying ? (
                    <Pause size={18} fill="#000000" />
                  ) : (
                    <Play size={18} fill="#000000" style={{ marginLeft: 2 }} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleNextTrack}
                  className={styles.controlBtn}
                  title="Próxima faixa"
                >
                  <SkipForward size={20} fill="currentColor" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsRepeat(!isRepeat)}
                  className={`${styles.controlBtn} ${isRepeat ? styles.controlBtnActive : ''}`}
                  title="Repetir"
                >
                  <Repeat size={16} />
                </button>
              </div>

              {/* Interactive Full Song Scrubber */}
              <div className={styles.scrubBarRow}>
                <span className={styles.timeDisplay}>{formatSeconds(currentTime)}</span>
                <div
                  className={styles.progressBarContainer}
                  onClick={handleSeek}
                  title="Avançar / Retroceder na música inteira"
                >
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%` }}
                  >
                    <div className={styles.progressBarThumb} />
                  </div>
                </div>
                <span className={styles.timeDisplay}>{formatSeconds(duration)}</span>
              </div>
            </div>

            {/* Player Right: Volume, Video dock trigger and Close X button */}
            <div className={styles.playerRight}>
              <button
                type="button"
                onClick={() => setShowVideoDock(!showVideoDock)}
                className={`${styles.controlBtn} ${showVideoDock ? styles.controlBtnActive : ''}`}
                title="Abrir Clipe Oficial (YouTube Music)"
              >
                <Video size={18} />
              </button>

              <button
                type="button"
                onClick={toggleMute}
                className={styles.controlBtn}
                title={isMuted ? 'Desmutar' : 'Mutar'}
              >
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>

              <div
                className={styles.volumeBarContainer}
                onClick={handleVolumeChange}
                title="Ajustar Volume"
              >
                <div
                  className={styles.volumeBarFill}
                  style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                />
              </div>

              {/* Botão X para tirar/fechar a música */}
              <button
                type="button"
                onClick={handleClosePlayer}
                className={styles.closePlayerBtn}
                title="Fechar player / Tirar música"
                aria-label="Fechar player"
              >
                <X size={18} />
              </button>
            </div>
          </footer>
        )}

      </div>
    </>
  );
}
