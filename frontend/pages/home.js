import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import QRCode from 'qrcode';
import {
  Home, Compass, Bookmark, Award, Plus, Menu, Search,
  Tv, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat,
  Volume2, VolumeX, Video, Music, LogOut, ShieldCheck, Heart,
  ChevronLeft, ChevronRight, MoreVertical, Maximize2, Minimize2,
  Radio, X, PlayCircle, ListMusic, Building2, ChevronDown, CheckCircle2,
  Lock, CreditCard, QrCode, ShoppingBag, ShoppingCart, Trash2, ArrowRight, ArrowLeft,
  Check, Mail, Copy, Sparkles, Clock, Tag, Percent, Ticket,
  User, Shield, Headphones, Users, Disc, Zap
} from 'lucide-react';
import styles from '../styles/home.module.css';
import LibraryView from '../components/library/LibraryView';
import CommunityView from '../components/community/CommunityView';
import { getSafeCover } from '../utils/coverHelper';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Activity / Mood pills exatamente como no YouTube Music (Foto da Tela de Início)
const YT_PILLS = [
  'Podcasts', 'Festa', 'Romance', 'Para treinar', 'Energia', 'Positividade',
  'Para ouvir no trânsito', 'Relax', 'Triste', 'Foco', 'Para dormir'
];

// Seção "Escolha a dedo" (12 faixas em 3 colunas x 4 linhas - Foto da Tela de Início)
const HOME_ESCOLHA_A_DEDO = [
  {
    id: 'ead-1',
    title: 'LUZ, CAMA E AÇÃO',
    artist: 'Alee, Mc Cabelinho e Qualy.wav1',
    album: 'CAOS DLX',
    cover: 'https://cdn-images.dzcdn.net/images/cover/6646c5f4c6b60b0ddd4f00987623437c/500x500-000000-80-0-0.jpg',
    plays: 'CAOS DLX',
    durationSec: 184,
    duration: '3:04',
    explicit: true
  },
  {
    id: 'ead-2',
    title: 'One Less Lonely Girl',
    artist: 'Justin Bieber',
    album: 'My World',
    cover: 'https://cdn-images.dzcdn.net/images/cover/a40e48bd5bae166186dc04c57efdae7a/500x500-000000-80-0-0.jpg',
    plays: 'Tocou 648 mi vezes • My World',
    durationSec: 229,
    duration: '3:49',
    explicit: false
  },
  {
    id: 'ead-3',
    title: '100% MOLHO',
    artist: 'Brandão85, Jovem Dex, Leviano',
    album: 'ISSO É TRAP',
    cover: 'https://cdn-images.dzcdn.net/images/cover/823c311b28a72801b809da4d99c621f4/500x500-000000-80-0-0.jpg',
    plays: 'ISSO É TRAP',
    durationSec: 165,
    duration: '2:45',
    explicit: true
  },
  {
    id: 'ead-4',
    title: 'Girassóis de Van Gogh',
    artist: 'Baco Exu do Blues',
    album: 'Bluesman',
    cover: 'https://cdn-images.dzcdn.net/images/cover/0421054a6a7d8cb4e52dd27ff4deef2c/500x500-000000-80-0-0.jpg',
    plays: 'Tocou 240 mi vezes • Bluesman',
    durationSec: 198,
    duration: '3:18',
    explicit: false
  },
  {
    id: 'ead-5',
    title: 'Amanhecer',
    artist: 'BK, Nansy Silvvz e Gigantes',
    album: 'ICARUS',
    cover: 'https://cdn-images.dzcdn.net/images/cover/927397ea14b00eba92454a88ec4f352d/500x500-000000-80-0-0.jpg',
    plays: 'Tocou 18 mi vezes • ICARUS',
    durationSec: 215,
    duration: '3:35',
    explicit: false
  },
  {
    id: 'ead-6',
    title: 'Procuro Alguém',
    artist: 'Djonga e Coyote Beat',
    album: 'Histórias da Minha Área',
    cover: 'https://cdn-images.dzcdn.net/images/cover/86427da38e1e93f57746964d3851f9fb/500x500-000000-80-0-0.jpg',
    plays: 'Histórias da Minha Área',
    durationSec: 192,
    duration: '3:12',
    explicit: false
  },
  {
    id: 'ead-7',
    title: 'a última dança',
    artist: 'Link do Zap e pluglip',
    album: 'a última dança',
    cover: 'https://cdn-images.dzcdn.net/images/cover/8aaff6e465612a73a87fa9c666d74ba8/500x500-000000-80-0-0.jpg',
    plays: 'Tocou 9 mi vezes • a última dança',
    durationSec: 142,
    duration: '2:22',
    explicit: false
  },
  {
    id: 'ead-8',
    title: 'Superpowers',
    artist: 'Daniel Caesar',
    album: 'NEVER ENOUGH',
    cover: 'https://cdn-images.dzcdn.net/images/cover/0d571082af7c78114321031d7f84d331/1000x1000-000000-80-0-0.jpg',
    plays: 'Tocou 85 mi vezes • NEVER ENOUGH',
    durationSec: 174,
    duration: '2:54',
    explicit: false
  },
  {
    id: 'ead-9',
    title: 'PENSANDO EM MIM',
    artist: 'Matchola e 2ZDINIZ',
    album: 'PENSANDO EM MIM',
    cover: 'https://cdn-images.dzcdn.net/images/cover/31b86e4b5a5dc901013878cb70cdb66d/500x500-000000-80-0-0.jpg',
    plays: 'PENSANDO EM MIM',
    durationSec: 153,
    duration: '2:33',
    explicit: true
  },
  {
    id: 'ead-10',
    title: 'desgraçadagostosamaldita',
    artist: 'WIU',
    album: 'Vagabundo de Luxo',
    cover: 'https://cdn-images.dzcdn.net/images/cover/3ef64652d6f7da29ce07bc38a11093a3/500x500-000000-80-0-0.jpg',
    plays: 'Tocou 24 mi vezes • Vagabundo de Luxo',
    durationSec: 168,
    duration: '2:48',
    explicit: true
  },
  {
    id: 'ead-11',
    title: 'Vênus',
    artist: 'VMZ',
    album: 'Vênus',
    cover: 'https://cdn-images.dzcdn.net/images/cover/cb93b1b278ab21cbc2661e19816b1874/500x500-000000-80-0-0.jpg',
    plays: 'Tocou 13 mi vezes • Vênus',
    durationSec: 161,
    duration: '2:41',
    explicit: true
  },
  {
    id: 'ead-12',
    title: 'M4',
    artist: 'Teto e Matuê',
    album: 'M4',
    cover: 'https://cdn-images.dzcdn.net/images/cover/2001711833ffbd1db9c156bc2422e929/500x500-000000-80-0-0.jpg',
    plays: 'Tocou 422 mi vezes • M4',
    durationSec: 155,
    duration: '2:35',
    explicit: true
  }
];

// Seção "Álbuns para você" (Carrossel Horizontal - Foto da Tela de Início)
const HOME_ALBUNS_PARA_VOCE = [
  {
    id: 'hpv-1',
    title: 'Bluesman',
    artist: 'Baco Exu do Blues',
    year: '2018',
    cover: 'https://cdn-images.dzcdn.net/images/cover/0421054a6a7d8cb4e52dd27ff4deef2c/500x500-000000-80-0-0.jpg',
    explicit: true
  },
  {
    id: 'hpv-2',
    title: 'NU',
    artist: 'Djonga',
    year: '2021',
    cover: 'https://cdn-images.dzcdn.net/images/cover/4df1597321ee02c46b995bf7746e3bb5/500x500-000000-80-0-0.jpg',
    explicit: true
  },
  {
    id: 'hpv-3',
    title: 'QVVJFA?',
    artist: 'Baco Exu do Blues',
    year: '2022',
    cover: 'https://cdn-images.dzcdn.net/images/cover/ca1787fb655df1405ff3bebea7c6add8/500x500-000000-80-0-0.jpg',
    explicit: true
  },
  {
    id: 'hpv-4',
    title: 'Histórias da Minha Área',
    artist: 'Djonga',
    year: '2020',
    cover: 'https://cdn-images.dzcdn.net/images/cover/86427da38e1e93f57746964d3851f9fb/500x500-000000-80-0-0.jpg',
    explicit: true
  },
  {
    id: 'hpv-5',
    title: 'ICARUS',
    artist: 'BK',
    year: '2022',
    cover: 'https://cdn-images.dzcdn.net/images/cover/927397ea14b00eba92454a88ec4f352d/500x500-000000-80-0-0.jpg',
    explicit: true
  },
  {
    id: 'hpv-6',
    title: 'OPROPRIO',
    artist: 'Yago Oproprio',
    year: '2024',
    cover: 'https://cdn-images.dzcdn.net/images/cover/6dd843f77dec969a1e1f92ee965403a6/500x500-000000-80-0-0.jpg',
    explicit: false
  }
];

// Tabela de anos reais de lançamento para álbuns canônicos (Djonga, BK, Baco, Matuê, Ret, etc.)
const getKnownAlbumYear = (title, artist) => {
  if (!title) return null;
  const clean = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const t = clean(title);
  const a = clean(artist);

  // Djonga
  if (a.includes('djonga') || t.includes('djonga') || t.includes('heresia') || t.includes('meninoquequeriaserdeus') || t.includes('historiasdaminhaarea') || t.includes('odonodolugar') || t.includes('quantomaiseucomo')) {
    if (t.includes('heresia')) return '2017';
    if (t.includes('meninoquequeriaserdeus')) return '2018';
    if (t.includes('ladrao')) return '2019';
    if (t.includes('historiasdaminhaarea')) return '2020';
    if (t.includes('nu')) return '2021';
    if (t.includes('odonodolugar')) return '2022';
    if (t.includes('demotape') || t.includes('inocente')) return '2023';
    if (t.includes('quantomaiseucomo')) return '2024';
  }
  // BK' / Abebe Bikila
  if (a.includes('bk') || a.includes('abebe')) {
    if (t.includes('castelos')) return '2016';
    if (t.includes('gigantes')) return '2018';
    if (t.includes('lideremmovimento')) return '2020';
    if (t.includes('cidadedopecado')) return '2021';
    if (t.includes('icarus')) return '2022';
    if (t.includes('diamantes')) return '2025';
    if (t.includes('produtodoambiente')) return '2024';
  }
  // Baco Exu do Blues
  if (a.includes('baco')) {
    if (t.includes('esu')) return '2017';
    if (t.includes('bluesman')) return '2018';
    if (t.includes('bacanal')) return '2020';
    if (t.includes('qvvjfa') || t.includes('quantasvezes')) return '2022';
    if (t.includes('fetiche')) return '2024';
  }
  // Matuê
  if (a.includes('matue')) {
    if (t.includes('maquinadotempo')) return '2020';
    if (t.includes('333')) return '2024';
  }
  // Filipe Ret
  if (a.includes('ret')) {
    if (t.includes('vivaz')) return '2012';
    if (t.includes('revel')) return '2015';
    if (t.includes('audaz')) return '2018';
    if (t.includes('imaterial')) return '2021';
    if (t.includes('lume')) return '2022';
    if (t.includes('frxv')) return '2023';
  }
  // Veigh
  if (a.includes('veigh')) {
    if (t.includes('dosprediosdeluxe')) return '2023';
    if (t.includes('dospredios')) return '2022';
  }
  // KayBlack
  if (a.includes('kayblack')) {
    if (t.includes('contradicoes')) return '2023';
  }
  // Yago Oproprio
  if (a.includes('yago')) {
    if (t.includes('oproprio')) return '2024';
  }
  // L7NNON
  if (a.includes('l7nnon') || a.includes('l7')) {
    if (t.includes('podresdericos')) return '2019';
    if (t.includes('hiphoprare')) return '2020';
    if (t.includes('meespera')) return '2022';
    if (t.includes('irrastreavel')) return '2024';
  }
  // Orochi
  if (a.includes('orochi')) {
    if (t.includes('celebridade')) return '2020';
    if (t.includes('lobo')) return '2021';
    if (t.includes('vidacara')) return '2023';
  }
  // MC Cabelinho
  if (a.includes('cabelinho')) {
    if (t.includes('ainda')) return '2020';
    if (t.includes('littlehair')) return '2021';
    if (t.includes('littlelove')) return '2022';
  }
  // Teto
  if (a.includes('teto')) {
    if (t.includes('previas')) return '2021';
    if (t.includes('1010')) return '2024';
  }
  // Wiu
  if (a.includes('wiu')) {
    if (t.includes('manualdecomo')) return '2022';
    if (t.includes('vagabundodeluxo')) return '2024';
  }
  // Racionais MC's
  if (a.includes('racionais')) {
    if (t.includes('holocausto')) return '1990';
    if (t.includes('raioxbrasil')) return '1993';
    if (t.includes('sobrevivendonoinferno')) return '1997';
    if (t.includes('nadacomoum')) return '2002';
    if (t.includes('coresevalores')) return '2014';
  }
  // Sabotage
  if (a.includes('sabotage')) {
    if (t.includes('orap')) return '2001';
  }
  // Emicida
  if (a.includes('emicida')) {
    if (t.includes('gloriosoretorno')) return '2013';
    if (t.includes('sobrecriancas')) return '2015';
    if (t.includes('amarelo')) return '2019';
  }
  // Criolo
  if (a.includes('criolo')) {
    if (t.includes('aindahatempo')) return '2006';
    if (t.includes('nonaorelha')) return '2011';
    if (t.includes('convoqueseubuda')) return '2014';
    if (t.includes('espiral')) return '2017';
    if (t.includes('sobreviver')) return '2022';
  }
  // Justin Bieber
  if (a.includes('bieber')) {
    if (t.includes('myworld2')) return '2010';
    if (t.includes('myworld')) return '2009';
    if (t.includes('under') && t.includes('mistletoe')) return '2011';
    if (t.includes('believe')) return '2012';
    if (t.includes('journals')) return '2013';
    if (t.includes('purpose')) return '2015';
    if (t.includes('changes')) return '2020';
    if (t.includes('justice')) return '2021';
    if (t.includes('swag')) return '2025';
  }
  // Travis Scott
  if (a.includes('travis') && a.includes('scott')) {
    if (t.includes('rodeo')) return '2015';
    if (t.includes('birdsinthe')) return '2016';
    if (t.includes('astroworld')) return '2018';
    if (t.includes('utopia')) return '2023';
  }
  // Kendrick Lamar
  if (a.includes('kendrick')) {
    if (t.includes('section80')) return '2011';
    if (t.includes('goodkid')) return '2012';
    if (t.includes('butterfly')) return '2015';
    if (t.includes('damn')) return '2017';
    if (t.includes('mrmorale')) return '2022';
    if (t.includes('gnx')) return '2024';
  }
  return null;
};

const getDisplayAlbumYear = (albumOrTitle, artistName, fallbackYear) => {
  if (!albumOrTitle) return fallbackYear || '2024';
  const title = typeof albumOrTitle === 'object' ? albumOrTitle.title : albumOrTitle;
  const artist = typeof albumOrTitle === 'object' ? (albumOrTitle.artist || albumOrTitle.artistName || artistName) : artistName;
  const known = getKnownAlbumYear(title, artist);
  if (known) return known;
  if (typeof albumOrTitle === 'object' && albumOrTitle.year) return albumOrTitle.year;
  return fallbackYear || '2024';
};

// Top 5 faixas idênticas às exibidas na Foto 1
const JUSTIN_TOP_TRACKS = [
  {
    id: 'track-baby',
    title: 'Baby (part. Ludacris)',
    artist: 'Justin Bieber',
    album: 'My World 2.0',
    cover: 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025319/bookhub/img/justin_my_world.jpg',
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
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/89/59/6a/89596ab9-fa3c-8d08-4d95-a6450fa2013c/886449400515.jpg/600x600bb.jpg',
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
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/41/74/2f/41742f85-6c76-0918-3153-e725e2ab05c4/13UAEIM36000.rgb.jpg/600x600bb.jpg',
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
    cover: 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025318/bookhub/img/coachella_w2.jpg',
    explicit: true
  },
  {
    id: 'alb-coachella-1',
    title: 'SWAG LIVE FROM COACHELLA (Weekend I)',
    year: '2026',
    cover: 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025317/bookhub/img/coachella_w1.jpg',
    explicit: true
  },
  {
    id: 'alb-swag-2',
    title: 'SWAG II',
    year: '2025',
    cover: 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025326/bookhub/img/swag_two.jpg',
    explicit: true
  },
  {
    id: 'alb-swag',
    title: 'SWAG',
    year: '2025',
    cover: 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025324/bookhub/img/swag.jpg',
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
    cover: 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025319/bookhub/img/justin_my_world.jpg',
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
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/1d/04/18/1d04187c-76f4-9a83-8006-d09fafb7b02b/054391906199.jpg/600x600bb.jpg',
    explicit: false
  },
  {
    id: 'sgl-dontgo',
    title: "DON'T GO",
    year: '2021',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/85/92/1b/85921b3c-03e7-1034-d822-44658cf0b918/075679783806.jpg/600x600bb.jpg',
    explicit: false
  },
  {
    id: 'sgl-stay',
    title: 'STAY',
    year: '2021',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/89/59/6a/89596ab9-fa3c-8d08-4d95-a6450fa2013c/886449400515.jpg/600x600bb.jpg',
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
  'Tudo', 'Artistas', 'Músicas', 'Álbuns', 'Vídeos', 'Playlists da comunidade'
];

// Gerador Oficial EMV BR Code Pix (Banco Central do Brasil) com CRC-16/CCITT-FALSE
function generatePixBrCode({ pixKey, merchantName = 'DEVSONGS', merchantCity = 'SAO PAULO', amount, txid = '***' }) {
  const cleanStr = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9 ]/g, '').trim();

  const formatTLV = (id, val) => {
    const len = String(val.length).padStart(2, '0');
    return `${id}${len}${val}`;
  };

  const keyClean = (pixKey || '').trim();
  const sub00 = formatTLV('00', 'br.gov.bcb.pix');
  const sub01 = formatTLV('01', keyClean);
  const tag26 = formatTLV('26', `${sub00}${sub01}`);

  const tag00 = formatTLV('00', '01');
  const tag52 = formatTLV('52', '0000');
  const tag53 = formatTLV('53', '986'); // BRL
  
  let tag54 = '';
  if (amount && Number(amount) > 0) {
    const valFormatted = Number(amount).toFixed(2);
    tag54 = formatTLV('54', valFormatted);
  }

  const tag58 = formatTLV('58', 'BR');
  const nameClean = cleanStr(merchantName).slice(0, 25).toUpperCase() || 'DEVSONGS';
  const tag59 = formatTLV('59', nameClean);

  const cityClean = cleanStr(merchantCity).slice(0, 15).toUpperCase() || 'SAO PAULO';
  const tag60 = formatTLV('60', cityClean);

  const txidClean = (txid || '***').replace(/[^a-zA-Z0-9*]/g, '').slice(0, 25) || '***';
  const tag62 = formatTLV('62', formatTLV('05', txidClean));

  const rawPayload = `${tag00}${tag26}${tag52}${tag53}${tag54}${tag58}${tag59}${tag60}${tag62}6304`;

  // Cálculo rigoroso do CRC-16/CCITT-FALSE (polinômio 0x1021, init 0xFFFF)
  let crc = 0xFFFF;
  for (let i = 0; i < rawPayload.length; i++) {
    crc ^= (rawPayload.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');
  return `${rawPayload}${crcHex}`;
}

export const slugify = (text) => {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function HomeUnifiedYouTubeMusic(props = {}) {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [exploreFilter, setExploreFilter] = useState('all');

  const openArtistProfileRef = useRef(null);
  const handleSelectAlbumRef = useRef(null);
  const navigateToRef = useRef(null);

  useEffect(() => {
    if (!router.isReady) return;
    if (props.forcedViewMode === 'artist' || props.forcedArtist) {
      const artName = props.forcedArtist || router.query.id;
      if (artName && openArtistProfileRef.current) {
        const cleanName = String(artName).replace(/-/g, ' ');
        openArtistProfileRef.current(cleanName, artName);
      }
    } else if (props.forcedViewMode === 'album' || props.forcedAlbumId) {
      const albId = props.forcedAlbumId || router.query.id;
      if (albId && handleSelectAlbumRef.current) {
        handleSelectAlbumRef.current({ id: albId, albumId: albId });
      }
    } else if (props.forcedPlaylistId) {
      setSelectedSidebarPlaylistId(props.forcedPlaylistId);
      setActiveTab('biblioteca');
      setViewMode('home');
    } else if (props.forcedTab) {
      setActiveTab(props.forcedTab);
      setViewMode('home');
    } else if (router.query.tab === 'biblioteca' || router.query.playlist) {
      setActiveTab('biblioteca');
      setViewMode('home');
    } else if (router.query.artist) {
      if (openArtistProfileRef.current) {
        openArtistProfileRef.current(router.query.artist);
      }
    }
  }, [router.isReady, router.query, props.forcedTab, props.forcedArtist, props.forcedAlbumId, props.forcedPlaylistId, props.forcedViewMode]);

  const handlePlayLibraryTrack = (track, contextQueue = null, contextName = null) => {
    if (!track) return;
    if (track.isExpired || track.is_expired || track.isLocked || track.is_locked || track.canPlay === false || track.can_play === false) {
      console.warn('Faixa com aluguel expirado ou bloqueada:', track.title);
      return;
    }
    const isStreamAllowed = track.available_for_stream !== false;
    const playObj = {
      id: track.id ? (String(track.id).startsWith('ct-') ? track.id : `ct-${track.id}`) : track.dbTrackId,
      dbTrackId: track.dbTrackId || Number(String(track.id).replace('ct-', '')),
      title: track.title,
      artist: track.artist || track.artist_name || selectedAlbum?.artist_name || 'Artista',
      album: track.album || track.album_title || selectedAlbum?.title || 'Single',
      album_id: track.album_id || track.albumId || selectedAlbum?.id || null,
      albumId: track.album_id || track.albumId || selectedAlbum?.id || null,
      genre: track.genre || selectedAlbum?.genre || 'Variado',
      cover: track.cover_url || track.cover || selectedAlbum?.cover_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png',
      preview: track.preview_url || track.preview,
      youtubeVideoId: track.youtube_video_id || track.youtubeVideoId || null,
      durationSec: track.duration_sec || track.durationSec || 210,
      duration: track.duration || `${Math.floor((track.duration_sec || 210)/60)}:${String((track.duration_sec || 210)%60).padStart(2, '0')}`,
      available_for_stream: isStreamAllowed,
      canPlay: true,
      can_play: true,
      isExpired: false,
      isLocked: false
    };
    playTrack(playObj, true, contextQueue, contextName || playObj.album || 'Sua Biblioteca');
  };

  const handlePlayLibraryQueue = (tracksList, startIndex = 0, contextName = null) => {
    if (!tracksList || tracksList.length === 0) return;
    // Exclui automaticamente músicas com aluguel expirado ou bloqueadas da fila
    const playableTracks = tracksList.filter(t => {
      if (t.isExpired || t.is_expired) return false;
      if (t.isLocked || t.is_locked) return false;
      if (t.canPlay === false || t.can_play === false) return false;
      return true;
    });
    if (playableTracks.length === 0) {
      console.warn('Nenhuma faixa com reprodução autorizada disponível na lista.');
      return;
    }
    const mapped = playableTracks.map((t, idx) => ({
      ...t,
      id: t.id ? (String(t.id).startsWith('ct-') ? t.id : `ct-${t.id}`) : (t.dbTrackId ? `ct-${t.dbTrackId}` : `trk-${idx}`),
      dbTrackId: t.dbTrackId || Number(String(t.id || '').replace('ct-', '')) || null,
      title: t.title,
      artist: t.artist || t.artist_name || 'Artista',
      album: t.album || t.album_title || 'Single',
      genre: t.genre || 'Variado',
      cover: t.cover_url || t.cover || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png',
      preview: t.preview_url || t.preview,
      youtubeVideoId: t.youtube_video_id || t.youtubeVideoId || null,
      durationSec: t.duration_sec || t.durationSec || 210,
      duration: t.duration || `${Math.floor((t.duration_sec || 210)/60)}:${String((t.duration_sec || 210)%60).padStart(2, '0')}`,
      available_for_stream: true,
      canPlay: true,
      can_play: true,
      isExpired: false,
      isLocked: false
    }));

    let safeIndex = startIndex >= 0 && startIndex < mapped.length ? startIndex : 0;
    // Se o modo aleatório estiver ativo e o usuário clicou no botão principal (startIndex === 0), sorteia a faixa inicial
    if (isShuffle && startIndex === 0 && mapped.length > 1) {
      safeIndex = Math.floor(Math.random() * mapped.length);
    }
    const startTrack = mapped[safeIndex] || mapped[0];

    // Carrega TODAS as músicas da playlist na fila contextual ("Próximas de: [Contexto]")!
    playTrack(startTrack, true, mapped, contextName || startTrack.album || 'Sua Biblioteca');
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarPlaylists, setSidebarPlaylists] = useState([]);
  const [selectedSidebarPlaylistId, setSelectedSidebarPlaylistId] = useState(null);
  const [playingPlaylistId, setPlayingPlaylistId] = useState(null);
  const [triggerCreatePlaylist, setTriggerCreatePlaylist] = useState(0);

  // Auto-abrir a barra lateral em telas desktop amplas (padrão YouTube Music)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1200) {
      setSidebarOpen(true);
    }
  }, []);

  const fetchSidebarPlaylists = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setSidebarPlaylists([]);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/library/playlists`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.playlists) {
        setSidebarPlaylists(data.playlists);
      }
    } catch (err) {
      console.warn('Erro ao atualizar playlists da barra lateral:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchSidebarPlaylists();
    const handleUpdate = () => fetchSidebarPlaylists();
    window.addEventListener('devsongs:playlists_updated', handleUpdate);
    return () => {
      window.removeEventListener('devsongs:playlists_updated', handleUpdate);
    };
  }, [fetchSidebarPlaylists]);

  const handleSidebarNewPlaylist = () => {
    setActiveTab('biblioteca');
    setViewMode('home');
    setSelectedAlbum(null);
    setSelectedCompany(null);
    setSelectedSidebarPlaylistId(null);
    setTriggerCreatePlaylist(Date.now());
    window.dispatchEvent(new CustomEvent('devsongs:open_create_playlist'));
  };

  const handleOpenSidebarPlaylist = (pl) => {
    setSelectedSidebarPlaylistId(pl.id);
    setActiveTab('biblioteca');
    setViewMode('home');
    setSelectedAlbum(null);
    setSelectedCompany(null);
    setActiveArtist(null);
    if (typeof window !== 'undefined' && window.location.pathname !== `/playlist/${pl.id}`) {
      window.history.pushState({ devsongsView: 'home', playlistId: pl.id }, '', `/playlist/${pl.id}`);
    }
  };

  const handlePlaySidebarPlaylist = async (pl) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_URL}/api/library/playlists/${pl.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (!res.ok || !data.playlist) {
        setPurchaseNotice({ text: 'Não foi possível carregar as faixas desta playlist.', type: 'error' });
        setTimeout(() => setPurchaseNotice(null), 3500);
        return;
      }
      const pTracks = data.playlist.tracks || [];
      if (pTracks.length === 0) {
        setPurchaseNotice({ text: `A playlist "${pl.name}" está vazia. Adicione músicas para reproduzir.`, type: 'info' });
        setTimeout(() => setPurchaseNotice(null), 3500);
        return;
      }
      setPlayingPlaylistId(pl.id);
      handlePlayLibraryQueue(pTracks, 0, pl.name);
    } catch (err) {
      console.error('Erro ao reproduzir playlist pela sidebar:', err);
    }
  };
  const [selectedPill, setSelectedPill] = useState('Energia');
  const [tracks, setTracks] = useState(HOME_ESCOLHA_A_DEDO);
  const [escolhaADedo, setEscolhaADedo] = useState(HOME_ESCOLHA_A_DEDO);
  const [albunsParaVoce, setAlbunsParaVoce] = useState(HOME_ALBUNS_PARA_VOCE);
  const [recsSource, setRecsSource] = useState(null);
  const [showAllTopTracks, setShowAllTopTracks] = useState(false);
  const [showAllAlbums, setShowAllAlbums] = useState(false);
  const [showAllSingles, setShowAllSingles] = useState(false);
  const [albums, setAlbums] = useState(JUSTIN_ALBUMS);
  const [singles, setSingles] = useState(JUSTIN_SINGLES);
  const [appearsOn, setAppearsOn] = useState([]);

  // Multi-Base / Modalidades e Gravadoras com estoque próprio
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [baseMode, setBaseMode] = useState('home'); // 'home' | 'all' | 'streaming' | 'buy' | 'rent' | 'company'
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [companyTracks, setCompanyTracks] = useState([]);
  const [isCompanyLoading, setIsCompanyLoading] = useState(false);
  const [userPurchases, setUserPurchases] = useState([]);
  const [isPurchasesLoading, setIsPurchasesLoading] = useState(false);
  const [purchaseNotice, setPurchaseNotice] = useState(null);
  const companyDropdownRef = useRef(null);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const avatarMenuRef = useRef(null);
  const avatarBtnRef = useRef(null);

  // ─── ESTADOS DO CARRINHO DE COMPRAS & PROCESSO DE CHECKOUT INTEGRADO ───
  const [unlockedTrackMap, setUnlockedTrackMap] = useState({});
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartStep, setCartStep] = useState('cart'); // 'cart' | 'checkout' | 'success'
  const [lastOrderPurchased, setLastOrderPurchased] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('pix'); // 'pix' | 'card' | 'balance'
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [pixQrDataUrl, setPixQrDataUrl] = useState('');
  const [pixCodeString, setPixCodeString] = useState('');
  const [pixReceiverKey, setPixReceiverKey] = useState('enzo@devsongs.com.br');
  const [isEditingPixKey, setIsEditingPixKey] = useState(false);
  const [cardForm, setCardForm] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  const [copiedPix, setCopiedPix] = useState(false);

  // Carrega carrinho e chave Pix personalizada do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedKey = localStorage.getItem('devsongs_pix_key');
        if (savedKey) setPixReceiverKey(savedKey);

        const savedCart = localStorage.getItem('devsongs_cart');
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          if (Array.isArray(parsed)) setCartItems(parsed);
        }

        const savedUsed = localStorage.getItem('devsongs_used_coupons');
        if (savedUsed) {
          const parsed = JSON.parse(savedUsed);
          if (Array.isArray(parsed)) setUsedCoupons(parsed);
        }

        const savedCustom = localStorage.getItem('devsongs_custom_coupons');
        if (savedCustom) {
          const parsed = JSON.parse(savedCustom);
          if (parsed && typeof parsed === 'object') setCustomCoupons(parsed);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do carrinho do localStorage:', err);
      }
    }
  }, []);

  const saveCartToStorage = (items) => {
    setCartItems(items);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('devsongs_cart', JSON.stringify(items));
      } catch (e) {}
    }
  };

  // ─── CUPONS DE DESCONTO & TOTAIS DO CARRINHO ───
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponFeedback, setCouponFeedback] = useState(null); // { type: 'success' | 'error' | 'info', message: '' }
  const [usedCoupons, setUsedCoupons] = useState([]);
  const [customCoupons, setCustomCoupons] = useState({});
  const [showCreateCoupon, setShowCreateCoupon] = useState(false);
  const [newCouponForm, setNewCouponForm] = useState({
    code: '',
    type: 'percent',
    value: '20'
  });

  const DEFAULT_COUPONS = useMemo(() => ({
    'DEVSONGS10': { type: 'percent', value: 10, label: '10% OFF no Pedido' },
    'DEVSONGS20': { type: 'percent', value: 20, label: '20% OFF Especial' },
    'DEV50': { type: 'percent', value: 50, label: '50% OFF Metade do Preço' },
    'PRIMEIRACOMPRA': { type: 'percent', value: 15, label: '15% OFF de Boas-Vindas' },
    'DEVGRATIS': { type: 'percent', value: 100, label: '100% OFF Grátis' },
    'PROMO2': { type: 'fixed', value: 2.00, label: 'R$ 2,00 OFF Fixo' }
  }), []);

  const allCoupons = useMemo(() => {
    return { ...DEFAULT_COUPONS, ...customCoupons };
  }, [DEFAULT_COUPONS, customCoupons]);

  // Lista de códigos de cupons que ainda não foram utilizados pelo usuário
  const availableCouponsList = useMemo(() => {
    return Object.keys(allCoupons).filter(code => !usedCoupons.includes(code.toUpperCase()));
  }, [allCoupons, usedCoupons]);

  // Subtotal do Carrinho de Compras (sem desconto)
  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
  }, [cartItems]);

  // Valor monetário do desconto de cupom
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon || cartSubtotal <= 0) return 0;
    if (appliedCoupon.type === 'percent') {
      return (cartSubtotal * appliedCoupon.value) / 100;
    }
    if (appliedCoupon.type === 'fixed') {
      return Math.min(cartSubtotal, appliedCoupon.value);
    }
    return 0;
  }, [appliedCoupon, cartSubtotal]);

  // Total líquido final do Carrinho
  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - couponDiscount);
  }, [cartSubtotal, couponDiscount]);

  // Aplicar cupom (bloqueia se já tiver sido usado em compra anterior)
  const handleApplyCoupon = (e, customCode) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanCode = (customCode || couponInput || '').trim().toUpperCase();
    if (!cleanCode) {
      setCouponFeedback({ type: 'error', message: 'Por favor, digite o código do cupom.' });
      setTimeout(() => setCouponFeedback(null), 3500);
      return;
    }

    // 1. Bloqueia se o cupom já foi utilizado em compra anterior
    if (usedCoupons.includes(cleanCode)) {
      setCouponFeedback({
        type: 'error',
        message: `❌ O cupom "${cleanCode}" já foi utilizado e não pode ser reutilizado! Crie um novo cupom abaixo.`
      });
      setTimeout(() => setCouponFeedback(null), 5000);
      return;
    }

    // 2. Verifica se o cupom existe na lista de cupons disponíveis
    const found = allCoupons[cleanCode];
    if (found) {
      setAppliedCoupon({ code: cleanCode, ...found });
      setCouponFeedback({ type: 'success', message: `🎉 Cupom "${cleanCode}" aplicado: ${found.label}!` });
      setCouponInput('');
      setTimeout(() => setCouponFeedback(null), 4000);
    } else {
      setCouponFeedback({
        type: 'error',
        message: `Cupom "${cleanCode}" não encontrado. Crie um novo cupom clicando em "+ Criar Cupom".`
      });
      setTimeout(() => setCouponFeedback(null), 4500);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponFeedback({ type: 'info', message: 'Cupom removido.' });
    setTimeout(() => setCouponFeedback(null), 3000);
  };

  // Criar novo cupom (permite criar novos cupons quando os anteriores já foram usados)
  const handleCreateCoupon = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const rawCode = (newCouponForm.code || '').replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase();
    const numValue = Math.max(1, Number(newCouponForm.value) || 10);

    if (!rawCode || rawCode.length < 3) {
      setCouponFeedback({ type: 'error', message: 'O código do cupom deve ter pelo menos 3 letras ou números.' });
      setTimeout(() => setCouponFeedback(null), 3500);
      return;
    }

    const label = newCouponForm.type === 'percent'
      ? `${Math.min(100, Math.round(numValue))}% OFF Especial`
      : `R$ ${numValue.toFixed(2).replace('.', ',')} OFF Fixo`;

    const newCouponObj = {
      type: newCouponForm.type,
      value: newCouponForm.type === 'percent' ? Math.min(100, numValue) : numValue,
      label
    };

    // Remove do histórico de usados caso esteja sendo recriado
    const updatedUsed = usedCoupons.filter(c => c !== rawCode);
    setUsedCoupons(updatedUsed);

    const updatedCustom = {
      ...customCoupons,
      [rawCode]: newCouponObj
    };
    setCustomCoupons(updatedCustom);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('devsongs_custom_coupons', JSON.stringify(updatedCustom));
        localStorage.setItem('devsongs_used_coupons', JSON.stringify(updatedUsed));
      } catch (err) {}
    }

    // Aplica o novo cupom imediatamente ao carrinho
    setAppliedCoupon({ code: rawCode, ...newCouponObj });
    setShowCreateCoupon(false);
    setNewCouponForm({ code: '', type: 'percent', value: '20' });
    setCouponFeedback({
      type: 'success',
      message: `✨ Novo cupom "${rawCode}" criado e aplicado com sucesso! Válido para uso único nesta compra.`
    });
    setTimeout(() => setCouponFeedback(null), 5000);
  };

  // Gera o QR Code Pix oficial Banco Central para o total do carrinho
  useEffect(() => {
    if (!isCartOpen || cartTotal <= 0) {
      setPixQrDataUrl('');
      setPixCodeString('');
      return;
    }

    const code = generatePixBrCode({
      pixKey: pixReceiverKey || 'enzo@devsongs.com.br',
      merchantName: 'DEVSONGS STREAMING',
      merchantCity: 'SAO PAULO',
      amount: cartTotal,
      txid: `DSCART${cartItems.length}`
    });

    setPixCodeString(code);

    QRCode.toDataURL(code, {
      width: 280,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then(url => {
        setPixQrDataUrl(url);
      })
      .catch(err => {
        console.error('Erro ao gerar QRCode do carrinho:', err);
        setPixQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=4&data=${encodeURIComponent(code)}`);
      });
  }, [isCartOpen, cartTotal, pixReceiverKey, cartItems.length]);

  // Adicionar faixa ao Carrinho de Compras
  const addToCart = (track, type = 'buy') => {
    if (!track) return;

    const priceNum = type === 'buy'
      ? Number(String(track.salePrice || track.priceSale || '4.90').replace('R$', '').replace(',', '.').trim() || 4.90)
      : Number(String(track.rentPrice || track.priceRent || '1.90').replace('R$', '').replace(',', '.').trim() || 1.90);

    const trackTitle = track.title || 'Música';
    const existingIndex = cartItems.findIndex(
      it => (it.title || '').toLowerCase() === trackTitle.toLowerCase() && it.type === type
    );

    if (existingIndex >= 0) {
      // Já existe com a mesma modalidade, abre o carrinho
      setCartStep('cart');
      setIsCartOpen(true);
      return;
    }

    const newItem = {
      cartId: `${track.id || trackTitle}-${type}-${Date.now()}`,
      id: track.id,
      dbTrackId: track.dbTrackId,
      companyId: track.companyId || 1,
      title: trackTitle,
      artist: (track.artist || '').replace(/\.(wav\d*|mp3|m4a|flac|ogg)/gi, ''),
      album: track.album || 'Single',
      companyName: track.companyName || 'Catálogo Oficial',
      cover: track.cover || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png',
      durationSec: track.durationSec || 210,
      type, // 'buy' | 'rent'
      price: priceNum,
      rawTrack: track
    };

    const updated = [...cartItems, newItem];
    saveCartToStorage(updated);
    setCartStep('cart');
    setIsCartOpen(true);
    setPurchaseNotice({
      type: 'success',
      text: `🛒 "${trackTitle}" (${type === 'buy' ? 'Compra Definitiva' : 'Aluguel 30 dias'}) adicionada ao Carrinho!`
    });
    setTimeout(() => setPurchaseNotice(null), 3500);
  };

  // Remover item do carrinho
  const removeFromCart = (cartId) => {
    const updated = cartItems.filter(it => it.cartId !== cartId);
    saveCartToStorage(updated);
  };

  // Alternar modalidade (Compra / Aluguel) de um item no carrinho
  const toggleCartItemType = (cartId) => {
    const updated = cartItems.map(item => {
      if (item.cartId !== cartId) return item;
      const nextType = item.type === 'buy' ? 'rent' : 'buy';
      let nextPrice;
      if (item.isAlbum || item.itemType === 'album') {
        nextPrice = nextType === 'buy'
          ? Math.max(0, Math.round((29.90 - (item.discount || 0)) * 100) / 100)
          : 9.90;
      } else {
        nextPrice = nextType === 'buy'
          ? Number(String(item.rawTrack?.salePrice || item.rawTrack?.priceSale || '4.90').replace('R$', '').replace(',', '.').trim() || 4.90)
          : Number(String(item.rawTrack?.rentPrice || item.rawTrack?.priceRent || '1.90').replace('R$', '').replace(',', '.').trim() || 1.90);
      }
      return {
        ...item,
        type: nextType,
        price: nextPrice
      };
    });
    saveCartToStorage(updated);
  };

  // Limpar carrinho
  const clearCart = () => {
    saveCartToStorage([]);
    setAppliedCoupon(null);
    setCouponFeedback(null);
  };

  const handleCopyPix = () => {
    if (pixCodeString && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(pixCodeString);
    }
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})/g, '$1 ').trim();
    setCardForm(prev => ({ ...prev, number: formatted }));
  };

  const handleCardExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setCardForm(prev => ({ ...prev, expiry: raw }));
  };

  const handleCardNameChange = (e) => {
    const cleanLetters = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    setCardForm(prev => ({ ...prev, name: cleanLetters }));
  };

  // Finalizar a compra do Carrinho de Compras
  const handleConfirmCartCheckout = async () => {
    if (cartItems.length === 0) return;

    if (paymentMethod === 'card') {
      const cleanName = (cardForm.name || '').trim();
      if (!cleanName || /\d/.test(cleanName) || cleanName.length < 3) {
        setPurchaseNotice({
          type: 'error',
          text: 'Por favor, informe o nome impresso no cartão (somente letras, sem números).'
        });
        setTimeout(() => setPurchaseNotice(null), 4500);
        return;
      }
    }

    setIsProcessingPayment(true);
    const emailToSend = (checkoutEmail || '').trim() || user?.email || 'enzo@devsongs.com';
    const purchasedList = [...cartItems];

    try {
      const uId = user?.id || 1;
      let emailSuccessCount = 0;

      for (const item of purchasedList) {
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
          if (item.isAlbum || item.itemType === 'album') {
            let cleanAlbId = item.albumId || item.id || 0;
            if (typeof cleanAlbId === 'string' && cleanAlbId.startsWith('dz-alb-')) {
              cleanAlbId = cleanAlbId.replace('dz-alb-', '');
            } else if (typeof cleanAlbId === 'string' && cleanAlbId.startsWith('it-alb-')) {
              cleanAlbId = cleanAlbId.replace('it-alb-', '');
            }
            const res = await fetch(`${API_URL}/api/library/albums/${cleanAlbId}/${item.type}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify({
                title: item.title,
                artist_name: item.artist,
                cover_url: item.cover,
                release_date: item.year ? `${item.year}-01-01` : null,
                genre: item.genre || 'Variado',
                price: item.price,
                original_price: item.originalPrice,
                discount_applied: item.discount || 0,
                tracks_count: item.tracksCount || 12,
                paymentMethod,
                email: emailToSend
              })
            });
            const d = await res.json();
            if (d.success) {
              emailSuccessCount++;
            }
          } else {
            const res = await fetch(`${API_URL}/api/companies/purchase-any`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
              },
              body: JSON.stringify({
                title: item.title,
                artist: item.artist,
                album: item.album || 'Single',
                genre: item.genre || 'Variado',
                companyId: item.companyId || undefined,
                coverUrl: item.cover || null,
                durationSec: item.durationSec || 210,
                type: item.type,
                price: item.price,
                paymentMethod,
                email: emailToSend
              })
            });
            const d = await res.json();
            if (d.success && d.emailSent) {
              emailSuccessCount++;
            }
          }
        } catch (itemErr) {
          console.error('Erro ao processar item do carrinho:', item.title, itemErr);
        }
      }

      // Desbloqueia todas as músicas adquiridas em tempo real
      const newUnlocked = {};
      purchasedList.forEach(item => {
        const k = (item.title || '').trim().toLowerCase();
        newUnlocked[k] = true;
        if (item.id) newUnlocked[item.id] = true;
        if (item.dbTrackId) newUnlocked[item.dbTrackId] = true;
      });
      setUnlockedTrackMap(prev => ({ ...prev, ...newUnlocked }));

      try {
        await fetchUserPurchases();
        setLibraryRefreshKey(k => k + 1);
      } catch (_) {}

      // Se utilizou cupom, marca-o como UTILIZADO para não poder usar de novo
      if (appliedCoupon?.code) {
        const codeUsed = appliedCoupon.code.toUpperCase();
        setUsedCoupons(prev => {
          const next = [...new Set([...prev, codeUsed])];
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('devsongs_used_coupons', JSON.stringify(next));
            } catch (e) {}
          }
          return next;
        });
      }

      // Limpa carrinho e avança para a tela de confirmação/sucesso
      saveCartToStorage([]);
      setAppliedCoupon(null);
      setLastOrderPurchased(purchasedList);
      setCartStep('success');

      setPurchaseNotice({
        type: 'success',
        text: `🎉 Pagamento confirmado com sucesso! Itens liberados imediatamente na sua Biblioteca.${emailSuccessCount > 0 ? ` Comprovante enviado para ${emailToSend}.` : ''}`
      });
      setTimeout(() => setPurchaseNotice(null), 7000);
    } catch (err) {
      console.error('Erro no checkout do carrinho:', err);
      if (appliedCoupon?.code) {
        const codeUsed = appliedCoupon.code.toUpperCase();
        setUsedCoupons(prev => {
          const next = [...new Set([...prev, codeUsed])];
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('devsongs_used_coupons', JSON.stringify(next));
            } catch (e) {}
          }
          return next;
        });
      }
      saveCartToStorage([]);
      setAppliedCoupon(null);
      setLastOrderPurchased(purchasedList);
      setCartStep('success');
      try {
        await fetchUserPurchases();
      } catch (_) {}
    } finally {
      setIsProcessingPayment(false);
    }
  };

  useEffect(() => {
    fetch(`${API_URL}/api/companies`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setCompanies(data);
      })
      .catch(() => {});
  }, []);

  const fetchUserPurchases = useCallback(async () => {
    setIsPurchasesLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;
      const cleanSimple = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

      const [resPurchases, resAlbums] = await Promise.all([
        fetch(`${API_URL}/api/companies/my-purchases`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`${API_URL}/api/library/my-albums`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => (r.ok ? r.json() : null)).catch(() => null)
      ]);

      const purchasesList = (resPurchases && resPurchases.purchases) || [];
      const albumsList = ((resAlbums && resAlbums.albums) || []).map(a => ({
        id: `alb-${a.id}`,
        album_id: a.id,
        item_type: 'album',
        title: a.title,
        artist: a.artist || a.artist_name,
        cover: a.cover || a.cover_url,
        cover_url: a.cover_url || a.cover,
        type: a.type || 'buy',
        payment_status: 'confirmed',
        expires_at: a.expiresAt || null,
        created_at: a.purchasedAt || null
      }));

      // Combina compras de faixas e compras integrais de álbuns
      const combined = [...purchasesList];
      for (const alb of albumsList) {
        if (!combined.some(p => p.item_type === 'album' && (String(p.album_id) === String(alb.album_id) || cleanSimple(p.title) === cleanSimple(alb.title)))) {
          combined.push(alb);
        }
      }

      setUserPurchases(combined);
    } catch (err) {
      console.warn('Erro ao carregar compras do usuário:', err?.message || err);
    } finally {
      setIsPurchasesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserPurchases();
  }, [fetchUserPurchases]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target)) {
        setShowCompanyDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectBaseMode = async (mode) => {
    setBaseMode(mode);
    setSelectedCompany(null);
    setShowCompanyDropdown(false);

    if (mode === 'home') {
      setCompanyTracks([]);
      return;
    }

    setIsCompanyLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_URL}/api/companies/multibase/tracks?mode=${mode}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data && data.tracks) {
        setCompanyTracks(data.tracks);
      }
    } catch (err) {
      console.error('Erro ao buscar faixas por modalidade:', err);
    } finally {
      setIsCompanyLoading(false);
    }
  };

  const handleSelectCompany = async (company) => {
    setSelectedCompany(company);
    setShowCompanyDropdown(false);
    if (!company) {
      setCompanyTracks([]);
      setBaseMode('home');
      return;
    }
    setBaseMode('company');
    setIsCompanyLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_URL}/api/companies/multibase/tracks?companyId=${company.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data && data.tracks) {
        setCompanyTracks(data.tracks);
      }
    } catch (err) {
      console.error('Erro ao buscar músicas da empresa:', err);
    } finally {
      setIsCompanyLoading(false);
    }
  };

  const handleBuyCompanyTrack = async (track, type = 'buy') => {
    if (!track) return false;
    const compId = track.companyId || selectedCompany?.id || 1;
    const compName = track.companyName || selectedCompany?.name || 'Gravadora Parceira';
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_URL}/api/companies/${compId}/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ trackId: track.dbTrackId || track.id })
      });
      const data = await res.json();
      if (data.success) {
        setCompanyTracks(prev => prev.map(t => {
          if ((t.dbTrackId || t.id) === (track.dbTrackId || track.id)) {
            return {
              ...t,
              stockQuantity: data.remainingStock,
              plays: `Estoque: ${data.remainingStock} un`,
              availableForSale: data.remainingStock > 0,
              availableForRent: data.remainingStock > 0,
              isPurchased: type === 'buy' ? true : t.isPurchased,
              isRented: type === 'rent' ? true : t.isRented
            };
          }
          return t;
        }));
        setPurchaseNotice({
          type: 'success',
          text: `🎉 Pagamento aprovado! "${track.title}" foi liberada e adicionada à sua Biblioteca!`
        });
        setTimeout(() => setPurchaseNotice(null), 5500);
        try {
        await fetchUserPurchases();
      } catch (_) {}
        return true;
      } else {
        setPurchaseNotice({
          type: 'error',
          text: data.error || 'Não foi possível processar o pagamento.'
        });
        setTimeout(() => setPurchaseNotice(null), 5500);
        return false;
      }
    } catch (err) {
      console.error('Erro no pagamento:', err);
      return false;
    }
  };

  // View Mode: 'home' (Tela de Início YouTube Music) | 'artist' (Perfil) | 'search' (Resultados) | 'album' (Álbum dedicado)
  const [viewMode, setViewMode] = useState('home');
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumTracks, setAlbumTracks] = useState([]);
  const [relatedAlbums, setRelatedAlbums] = useState([]);
  const [isAlbumLoading, setIsAlbumLoading] = useState(false);
  const [activeArtist, setActiveArtist] = useState(null);
  const [isArtistSubscribed, setIsArtistSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [unsubscribeModalOpen, setUnsubscribeModalOpen] = useState(false);
  const [libraryRefreshKey, setLibraryRefreshKey] = useState(0);
  const [searchArtists, setSearchArtists] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);

  // Cálculo inteligente de preços e descontos para o álbum selecionado
  const currentAlbumPricing = useMemo(() => {
    const baseBuyPrice = 29.90;
    const baseRentPrice = 9.90;

    if (!selectedAlbum) {
      return {
        originalPrice: baseBuyPrice,
        discount: 0,
        finalPrice: baseBuyPrice,
        rentPrice: baseRentPrice,
        purchasedTracksCount: 0,
        isOwned: false,
        isRented: false,
        isRentExpired: false,
        remainingDays: null,
        expiresAt: null
      };
    }

    const cleanSimple = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
    const cleanStr = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const albumTitleClean = cleanSimple(selectedAlbum.title);
    const albumIdStr = String(selectedAlbum.id || selectedAlbum.albumId || '').replace('dz-alb-', '').replace('it-alb-', '');

    const now = new Date();

    // 1. Verificar se o álbum integral já foi adquirido pelo usuário
    const albumBuyPurchase = (userPurchases || []).find(p => {
      if (p.payment_status === 'pending') return false;
      const isAlb = p.item_type === 'album' || (!p.track_id && p.album_id);
      if (!isAlb) return false;
      const pAlbId = String(p.album_id || '').replace('dz-alb-', '').replace('it-alb-', '');
      const matchId = pAlbId && (pAlbId === albumIdStr || pAlbId === String(selectedAlbum.id));
      const pTitle = cleanSimple(p.title);
      const matchTitle = pTitle && albumTitleClean && (
        pTitle === albumTitleClean ||
        pTitle.includes(albumTitleClean) ||
        albumTitleClean.includes(pTitle)
      );
      return (matchId || matchTitle) && p.type === 'buy';
    });

    const albumRentPurchase = (userPurchases || []).find(p => {
      if (p.payment_status === 'pending') return false;
      const isAlb = p.item_type === 'album' || (!p.track_id && p.album_id);
      if (!isAlb) return false;
      const pAlbId = String(p.album_id || '').replace('dz-alb-', '').replace('it-alb-', '');
      const matchId = pAlbId && (pAlbId === albumIdStr || pAlbId === String(selectedAlbum.id));
      const pTitle = cleanSimple(p.title);
      const matchTitle = pTitle && albumTitleClean && (
        pTitle === albumTitleClean ||
        pTitle.includes(albumTitleClean) ||
        albumTitleClean.includes(pTitle)
      );
      return (matchId || matchTitle) && p.type === 'rent';
    });

    const isOwned = Boolean(albumBuyPurchase);
    const isRented = Boolean(albumRentPurchase);
    const isRentExpired = isRented ? (albumRentPurchase.expires_at ? new Date(albumRentPurchase.expires_at) < now : false) : false;
    const remainingDays = isRented && !isRentExpired && albumRentPurchase.expires_at
      ? Math.max(0, Math.ceil((new Date(albumRentPurchase.expires_at) - now) / (1000 * 60 * 60 * 24)))
      : null;

    // 2. Sistema Inteligente de Descontos:
    // Identificar faixas pertencentes ao álbum que o usuário JÁ COMPROU INDIVIDUALMENTE (type === 'buy' confirmada)
    // Regra: Músicas apenas reproduzidas, adicionadas a playlists, em histórico ou alugadas NÃO geram desconto na compra permanente.
    const confirmedBuyTrackPurchases = (userPurchases || []).filter(p => 
      p.type === 'buy' && 
      p.payment_status !== 'pending' && 
      (p.track_id || p.item_type !== 'album')
    );

    let discount = 0;
    let purchasedTracksCount = 0;
    const matchedPurchaseIds = new Set();

    if (Array.isArray(albumTracks) && albumTracks.length > 0) {
      for (const track of albumTracks) {
        const trackTitleClean = cleanStr(track.title);
        const trackId = track.id ? String(track.id).replace('track-', '').replace('dz-track-', '').replace('it-track-', '') : null;
        const trackDbId = track.dbTrackId ? String(track.dbTrackId) : null;

        const matchedP = confirmedBuyTrackPurchases.find(p => {
          if (matchedPurchaseIds.has(p.id)) return false;
          const pTitleClean = cleanStr(p.title);
          const pTrackId = p.track_id ? String(p.track_id).replace('ct-', '') : null;

          const idMatch = (trackId && pTrackId && trackId === pTrackId) || (trackDbId && pTrackId && trackDbId === pTrackId);
          const titleMatch = trackTitleClean && pTitleClean && trackTitleClean === pTitleClean;
          return idMatch || titleMatch;
        });

        if (matchedP) {
          matchedPurchaseIds.add(matchedP.id);
          purchasedTracksCount++;
          const pPrice = Number(matchedP.price) || 4.90;
          discount += pPrice;
        }
      }
    }

    const finalBuyPrice = Math.max(0, Math.round((baseBuyPrice - discount) * 100) / 100);

    return {
      originalPrice: baseBuyPrice,
      discount: Math.round(discount * 100) / 100,
      finalPrice: finalBuyPrice,
      rentPrice: baseRentPrice,
      purchasedTracksCount,
      isOwned,
      isRented,
      isRentExpired,
      remainingDays,
      expiresAt: albumRentPurchase?.expires_at || null
    };
  }, [selectedAlbum, albumTracks, userPurchases]);

  const handleBuyOrRentAlbum = (album, type = 'buy', pricing = null) => {
    if (!album) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setPurchaseNotice({
        type: 'error',
        text: 'Faça login para adquirir este álbum.'
      });
      setTimeout(() => setPurchaseNotice(null), 4000);
      return;
    }

    const p = pricing || currentAlbumPricing;

    // Se já comprou integralmente
    if (type === 'buy' && p.isOwned) {
      setPurchaseNotice({
        type: 'success',
        text: `Você já possui o álbum "${album.title}" comprado permanentemente na sua biblioteca!`
      });
      setTimeout(() => setPurchaseNotice(null), 4000);
      return;
    }

    // Se já alugou e está ativo
    if (type === 'rent' && p.isRented && !p.isRentExpired) {
      setPurchaseNotice({
        type: 'success',
        text: `O aluguel do álbum "${album.title}" já está ativo (${p.remainingDays} dias restantes).`
      });
      setTimeout(() => setPurchaseNotice(null), 4000);
      return;
    }

    const priceNum = type === 'buy' ? p.finalPrice : p.rentPrice;
    const albumTitle = album.title || 'Álbum';

    const albumCartItem = {
      cartId: `album-${album.id || album.albumId || '0'}-${type}-${Date.now()}`,
      id: album.id || album.albumId,
      dbTrackId: null,
      albumId: album.id || album.albumId,
      itemType: 'album',
      isAlbum: true,
      title: albumTitle,
      artist: album.artist || album.artistName || activeArtist?.name || 'Artista',
      album: albumTitle,
      companyName: 'Catálogo Oficial DevSongs',
      cover: album.cover || album.cover_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png',
      type, // 'buy' | 'rent'
      price: priceNum,
      originalPrice: p.originalPrice,
      discount: type === 'buy' ? p.discount : 0,
      purchasedTracksCount: p.purchasedTracksCount,
      tracksCount: album.nbTracks || albumTracks.length || 12,
      year: album.year || null,
      genre: album.genre || 'Variado'
    };

    // Remove do carrinho se já existisse item deste mesmo álbum para não duplicar
    const filtered = cartItems.filter(it => !(it.isAlbum && it.title?.toLowerCase() === albumTitle.toLowerCase()));
    const updated = [...filtered, albumCartItem];
    saveCartToStorage(updated);
    setCartStep('cart');
    setIsCartOpen(true);
    setPurchaseNotice({
      type: 'success',
      text: `🛒 Álbum "${albumTitle}" (${type === 'buy' ? 'Compra Permanente' : 'Aluguel por 30 dias'}) adicionado ao Carrinho!`
    });
    setTimeout(() => setPurchaseNotice(null), 4000);
  };

  // Álbuns extraídos das faixas encontradas na busca
  const searchAlbums = useMemo(() => {
    const map = new Map();
    for (const t of tracks) {
      if (t.album && !map.has(t.album)) {
        map.set(t.album, {
          id: t.albumId || t.album,
          albumId: t.albumId || t.album,
          title: t.album,
          artist: t.artist,
          cover: t.cover,
          type: 'album',
          year: t.year || ''
        });
      }
    }
    return Array.from(map.values());
  }, [tracks]);

  // Search & Autocomplete (Foto 1 & 2)
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSubTab, setSearchSubTab] = useState('YT MUSIC');
  const [selectedSearchFilter, setSelectedSearchFilter] = useState('Tudo');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestQueries, setSuggestQueries] = useState([]);
  const [suggestEntities, setSuggestEntities] = useState([]);
  const searchClientCache = useRef(new Map());

  // Busca em tempo real sugestões de texto e músicas correspondentes com base no que o usuário digita
  useEffect(() => {
    const qTrim = searchQuery.trim().toLowerCase();
    if (!qTrim) {
      setSuggestQueries([]);
      setSuggestEntities([]);
      return;
    }

    // 1. Resposta instantânea (0ms) se já estiver no cache do navegador
    if (searchClientCache.current.has(qTrim)) {
      const cached = searchClientCache.current.get(qTrim);
      setSuggestQueries(cached.queries || []);
      setSuggestEntities(cached.entities || []);
      return;
    }

    let isMounted = true;
    const abortController = new AbortController();
    const { signal } = abortController;

    const timer = setTimeout(async () => {
      let fetchedQueries = [];
      let fetchedEntities = [];

      // 1. Sugestões de texto ultra-rápidas do YouTube Music (desacoplado para exibir na hora)
      fetch(`${API_URL}/api/youtube/suggest?q=${encodeURIComponent(searchQuery)}`, { signal })
        .then(r => r.json())
        .then(d => {
          if (!isMounted) return;
          const queries = (d.queries || []).slice(0, 6);
          fetchedQueries = queries;
          if (queries.length > 0) {
            setSuggestQueries(queries);
          }
        })
        .catch(() => {});

      // 2. Músicas reais e artista correspondentes pesquisados no catálogo e biblioteca pessoal
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      fetch(`${API_URL}/api/music/search?q=${encodeURIComponent(searchQuery)}`, {
        signal,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
        .then(r => r.json())
        .then(d => {
          if (!isMounted) return;
          const list = [];
          if (d.artist) {
            let artistCover = d.artist.avatarImg;
            let artistName = d.artist.name;
            const cleanA = (artistName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['"`.,\s]/g, '');
            if (cleanA === 'bk' || qTrim === 'bk' || qTrim === "bk'") {
              artistName = 'BK';
              if (!artistCover || artistCover.includes('default') || artistCover.includes('/images/artist//')) {
                artistCover = 'https://cdn-images.dzcdn.net/images/artist/7481fc25e9bf8f0d8c416ecb9104927d/1000x1000-000000-80-0-0.jpg';
              }
            } else if (cleanA === 'justinbieber') {
              if (!artistCover || artistCover.includes('default') || artistCover.includes('/images/artist//')) {
                artistCover = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025319/bookhub/img/justin_my_world.jpg';
              }
            }
            const listenersStr = d.artist.listeners && !d.artist.listeners.startsWith('0 mil')
              ? d.artist.listeners
              : 'Mais de 1 mi ouvintes mensais';
            list.push({
              id: d.artist.id,
              type: 'artist',
              title: artistName,
              artist: artistName,
              album: '',
              sub: `Artista • ${listenersStr}`,
              cover: artistCover,
              preview: null,
              durationSec: 0,
              duration: '',
              plays: '',
              explicit: false
            });
          }
          if (d.tracks && d.tracks.length > 0) {
            list.push(...d.tracks.slice(0, 5));
          }
          fetchedEntities = list;
          setSuggestEntities(list);

          // Salva no cache local do cliente para resposta instantânea (0ms)
          searchClientCache.current.set(qTrim, {
            queries: fetchedQueries.length > 0 ? fetchedQueries : (suggestQueries || []),
            entities: list
          });
        })
        .catch(() => {});
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      abortController.abort();
    };
  }, [searchQuery]);

  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(214); // Real duration in seconds
  const [showRemainingTime, setShowRemainingTime] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [likedMap, setLikedMap] = useState({});
  const [activeTab, setActiveTab] = useState(props.forcedTab || 'inicio');
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [smartQueue, setSmartQueue] = useState([]);
  const [queueSource, setQueueSource] = useState('');

  // Faixas adquiridas válidas (compradas definitivas ou aluguel vigente não expirado com data real verificada)
  const validPurchases = useMemo(() => {
    const now = new Date();
    return (userPurchases || []).filter(p => {
      if (p.payment_status === 'pending') return false;
      if (p.type === 'buy') return true;
      if (p.type === 'rent') {
        const isExpired = Boolean(p.isExpired || p.is_expired || (p.expires_at && new Date(p.expires_at) <= now) || (p.expiresAt && new Date(p.expiresAt) <= now));
        return !isExpired && p.canPlay !== false;
      }
      return false;
    });
  }, [userPurchases]);

  // Sistema Inteligente de Fila de Reprodução (Referência Spotify)
  const [manualQueue, setManualQueue] = useState([]); // Músicas adicionadas manualmente ("A seguir")
  const [contextQueue, setContextQueue] = useState([]); // Músicas do álbum, playlist ou biblioteca ("Próximas de: [Contexto]")
  const [playbackContextName, setPlaybackContextName] = useState(''); // Nome dinâmico do contexto (ex: 'Little Love', 'Esú', 'teste')
  const [playedSessionHistory, setPlayedSessionHistory] = useState([]);

  const manualQueueRef = useRef([]);
  const contextQueueRef = useRef([]);
  const playbackContextNameRef = useRef('');
  const playedSessionHistoryRef = useRef([]);
  const hasRecordedPlaybackRef = useRef(false);

  useEffect(() => {
    manualQueueRef.current = manualQueue;
  }, [manualQueue]);

  useEffect(() => {
    contextQueueRef.current = contextQueue;
  }, [contextQueue]);

  useEffect(() => {
    playbackContextNameRef.current = playbackContextName;
  }, [playbackContextName]);

  useEffect(() => {
    playedSessionHistoryRef.current = playedSessionHistory;
  }, [playedSessionHistory]);

  // Sincronização em tempo real de atividade com a Comunidade ("Ouvindo agora")
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${API_URL}/api/community/activity/now-playing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        track: currentTrack ? {
          id: currentTrack.id || currentTrack.track_id,
          title: currentTrack.title,
          artist: currentTrack.artist,
          album: currentTrack.album || '',
          cover: getSafeCover(currentTrack),
          durationSec: duration,
          youtube_video_id: currentTrack.youtube_video_id || null,
          audio_url: currentTrack.audio_url || currentTrack.preview_url || null
        } : null,
        isPlaying: !!isPlaying
      })
    }).catch(() => {});
  }, [currentTrack, isPlaying, duration]);

  const [activeTrackMenu, setActiveTrackMenu] = useState(null); // { track, x, y }
  const [queueToast, setQueueToast] = useState(null);
  const queueToastTimeoutRef = useRef(null);

  const showQueueToast = useCallback((msg) => {
    if (queueToastTimeoutRef.current) clearTimeout(queueToastTimeoutRef.current);
    setQueueToast(msg);
    queueToastTimeoutRef.current = setTimeout(() => {
      setQueueToast(null);
    }, 2800);
  }, []);

  const GENERIC_ALBUM_NAMES = useMemo(() => new Set(['single', 'ep', 'variado', 'aovivo', 'deluxe', 'album', 'show', 'oshow']), []);

  // Identificador formal de propriedade definitiva (Comprada)
  const isTrackOwned = useCallback((track) => {
    if (!track) return false;
    const cleanSimple = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
    const trackTitleClean = cleanSimple(track.title);
    const trackArtistClean = cleanSimple(track.artist);
    const trackAlbumClean = cleanSimple(track.album);

    const trackLocalId = track.dbTrackId ? Number(track.dbTrackId) : (String(track.id || '').startsWith('ct-') ? Number(String(track.id).replace('ct-', '')) : null);
    const trackRawId = String(track.id || track.dbTrackId || '');

    // 1. Checagem por álbum adquirido integralmente
    const isAlbumOwned = (userPurchases || []).some(p => {
      if (p.payment_status === 'pending' || p.type !== 'buy') return false;
      const isAlb = p.item_type === 'album' || (!p.track_id && p.album_id);
      if (!isAlb) return false;

      // Correspondência por ID do álbum
      if (track.album_id && p.album_id && String(track.album_id) === String(p.album_id)) return true;
      if (track.albumId && p.album_id && String(track.albumId) === String(p.album_id)) return true;

      // Correspondência por Título do Álbum + Artista (títulos genéricos nunca casam)
      const pAlbumTitleClean = cleanSimple(p.title);
      const pArtistClean = cleanSimple(p.artist);
      if (trackAlbumClean && pAlbumTitleClean && !GENERIC_ALBUM_NAMES.has(trackAlbumClean) && !GENERIC_ALBUM_NAMES.has(pAlbumTitleClean)) {
        if (trackAlbumClean === pAlbumTitleClean) {
          if (trackArtistClean && pArtistClean) {
            return trackArtistClean === pArtistClean || trackArtistClean.includes(pArtistClean) || pArtistClean.includes(trackArtistClean);
          }
        }
      }
      return false;
    });

    if (isAlbumOwned) return true;

    // 2. Checagem por faixa individual adquirida
    return (userPurchases || []).some(p => {
      if (p.payment_status === 'pending' || p.type !== 'buy') return false;
      if (p.item_type === 'album') return false;

      // Regra 4: NUNCA utilizar p.id (ID da transação) como ID de faixa!
      const pLocalId = p.track_id ? Number(String(p.track_id).replace(/^ct-/, '')) : (p.dbTrackId ? Number(p.dbTrackId) : null);
      const pRawId = String(p.track_id || p.dbTrackId || '');

      // Correspondência exata por ID de faixa local (ct-X ou numérico)
      if (trackLocalId && pLocalId && trackLocalId === pLocalId) {
        return true;
      }
      // Correspondência exata por ID externo completo (ex: dz-track-X)
      if (trackRawId && pRawId && trackRawId === pRawId && (trackRawId.startsWith('dz-') || trackRawId.startsWith('it-'))) {
        return true;
      }

      // Correspondência por Título E Artista (ambos obrigatórios)
      const pTitleClean = cleanSimple(p.title);
      const pArtistClean = cleanSimple(p.artist);
      if (trackTitleClean && pTitleClean && trackTitleClean === pTitleClean) {
        if (trackArtistClean && pArtistClean) {
          return trackArtistClean === pArtistClean || trackArtistClean.includes(pArtistClean) || pArtistClean.includes(trackArtistClean);
        }
      }
      return false;
    });
  }, [userPurchases, GENERIC_ALBUM_NAMES]);

  // Identificador formal de aluguel ativo (Alugada com data de expiração válida)
  const isTrackRentedActive = useCallback((track) => {
    if (!track) return false;
    const now = new Date();
    const cleanSimple = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
    const trackTitleClean = cleanSimple(track.title);
    const trackArtistClean = cleanSimple(track.artist);
    const trackAlbumClean = cleanSimple(track.album);

    const trackLocalId = track.dbTrackId ? Number(track.dbTrackId) : (String(track.id || '').startsWith('ct-') ? Number(String(track.id).replace('ct-', '')) : null);
    const trackRawId = String(track.id || track.dbTrackId || '');

    // 1. Checagem por álbum alugado com prazo ativo
    const isAlbumRentedActive = (userPurchases || []).some(p => {
      if (p.payment_status === 'pending' || p.type !== 'rent') return false;
      const isExpired = Boolean(p.isExpired || p.is_expired || (p.expires_at && new Date(p.expires_at) <= now) || (p.expiresAt && new Date(p.expiresAt) <= now));
      if (isExpired) return false;

      const isAlb = p.item_type === 'album' || (!p.track_id && p.album_id);
      if (!isAlb) return false;

      if (track.album_id && p.album_id && String(track.album_id) === String(p.album_id)) return true;
      if (track.albumId && p.album_id && String(track.albumId) === String(p.album_id)) return true;

      const pAlbumTitleClean = cleanSimple(p.title);
      const pArtistClean = cleanSimple(p.artist);
      if (trackAlbumClean && pAlbumTitleClean && !GENERIC_ALBUM_NAMES.has(trackAlbumClean) && !GENERIC_ALBUM_NAMES.has(pAlbumTitleClean)) {
        if (trackAlbumClean === pAlbumTitleClean) {
          if (trackArtistClean && pArtistClean) {
            return trackArtistClean === pArtistClean || trackArtistClean.includes(pArtistClean) || pArtistClean.includes(trackArtistClean);
          }
        }
      }
      return false;
    });

    if (isAlbumRentedActive) return true;

    // 2. Checagem por faixa individual alugada com prazo ativo
    return (userPurchases || []).some(p => {
      if (p.payment_status === 'pending' || p.type !== 'rent') return false;
      const isExpired = Boolean(p.isExpired || p.is_expired || (p.expires_at && new Date(p.expires_at) <= now) || (p.expiresAt && new Date(p.expiresAt) <= now));
      if (isExpired) return false;
      if (p.item_type === 'album') return false;

      // Regra 4: NUNCA utilizar p.id como ID de faixa!
      const pLocalId = p.track_id ? Number(String(p.track_id).replace(/^ct-/, '')) : (p.dbTrackId ? Number(p.dbTrackId) : null);
      const pRawId = String(p.track_id || p.dbTrackId || '');

      if (trackLocalId && pLocalId && trackLocalId === pLocalId) {
        return true;
      }
      if (trackRawId && pRawId && trackRawId === pRawId && (trackRawId.startsWith('dz-') || trackRawId.startsWith('it-'))) {
        return true;
      }

      const pTitleClean = cleanSimple(p.title);
      const pArtistClean = cleanSimple(p.artist);
      if (trackTitleClean && pTitleClean && trackTitleClean === pTitleClean) {
        if (trackArtistClean && pArtistClean) {
          return trackArtistClean === pArtistClean || trackArtistClean.includes(pArtistClean) || pArtistClean.includes(trackArtistClean);
        }
      }
      return false;
    });
  }, [userPurchases, GENERIC_ALBUM_NAMES]);

  // Validador universal de permissão de reprodução da faixa
  const isTrackPlayable = useCallback((track) => {
    if (!track) return false;
    const cleanSimple = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
    const trackKey = (track.title || '').trim().toLowerCase();
    const trackTitleClean = cleanSimple(track.title);

    const isLocallyUnlocked = Boolean(unlockedTrackMap[trackKey] || unlockedTrackMap[trackTitleClean] || (track.id && unlockedTrackMap[track.id]));
    if (isLocallyUnlocked) return true;

    return isTrackOwned(track) || isTrackRentedActive(track);
  }, [unlockedTrackMap, isTrackOwned, isTrackRentedActive]);

  // Fila contextual efetiva ("Próximas de: [Contexto]")
  const effectiveContextQueue = useMemo(() => {
    if (contextQueue && contextQueue.length > 0) {
      return contextQueue;
    }
    // Contexto padrão da sessão: próximas faixas disponíveis da biblioteca/compras
    if (!currentTrack) return validPurchases || [];
    return (validPurchases || []).filter(p => {
      const idMatch = (p.id && currentTrack.id && p.id === currentTrack.id) ||
                      (p.dbTrackId && currentTrack.dbTrackId && p.dbTrackId === currentTrack.dbTrackId);
      const titleMatch = p.title && currentTrack.title && p.title.trim().toLowerCase() === currentTrack.title.trim().toLowerCase();
      return !idMatch && !titleMatch;
    });
  }, [contextQueue, validPurchases, currentTrack]);

  const effectiveContextQueueRef = useRef([]);
  useEffect(() => {
    effectiveContextQueueRef.current = effectiveContextQueue;
  }, [effectiveContextQueue]);

  // Título dinâmico da seção contextual (ex: "Próximas de: Little Love", "Próximas de: Esú")
  const displayContextTitle = useMemo(() => {
    if (playbackContextName && playbackContextName.trim()) {
      return `Próximas de: ${playbackContextName.trim()}`;
    }
    if (currentTrack && currentTrack.album && currentTrack.album !== 'Single' && currentTrack.album !== 'Variado') {
      return `Próximas de: ${currentTrack.album}`;
    }
    return 'Próximas de: Sua Biblioteca';
  }, [playbackContextName, currentTrack]);

  // Adicionar música à seção "A seguir" (preserva 100% da fila de contexto e a reprodução atual)
  const addToQueue = useCallback((track) => {
    if (!track) return;
    const canPlay = isTrackPlayable(track);
    if (!canPlay) {
      addToCart(track, 'buy');
      showQueueToast(`"${track.title}" é exclusiva. Adicionada ao carrinho.`);
      return;
    }

    if (!currentTrack) {
      playTrack(track);
      showQueueToast(`Tocando agora: ${track.title}`);
      return;
    }

    const trackWithKey = {
      ...track,
      manualQueueId: `mq-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    };

    setManualQueue(prev => [...(prev || []), trackWithKey]);
    showQueueToast(`"${track.title}" adicionada à seção A seguir`);
  }, [isTrackPlayable, currentTrack, addToCart, showQueueToast]);

  // Limpar somente as faixas adicionadas manualmente ("A seguir")
  const clearManualQueue = useCallback(() => {
    setManualQueue([]);
    showQueueToast('Fila manual limpa');
  }, [showQueueToast]);

  // Remover música específica de "A seguir"
  const removeFromManualQueue = useCallback((indexToRemove, e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    setManualQueue(prev => (prev || []).filter((_, idx) => idx !== indexToRemove));
  }, []);

  // Remover música específica de "Próximas de: [Contexto]"
  const removeFromContextQueue = useCallback((indexToRemove, e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    setContextQueue(prev => {
      const active = (prev && prev.length > 0)
        ? prev
        : (effectiveContextQueueRef.current && effectiveContextQueueRef.current.length > 0)
          ? effectiveContextQueueRef.current
          : [];
      return active.filter((_, idx) => idx !== indexToRemove);
    });
  }, []);

  // Tocar música clicada dentro de "A seguir"
  const playManualQueueTrack = useCallback((idx) => {
    const list = manualQueueRef.current;
    if (!list || !list[idx]) return;
    const trackToPlay = list[idx];
    const remainingManual = list.slice(idx + 1);
    setManualQueue(remainingManual);
    playTrack(trackToPlay, true, null, null, true);
  }, []);

  // Tocar música clicada dentro de "Próximas de: [Contexto]"
  const playContextQueueTrack = useCallback((idx) => {
    const list = (contextQueueRef.current && contextQueueRef.current.length > 0)
      ? contextQueueRef.current
      : (effectiveContextQueueRef.current && effectiveContextQueueRef.current.length > 0)
        ? effectiveContextQueueRef.current
        : [];
    if (!list || !list[idx]) return;
    const trackToPlay = list[idx];
    const remainingContext = list.slice(idx + 1);
    setContextQueue(remainingContext);
    playTrack(trackToPlay, true, null, null, true);
  }, []);

  // Alternar modo aleatório: embaralha APENAS a fila contextual, mantendo intacta a ordem de "A seguir"
  const toggleShuffle = useCallback(() => {
    setIsShuffle(prev => {
      const nextVal = !prev;
      if (nextVal) {
        setContextQueue(currentContext => {
          const listToShuffle = (currentContext && currentContext.length > 0)
            ? currentContext
            : (effectiveContextQueueRef.current && effectiveContextQueueRef.current.length > 0)
              ? effectiveContextQueueRef.current
              : [];

          if (!listToShuffle || listToShuffle.length <= 1) return listToShuffle;
          const shuffled = [...listToShuffle];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          return shuffled;
        });
        showQueueToast('Modo aleatório ativado: próximas músicas embaralhadas');
      } else {
        showQueueToast('Modo aleatório desativado');
      }
      return nextVal;
    });
  }, [showQueueToast]);

  // Abrir menu de contexto de 3 pontinhos na música
  const openTrackContextMenu = useCallback((track, e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (!track) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 200;
    const menuHeight = 110;
    let x = rect.left - 140;
    if (x + menuWidth > window.innerWidth - 12) {
      x = window.innerWidth - menuWidth - 12;
    }
    if (x < 12) x = 12;

    let y = rect.bottom + 6;
    if (y + menuHeight > window.innerHeight - 12) {
      y = rect.top - menuHeight - 6;
    }

    setActiveTrackMenu({ track, x, y });
  }, []);

  // Histórico de músicas ouvidas (Estilo Spotify - Isolado estritamente por usuário)
  const [lastTrack, setLastTrack] = useState(null);
  const [recentHistory, setRecentHistory] = useState([]);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const recentCarouselRef = useRef(null);
  const [canScrollRecentLeft, setCanScrollRecentLeft] = useState(false);
  const [canScrollRecentRight, setCanScrollRecentRight] = useState(true);
  const [showFullHistoryModal, setShowFullHistoryModal] = useState(false);
  const [historyVisibleCount, setHistoryVisibleCount] = useState(15);
  const [historySearchTerm, setHistorySearchTerm] = useState('');

  const scrollRecentCarousel = (direction) => {
    if (recentCarouselRef.current) {
      const card = recentCarouselRef.current.querySelector(`.${styles.spotifyRecentCard}`);
      const step = card ? card.offsetWidth + 16 : 280;
      const scrollAmount = direction === 'left' ? -step * 2 : step * 2;
      recentCarouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleRecentCarouselScroll = () => {
    if (recentCarouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = recentCarouselRef.current;
      setCanScrollRecentLeft(scrollLeft > 10);
      setCanScrollRecentRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    handleRecentCarouselScroll();
  }, [recentHistory, lastTrack]);

  const formatPlayedTime = (timestamp) => {
    if (!timestamp) return 'Recentemente';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Recentemente';
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));

      const isToday = date.getFullYear() === now.getFullYear() &&
                      date.getMonth() === now.getMonth() &&
                      date.getDate() === now.getDate();

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = date.getFullYear() === yesterday.getFullYear() &&
                          date.getMonth() === yesterday.getMonth() &&
                          date.getDate() === yesterday.getDate();

      const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      if (diffMs >= 0 && diffMins < 1 && isToday) return 'Agora mesmo';
      if (diffMs >= 0 && diffMins < 60 && isToday) return `Há ${diffMins} min`;
      if (isToday) return `Hoje às ${timeStr}`;
      if (isYesterday) return `Ontem às ${timeStr}`;
      return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} às ${timeStr}`;
    } catch (_) {
      return 'Recentemente';
    }
  };

  // Limpa chaves não isoladas herdadas de versões antigas para impedir contaminação entre contas
  useEffect(() => {
    try {
      localStorage.removeItem('devsongs_last_track');
      localStorage.removeItem('devsongs_recent_history');
    } catch (_) {}
  }, []);

  // Sincroniza histórico e recomendações personalizadas sempre que o usuário ativo mudar
  useEffect(() => {
    if (!user || !user.id) {
      setLastTrack(null);
      setRecentHistory([]);
      return;
    }

    const userId = user.id;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    // 1. Carrega do cache local isolado por ID do usuário atual para resposta instantânea
    try {
      const userLast = localStorage.getItem(`devsongs_last_track_${userId}`);
      const userHist = localStorage.getItem(`devsongs_recent_history_${userId}`);
      if (userHist) {
        const parsedHist = JSON.parse(userHist);
        setRecentHistory(Array.isArray(parsedHist) ? parsedHist : []);
      } else {
        setRecentHistory([]);
      }
      if (userLast) {
        const parsedLast = JSON.parse(userLast);
        setLastTrack(parsedLast);
      } else {
        setLastTrack(null);
      }
    } catch (_) {}

    // 2. Consulta histórico oficial do usuário no backend e atualiza o estado
    if (token) {
      fetch(`${API_URL}/api/music/history?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (data && data.success && Array.isArray(data.history)) {
            setRecentHistory(data.history);
            if (data.history.length > 0) {
              setLastTrack(data.history[0]);
              try {
                localStorage.setItem(`devsongs_last_track_${userId}`, JSON.stringify(data.history[0]));
                localStorage.setItem(`devsongs_recent_history_${userId}`, JSON.stringify(data.history));
              } catch (_) {}
            } else {
              setLastTrack(null);
              try {
                localStorage.removeItem(`devsongs_last_track_${userId}`);
                localStorage.removeItem(`devsongs_recent_history_${userId}`);
              } catch (_) {}
            }
          }
        })
        .catch(err => console.warn('Aviso ao carregar histórico isolado do usuário:', err));

      // 3. Consulta recomendações inteligentes personalizadas da Home
      fetch(`${API_URL}/api/music/recommendations`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (data && data.success) {
            if (Array.isArray(data.escolhaADedo) && data.escolhaADedo.length > 0) {
              setEscolhaADedo(data.escolhaADedo);
            }
            if (Array.isArray(data.albunsParaVoce) && data.albunsParaVoce.length > 0) {
              setAlbunsParaVoce(data.albunsParaVoce);
            }
            if (data.source) {
              setRecsSource(data.source);
            }
          }
        })
        .catch(err => console.warn('Aviso ao carregar recomendações inteligentes:', err));
    }
  }, [user?.id]);

  // Bio expand
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  // YouTube Full Track Engine (Inicia nulo para não tocar ou carregar nada sozinho)
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [showVideoDock, setShowVideoDock] = useState(false);
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);

  // Alternar tela cheia nativa do vídeo ou Modo Cinema expandido
  const handleToggleFullscreen = () => {
    const el = document.getElementById('devsongs-yt-dock-container') || document.querySelector('#devsongs-yt-dock-container iframe');
    if (!el) return;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {
          setIsVideoExpanded(true);
        });
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      } else {
        setIsVideoExpanded(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  // Refs
  const audioFallbackRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const altVideoIdRef = useRef(null);
  const pendingVideoRef = useRef(null);
  const progressTimerRef = useRef(null);
  const pillsBarRef = useRef(null);
  const albumsRowRef = useRef(null);
  const singlesRowRef = useRef(null);
  const appearsOnRowRef = useRef(null);
  const albunsScrollRef = useRef(null);
  const relatedAlbumsScrollRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchFilterBarRef = useRef(null);
  const isClosingRef = useRef(false);
  const currentTrackRef = useRef(null);
  const mainContentRef = useRef(null);
  const previousViewRef = useRef(null);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  // Função para retornar da tela de Álbum dedicado ou Artista para onde o usuário estava (ex: Playlist na Biblioteca)
  const handleBackFromDedicatedView = () => {
    if (previousViewRef.current) {
      const prev = previousViewRef.current;
      previousViewRef.current = null;
      setViewMode(prev.viewMode || 'home');
      if (prev.activeTab) setActiveTab(prev.activeTab);
      if (prev.selectedSidebarPlaylistId !== undefined) {
        setSelectedSidebarPlaylistId(prev.selectedSidebarPlaylistId);
      }
      if (prev.selectedAlbum) setSelectedAlbum(prev.selectedAlbum);
      if (prev.activeArtist) setActiveArtist(prev.activeArtist);
    } else {
      setViewMode('home');
      setActiveTab('biblioteca');
    }
  };

  // Suporte ao botão Voltar / Avançar do navegador (popstate) mantendo a integridade da navegação
  useEffect(() => {
    const handlePopState = () => {
      if (previousViewRef.current) {
        const prev = previousViewRef.current;
        previousViewRef.current = null;
        setViewMode(prev.viewMode || 'home');
        if (prev.activeTab) setActiveTab(prev.activeTab);
        if (prev.selectedSidebarPlaylistId !== undefined) {
          setSelectedSidebarPlaylistId(prev.selectedSidebarPlaylistId);
        }
        if (prev.selectedAlbum) setSelectedAlbum(prev.selectedAlbum);
        if (prev.activeArtist) setActiveArtist(prev.activeArtist);
      } else if (viewMode === 'album' || viewMode === 'artist') {
        setViewMode('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [viewMode]);

  // Rolar carrosséis horizontalmente
  const scrollRow = (ref, dir) => {
    if (ref.current) {
      ref.current.scrollBy({ left: dir === 'left' ? -420 : 420, behavior: 'smooth' });
    }
  };

  const scrollAlbuns = (dir) => {
    if (albunsScrollRef.current) {
      albunsScrollRef.current.scrollBy({ left: dir === 'left' ? -380 : 380, behavior: 'smooth' });
    }
  };

  const scrollRelatedAlbums = (dir) => {
    if (relatedAlbumsScrollRef.current) {
      relatedAlbumsScrollRef.current.scrollBy({ left: dir === 'left' ? -380 : 380, behavior: 'smooth' });
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

      // Buscar dados mais recentes da API caso o perfil tenha sido atualizado
      fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.user) {
            setUser(data.user);
            localStorage.setItem('userData', JSON.stringify(data.user));
          }
        })
        .catch(() => {});
    } catch (_) {
      router.push('/login');
    }
  }, [router]);

  // Fechamento do menu do avatar ao clicar fora ou pressionar ESC
  useEffect(() => {
    if (!showAvatarMenu) return;

    const handleClickOutsideAvatar = (e) => {
      if (
        avatarMenuRef.current &&
        !avatarMenuRef.current.contains(e.target) &&
        avatarBtnRef.current &&
        !avatarBtnRef.current.contains(e.target)
      ) {
        setShowAvatarMenu(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowAvatarMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutsideAvatar);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideAvatar);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAvatarMenu]);

  // Plays count generator realista para a tabela do YouTube Music
  const generatePlaysCount = (idx) => {
    const counts = [
      'Tocou 4,8 mi vezes',
      'Tocou 2,0 mi vezes',
      'Tocou 2,3 mi vezes',
      'Tocou 1,9 mi vezes',
      'Tocou 2,6 mi vezes',
      'Tocou 2,8 mi vezes',
      'Tocou 1,1 mi vezes',
      'Tocou 1,7 mi vezes',
      'Tocou 890 mil vezes',
      'Tocou 740 mil vezes',
      'Tocou 680 mil vezes',
      'Tocou 590 mil vezes'
    ];
    return counts[idx % counts.length];
  };

  // 2. Load Full Tracks for the artist
  const fetchArtistTracks = useCallback(async (query, artistId) => {
    if (!query && !artistId) return;
    setIsSearching(true);
    try {
      const qLower = (query || '').toLowerCase().trim();
      const rawArtistId = artistId ? String(artistId).replace('dz-artist-', '').replace('it-artist-', '') : '';
      const url = `${API_URL}/api/music/artist?q=${encodeURIComponent(query || '')}${rawArtistId ? `&artistId=${encodeURIComponent(rawArtistId)}` : ''}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data && data.artist) {
        let artistObj = data.artist;
        if (qLower === 'bk' || qLower === "bk'") {
          artistObj = {
            ...artistObj,
            name: 'BK',
            bannerImg: 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025316/bookhub/img/bk_banner.png',
            avatarImg: 'https://cdn-images.dzcdn.net/images/artist/7481fc25e9bf8f0d8c416ecb9104927d/1000x1000-000000-80-0-0.jpg',
            bannerPosition: 'center top',
            bio: "Uma das vozes mais contundentes dentro do rap nacional, Abebe Bikila, mais conhecido como BK', é um rapper carioca que carrega em suas rimas as vivências de um corpo negro dentro das grandes...",
            subscribers: artistObj.subscribers || '428 mil',
            listeners: artistObj.listeners || '428 mil ouvintes mensais'
          };
        } else if (qLower === 'dfideliz') {
          artistObj = {
            ...artistObj,
            bannerPosition: 'center 50%'
          };
        } else if (qLower === 'justin bieber') {
          artistObj = {
            ...artistObj,
            bannerImg: 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025309/bookhub/img/artist_banner_justin.jpg',
            avatarImg: 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025319/bookhub/img/justin_my_world.jpg',
            bannerPosition: 'center 30%'
          };
        } else if (qLower.includes('baco')) {
          artistObj = {
            ...artistObj,
            bannerPosition: 'center 16%'
          };
        } else {
          artistObj = {
            ...artistObj,
            bannerPosition: artistObj.bannerPosition || 'center 18%'
          };
        }
        setActiveArtist(artistObj);
        setTracks(data.tracks || []);
        if (data.albums) {
          const seenAlbumKeys = new Set();
          const uniqueAlbums = [];
          for (const a of data.albums) {
            const root = (a.title || '')
              .toLowerCase()
              .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              .replace(/\s*\([^)]*(deluxe|edition|version|clean|edited|anniversary|bonus|complete|expanded|special|international|explicit|remastered|feat|ft\.|part\.|prod\.)[^)]*\)/gi, '')
              .replace(/\s*\[[^\]]*(deluxe|edition|version|clean|edited|anniversary|bonus|complete|expanded|special|international|explicit|remastered|feat|ft\.|part\.|prod\.)[^\]]*\]/gi, '')
              .replace(/\s*(feat\.|ft\.|featuring|part\.|participação).*$/gi, '')
              .replace(/[^a-z0-9]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            if (!seenAlbumKeys.has(root)) {
              seenAlbumKeys.add(root);
              uniqueAlbums.push({
                ...a,
                year: getDisplayAlbumYear(a, artistObj.name || query, a.year)
              });
            }
          }
          setAlbums(uniqueAlbums);
        }
        if (data.singles) {
          setSingles(data.singles.map(s => ({
            ...s,
            year: getDisplayAlbumYear(s, artistObj.name || query, s.year)
          })));
        }
        setAppearsOn(data.appearsOn || []);
      } else {
        setActiveArtist(null);
      }
    } catch (err) {
      console.error('Erro ao carregar faixas:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const parseTrackDurationSec = (t) => {
    if (!t) return 214;
    if (typeof t.durationSec === 'number' && t.durationSec > 0) return t.durationSec;
    if (typeof t.duration_sec === 'number' && t.duration_sec > 0) return t.duration_sec;
    if (typeof t.duration === 'number' && t.duration > 0) return t.duration;
    if (typeof t.duration === 'string' && t.duration.includes(':')) {
      const parts = t.duration.split(':').map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) return parts[0] * 60 + parts[1];
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 214;
  };

  // Gravação precisa de histórico estritamente quando a música realmente começar a tocar
  const recordActualPlayback = useCallback((trackToRecord) => {
    const track = trackToRecord || currentTrackRef.current;
    if (!track || hasRecordedPlaybackRef.current) return;
    hasRecordedPlaybackRef.current = true;

    const realDurationSec = parseTrackDurationSec(track);
    const recordedTrack = {
      ...track,
      durationSec: realDurationSec,
      playedAt: new Date().toISOString()
    };

    setLastTrack(recordedTrack);

    try {
      if (user && user.id) {
        const userId = user.id;
        localStorage.setItem(`devsongs_last_track_${userId}`, JSON.stringify(recordedTrack));
        setRecentHistory(prev => {
          // Cada reprodução é preservada com seu próprio registro e horário cronológico
          const updated = [recordedTrack, ...(prev || [])].slice(0, 100);
          localStorage.setItem(`devsongs_recent_history_${userId}`, JSON.stringify(updated));
          return updated;
        });

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
          fetch(`${API_URL}/api/music/history`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ track: recordedTrack })
          }).catch(err => console.warn('Aviso ao sincronizar histórico no servidor:', err));
        }
      }
    } catch (_) {}
  }, [user]);

  // Fallback seguro para áudio oficial em alta definição caso YouTube tenha erro ou restrição
  const fallbackToAudioStream = useCallback(() => {
    if (!currentTrackRef.current) return;
    const track = currentTrackRef.current;
    if (track.preview && audioFallbackRef.current) {
      audioFallbackRef.current.src = track.preview;
      audioFallbackRef.current.volume = volume;
      audioFallbackRef.current.play().then(() => {
        setIsPlaying(true);
        recordActualPlayback(track);
      }).catch(err => {
        console.warn('Erro ao reproduzir áudio direto:', err);
      });
    }
  }, [volume, recordActualPlayback]);

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
            fs: 1, // Habilita o botão nativo de tela cheia/expandir do YouTube
            playsinline: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : ''
          },
          events: {
            onReady: (e) => {
              e.target.setVolume(volume * 100);
              if (pendingVideoRef.current && typeof e.target.loadVideoById === 'function') {
                const vid = pendingVideoRef.current;
                pendingVideoRef.current = null;
                e.target.loadVideoById(vid);
                e.target.playVideo();
              }
              try {
                const iframe = e.target.getIframe?.() || document.getElementById('devsongs-yt-frame') || document.querySelector('#devsongs-yt-dock-container iframe');
                if (iframe) {
                  iframe.setAttribute('allowfullscreen', '1');
                  iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen');
                  iframe.setAttribute('webkitallowfullscreen', 'true');
                  iframe.setAttribute('mozallowfullscreen', 'true');
                }
              } catch (_) {}
            },
            onError: (e) => {
              console.warn('YouTube Player Erro (código ' + e.data + '), verificando alternativa...');
              // Se tiver um vídeo alternativo (ex: lyric video/áudio oficial), tenta ele antes de qualquer fallback
              if (altVideoIdRef.current && ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
                const alt = altVideoIdRef.current;
                altVideoIdRef.current = null;
                console.log('Tentando vídeo alternativo do YouTube:', alt);
                ytPlayerRef.current.loadVideoById(alt);
                ytPlayerRef.current.playVideo();
                return;
              }
              fallbackToAudioStream();
            },
            onStateChange: (e) => {
              if (isClosingRef.current) return;
              if (e.data === 1) {
                setIsPlaying(true);
                const realDur = ytPlayerRef.current?.getDuration?.() || 0;
                const expectedDur = currentTrackRef.current?.durationSec || 214;
                const isAd = realDur > 0 && realDur < 45 && expectedDur >= 60;
                if (!isAd) {
                  if (realDur > 0) {
                    setDuration(realDur);
                  }
                  recordActualPlayback(currentTrackRef.current);
                }
              }
              if (e.data === 2) setIsPlaying(false);
              if (e.data === 0) {
                // Vídeo finalizado: verifica se foi um anúncio ou se a música realmente acabou
                const cur = ytPlayerRef.current?.getCurrentTime?.() || 0;
                const expectedDur = currentTrackRef.current?.durationSec || 180;
                // Se terminou com menos de 45s e a música esperada tem mais de 60s, era anúncio!
                if (cur < 45 && expectedDur >= 60) {
                  console.log('Anúncio finalizado no YouTube, aguardando início da música real...');
                  return;
                }
                const finalDur = ytPlayerRef.current?.getDuration?.() || expectedDur;
                setCurrentTime(finalDur);
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

        setTimeout(() => {
          try {
            const iframe = document.getElementById('devsongs-yt-frame') || document.querySelector('#devsongs-yt-dock-container iframe');
            if (iframe) {
              iframe.setAttribute('allowfullscreen', '1');
              iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen');
              iframe.setAttribute('webkitallowfullscreen', 'true');
              iframe.setAttribute('mozallowfullscreen', 'true');
            }
          } catch (_) {}
        }, 600);
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
  }, [activeVideoId, volume, fallbackToAudioStream]);

  // Real-time progress timer inteligente com proteção contra anúncios
  useEffect(() => {
    if (isPlaying) {
      progressTimerRef.current = setInterval(() => {
        // Confirmação de início real de reprodução (somente quando a faixa está realmente tocando)
        if (!hasRecordedPlaybackRef.current && currentTrackRef.current) {
          const isAudioPlaying = audioFallbackRef.current && !audioFallbackRef.current.paused && (audioFallbackRef.current.currentTime || 0) >= 1;
          const isYtPlaying = ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === 'function' && ytPlayerRef.current.getPlayerState() === 1;
          const ytCur = ytPlayerRef.current?.getCurrentTime?.() || 0;
          const ytDur = ytPlayerRef.current?.getDuration?.() || 0;
          const isAd = ytDur > 0 && ytDur < 45 && (currentTrackRef.current?.durationSec || 214) >= 60;
          if (isAudioPlaying || (isYtPlaying && !isAd && ytCur >= 1)) {
            recordActualPlayback(currentTrackRef.current);
          }
        }

        // 1. Se o áudio nativo estiver tocando:
        if (audioFallbackRef.current && !audioFallbackRef.current.paused && audioFallbackRef.current.currentTime > 0) {
          const cur = audioFallbackRef.current.currentTime || 0;
          const dur = audioFallbackRef.current.duration || currentTrackRef.current?.durationSec || 214;
          setCurrentTime(cur);
          if (dur > 0) setDuration(dur);
          return;
        }

        // 2. Se o YouTube player estiver ativo:
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
          try {
            const cur = ytPlayerRef.current.getCurrentTime() || 0;
            const dur = ytPlayerRef.current.getDuration() || 0;
            const expectedDur = currentTrackRef.current?.durationSec || 214;
            // Detecta anúncio pré-roll curto do YouTube (ex: bumper ad de 6 a 15 segundos)
            const isAd = dur > 0 && dur < 45 && expectedDur >= 60;

            if (!isAd && dur > 0) {
              setDuration(dur);
              setCurrentTime(Math.min(cur, dur));
            } else if (!isAd && dur === 0) {
              setCurrentTime(prev => Math.min(prev + 0.5, expectedDur));
            }
            // Se for anúncio pré-roll, mantém a barra na duração real da música e não acelera!
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
  }, [isPlaying, recordActualPlayback]);

  // Reprodução de faixa com proteção multibase e gerenciamento inteligente de fila estilo Spotify
  const playTrack = async (track, forcePlay = false, contextQueueArg = null, contextNameArg = null, preserveExistingContext = false) => {
    if (!track) return;

    // Se não for reprodução forçada (ex: liberada imediatamente após checkout concluído com sucesso):
    if (!forcePlay) {
      const canPlay = isTrackPlayable(track);
      if (!canPlay) {
        addToCart(track, 'buy');
        return; // Faixa bloqueada: adicionada ao carrinho para compra
      }
    }

    const isSame = (a, b) => {
      if (!a || !b) return false;
      if (a.id && b.id && String(a.id) === String(b.id)) return true;
      if (a.dbTrackId && b.dbTrackId && Number(a.dbTrackId) === Number(b.dbTrackId)) return true;
      if (a.title && b.title && a.title.trim().toLowerCase() === b.title.trim().toLowerCase()) return true;
      return false;
    };

    // Só reconfigura o contexto se preserveExistingContext for falso
    if (!preserveExistingContext) {
      if (Array.isArray(contextQueueArg)) {
        if (contextNameArg) {
          setPlaybackContextName(contextNameArg);
        } else if (track.album && track.album !== 'Single' && track.album !== 'Variado') {
          setPlaybackContextName(track.album);
        }
        const idx = contextQueueArg.findIndex(t => isSame(t, track));
        let remaining;
        if (idx === 0) {
          remaining = contextQueueArg.slice(1);
        } else if (idx > 0) {
          remaining = contextQueueArg.slice(idx + 1);
        } else {
          remaining = contextQueueArg.filter(t => !isSame(t, track));
        }

        if (isShuffle) {
          const shuffled = [...remaining];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          remaining = shuffled;
        }
        setContextQueue(remaining);
      } else {
        if (contextNameArg) {
          setPlaybackContextName(contextNameArg);
        } else if (track.album && track.album !== 'Single' && track.album !== 'Variado') {
          setPlaybackContextName(track.album);
        } else {
          setPlaybackContextName('Sua Biblioteca');
        }

        setContextQueue(prev => {
          if (prev && prev.length > 0) {
            const idx = prev.findIndex(t => isSame(t, track));
            if (idx >= 0) {
              return prev.slice(idx + 1);
            }
            return prev;
          }
          return (validPurchases || []).filter(p => !isSame(p, track));
        });
      }
    }

    // Registra faixa anterior no histórico de sessão para o botão Anterior
    if (currentTrackRef.current && currentTrackRef.current.id !== track.id) {
      setPlayedSessionHistory(prev => [...prev, currentTrackRef.current]);
    }

    // Reinicia o bloqueio de gravação: o histórico só será registrado quando a reprodução do som/vídeo realmente iniciar
    hasRecordedPlaybackRef.current = false;

    const realDurationSec = parseTrackDurationSec(track);
    const enrichedTrack = {
      ...track,
      durationSec: realDurationSec
    };

    isClosingRef.current = false;
    setCurrentTrack(enrichedTrack);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(realDurationSec);

    try {
      const cleanArtist = (track.artist || '').replace(/\.(wav\d*|mp3|m4a|flac|ogg)/gi, '').trim();
      const searchParams = new URLSearchParams({
        title: track.title || '',
        artist: cleanArtist,
        album: (track.album && track.album !== 'Single' && track.album !== track.title) ? track.album : '',
        durationSec: realDurationSec,
        q: `${cleanArtist} ${track.title || ''}`.trim()
      });
      if (track.youtubeVideoId || track.youtube_video_id) {
        searchParams.append('youtubeVideoId', track.youtubeVideoId || track.youtube_video_id);
      }
      const res = await fetch(`${API_URL}/api/youtube/search?${searchParams.toString()}`);
      const data = await res.json();

      if (data && data.videoId) {
        setActiveVideoId(data.videoId);
        altVideoIdRef.current = data.altVideoId || null;

        // Limpa áudio fallback para não sobrepor nem disparar preview de 29s
        if (audioFallbackRef.current) {
          audioFallbackRef.current.pause();
          audioFallbackRef.current.currentTime = 0;
          audioFallbackRef.current.src = '';
        }

        if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
          ytPlayerRef.current.loadVideoById(data.videoId);
          ytPlayerRef.current.playVideo();
          setTimeout(() => {
            try {
              const iframe = ytPlayerRef.current.getIframe?.() || document.getElementById('devsongs-yt-frame') || document.querySelector('#devsongs-yt-dock-container iframe');
              if (iframe) {
                iframe.setAttribute('allowfullscreen', '1');
                iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen');
                iframe.setAttribute('webkitallowfullscreen', 'true');
                iframe.setAttribute('mozallowfullscreen', 'true');
              }
            } catch (_) {}
          }, 400);

          // Watchdog seguro (8s): Só intervém se o vídeo realmente não iniciar nem carregar
          setTimeout(() => {
            const state = ytPlayerRef.current?.getPlayerState?.();
            // -1: unstarted, 1: playing, 3: buffering, 5: cued
            const isAlive = state === 1 || state === 3 || state === -1 || state === 5;
            if (!isAlive && altVideoIdRef.current && typeof ytPlayerRef.current?.loadVideoById === 'function') {
              const alt = altVideoIdRef.current;
              altVideoIdRef.current = null;
              console.log('Watchdog ativando vídeo alternativo do YouTube:', alt);
              ytPlayerRef.current.loadVideoById(alt);
              ytPlayerRef.current.playVideo();
            } else if (!isAlive && (!state || state === 2) && audioFallbackRef.current && track.preview) {
              console.log('YouTube indisponível, ativando áudio oficial...');
              fallbackToAudioStream();
            }
          }, 8000);
        } else {
          // Guarda na fila para tocar assim que o player do YouTube emitir onReady
          pendingVideoRef.current = data.videoId;
        }
      } else {
        // Se não encontrar no YouTube, toca o áudio oficial da própria música no Deezer
        setActiveVideoId(null);
        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
          ytPlayerRef.current.pauseVideo();
        }
        fallbackToAudioStream();
      }
    } catch (err) {
      console.warn('Erro ao buscar YouTube, usando áudio oficial da faixa:', err);
      setActiveVideoId(null);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        ytPlayerRef.current.pauseVideo();
      }
      fallbackToAudioStream();
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
      if (currentTrack) {
        if (!activeVideoId || (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo !== 'function')) {
          playTrack(currentTrack);
          return;
        }
        if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
          ytPlayerRef.current.playVideo();
        }
        if (audioFallbackRef.current && audioFallbackRef.current.src) {
          audioFallbackRef.current.play().catch(() => {});
        }
        setIsPlaying(true);
      }
    }
  };

  const handleNextTrack = () => {
    if (isClosingRef.current || !currentTrackRef.current) return;

    // Se o modo de repetição única estiver ativo, reinicia a faixa atual
    if (isRepeat) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
        ytPlayerRef.current.seekTo(0);
      }
      setCurrentTime(0);
      setIsPlaying(true);
      return;
    }

    // Salva a faixa atual no histórico da sessão (para o botão voltar)
    if (currentTrackRef.current) {
      setPlayedSessionHistory(prev => [...prev, currentTrackRef.current]);
    }

    // PRIORIDADE 1 (Estilo Spotify): Músicas adicionadas manualmente pelo usuário ("A seguir")
    if (manualQueueRef.current && manualQueueRef.current.length > 0) {
      const nextTrack = manualQueueRef.current[0];
      const remainingManual = manualQueueRef.current.slice(1);
      setManualQueue(remainingManual);
      // Preserva a fila contextual intacta para ser retomada quando "A seguir" esvaziar
      playTrack(nextTrack, true, null, null, true);
      return;
    }

    // PRIORIDADE 2: Fila de contexto do álbum, playlist ou biblioteca ("Próximas de: [Contexto]")
    const activeContextQueue = (contextQueueRef.current && contextQueueRef.current.length > 0)
      ? contextQueueRef.current
      : (effectiveContextQueueRef.current && effectiveContextQueueRef.current.length > 0)
        ? effectiveContextQueueRef.current
        : [];

    if (activeContextQueue.length > 0) {
      const nextTrack = activeContextQueue[0];
      const remainingContext = activeContextQueue.slice(1);
      setContextQueue(remainingContext);
      playTrack(nextTrack, true, null, null, true);
      return;
    }

    // PRIORIDADE 3: Continuidade contínua da biblioteca do usuário
    if (validPurchases.length > 0) {
      const playedKeys = new Set(
        [...playedSessionHistoryRef.current, currentTrackRef.current].map(t =>
          (t?.id || t?.title || '').toString().toLowerCase().trim()
        )
      );

      // Evita músicas já reproduzidas na sessão atual
      let candidates = validPurchases.filter(p => {
        const key = (p.id || p.title || '').toString().toLowerCase().trim();
        return !playedKeys.has(key);
      });

      // Se todas já foram ouvidas na sessão atual, reinicia o ciclo
      if (candidates.length === 0) {
        candidates = validPurchases.filter(p => {
          const idMatch = (p.id && currentTrackRef.current?.id && p.id === currentTrackRef.current.id);
          const titleMatch = p.title && currentTrackRef.current?.title && p.title.trim().toLowerCase() === currentTrackRef.current.title.trim().toLowerCase();
          return !idMatch && !titleMatch;
        });
        setPlayedSessionHistory([]);
      }

      if (candidates.length === 0) candidates = validPurchases;

      let nextTrack;
      if (isShuffle) {
        const randIdx = Math.floor(Math.random() * candidates.length);
        nextTrack = candidates[randIdx];
      } else {
        const currentIndex = candidates.findIndex(t =>
          (t.id && t.id === currentTrackRef.current?.id) ||
          (t.title && currentTrackRef.current?.title && t.title.trim().toLowerCase() === currentTrackRef.current.title.trim().toLowerCase())
        );
        const nextIndex = currentIndex >= 0 && currentIndex < candidates.length - 1 ? currentIndex + 1 : 0;
        nextTrack = candidates[nextIndex];
      }

      if (nextTrack) {
        playTrack(nextTrack, true, null, null, true);
      }
    }
  };

  const handlePrevTrack = () => {
    if (isClosingRef.current || !currentTrackRef.current) return;

    // Se já tocou mais de 3 segundos, o comportamento padrão dos players modernos é reiniciar a música atual
    if (currentTime > 3) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
        ytPlayerRef.current.seekTo(0);
      }
      setCurrentTime(0);
      return;
    }

    // Se houver histórico de reprodução nesta sessão:
    if (playedSessionHistoryRef.current && playedSessionHistoryRef.current.length > 0) {
      const historyList = [...playedSessionHistoryRef.current];
      const prevTrack = historyList.pop();
      setPlayedSessionHistory(historyList);

      // Coloca a faixa atual de volta no início da fila de contexto
      if (currentTrackRef.current) {
        setContextQueue(prev => [currentTrackRef.current, ...(prev || [])]);
      }
      playTrack(prevTrack, true, null, null, true);
      return;
    }

    // Fallback: se não houver histórico de sessão, navega no catálogo de compras
    if (validPurchases.length > 0) {
      const currentIndex = validPurchases.findIndex(t => 
        (t.id && t.id === currentTrackRef.current?.id) || 
        (t.dbTrackId && t.dbTrackId === currentTrackRef.current?.dbTrackId) ||
        (t.title && currentTrackRef.current?.title && t.title.trim().toLowerCase() === currentTrackRef.current.title.trim().toLowerCase())
      );
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : validPurchases.length - 1;
      playTrack(validPurchases[prevIndex], true, null, null, true);
    }
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
    setIsVideoExpanded(false);
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
    if (audioFallbackRef.current && audioFallbackRef.current.src) {
      audioFallbackRef.current.currentTime = newTime;
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
    if (audioFallbackRef.current) {
      audioFallbackRef.current.volume = percent;
      audioFallbackRef.current.muted = false;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.unMute === 'function') {
        ytPlayerRef.current.unMute();
        ytPlayerRef.current.setVolume(volume * 100);
      }
      if (audioFallbackRef.current) {
        audioFallbackRef.current.muted = false;
        audioFallbackRef.current.volume = volume;
      }
    } else {
      setIsMuted(true);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.mute === 'function') {
        ytPlayerRef.current.mute();
      }
      if (audioFallbackRef.current) {
        audioFallbackRef.current.muted = true;
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
  const openArtistProfile = (artistName, artistId, returnState = null) => {
    if (!artistName && !artistId) return;
    if (returnState) {
      previousViewRef.current = returnState;
    } else if (viewMode !== 'artist') {
      previousViewRef.current = {
        viewMode,
        activeTab,
        selectedSidebarPlaylistId,
        selectedAlbum: selectedAlbum ? { ...selectedAlbum } : null,
        activeArtist: activeArtist ? { ...activeArtist } : null
      };
    }
    const slug = (artistName || artistId || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const artistUrl = `/artist/${slug}`;
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({ devsongsView: 'artist', artistName, artistId }, '', artistUrl);
    }
    setViewMode('artist');
    setSelectedAlbum(null);
    setShowSuggestions(false);
    setSidebarOpen(false);
    setShowAllAlbums(false);
    setShowAllSingles(false);

    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    const aLower = (artistName || '').toLowerCase().trim();
    if (aLower === 'justin bieber') {
      setActiveArtist({
        id: 'justin',
        name: 'Justin Bieber',
        listeners: '523 mi ouvintes mensais',
        bio: 'Justin Drew Bieber é um cantor, compositor e ator canadense. Considerado um ícone pop, ele é conhecido por suas performances musicais multigênero. Ele foi descoberto por Scooter Braun em...',
        bannerImg: 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025309/bookhub/img/artist_banner_justin.jpg',
        avatarImg: 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025319/bookhub/img/justin_my_world.jpg',
        bannerPosition: 'center 30%',
        subscribers: '78,6 mi'
      });
      fetchArtistTracks('Justin Bieber');
    } else if (aLower === 'bk' || aLower === "bk'") {
      setActiveArtist({
        id: 'bk',
        name: 'BK',
        listeners: '428 mil ouvintes mensais',
        bio: "Uma das vozes mais contundentes dentro do rap nacional, Abebe Bikila, mais conhecido como BK', é um rapper carioca que carrega em suas rimas as vivências de um corpo negro dentro das grandes...",
        bannerImg: 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025316/bookhub/img/bk_banner.png',
        avatarImg: 'https://cdn-images.dzcdn.net/images/artist/7481fc25e9bf8f0d8c416ecb9104927d/1000x1000-000000-80-0-0.jpg',
        bannerPosition: 'center top',
        subscribers: '428 mil'
      });
      fetchArtistTracks('BK');
    } else {
      fetchArtistTracks(artistName, artistId);
    }
  };
  openArtistProfileRef.current = openArtistProfile;

  // Verificar se o usuário autenticado está inscrito no artista ativo
  useEffect(() => {
    if (!activeArtist || !activeArtist.name) {
      setIsArtistSubscribed(false);
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setIsArtistSubscribed(false);
      return;
    }
    let isMounted = true;
    const checkSub = async () => {
      try {
        const artName = activeArtist.name || '';
        const artId = activeArtist.id || '';
        const res = await fetch(`${API_URL}/api/library/subscriptions/check?artistName=${encodeURIComponent(artName)}&artistId=${encodeURIComponent(artId)}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setIsArtistSubscribed(Boolean(data.subscribed));
          }
        }
      } catch (err) {
        console.error('Erro ao verificar status de inscrição do artista:', err);
      }
    };
    checkSub();
    return () => {
      isMounted = false;
    };
  }, [activeArtist]);

  // Alternar inscrição no artista (Inscrever-se / Abrir confirmação de cancelamento)
  const handleToggleArtistSubscription = async () => {
    if (!activeArtist) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      alert('Você precisa estar logado para se inscrever neste artista.');
      return;
    }

    if (isArtistSubscribed) {
      setUnsubscribeModalOpen(true);
      return;
    }

    setIsSubscribing(true);
    try {
      const artAvatar = activeArtist.avatarImg || activeArtist.avatar_url || activeArtist.picture || (
        activeArtist.name?.toLowerCase().includes('bk')
          ? 'https://cdn-images.dzcdn.net/images/artist/7481fc25e9bf8f0d8c416ecb9104927d/1000x1000-000000-80-0-0.jpg'
          : 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'
      );
      const res = await fetch(`${API_URL}/api/library/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          artistId: activeArtist.id,
          name: activeArtist.name,
          avatar_url: artAvatar,
          genre: activeArtist.genre || 'Rap',
          subscribers: activeArtist.subscribers || activeArtist.listeners || '428 mil'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsArtistSubscribed(true);
        setLibraryRefreshKey(k => (k || 0) + 1);
      } else {
        alert(data.error || 'Erro ao se inscrever no artista.');
      }
    } catch (err) {
      console.error('Erro ao registrar inscrição no artista:', err);
      alert('Não foi possível conectar ao servidor para registrar a inscrição.');
    } finally {
      setIsSubscribing(false);
    }
  };

  // Confirmar cancelamento de inscrição
  const handleConfirmUnsubscribe = async () => {
    if (!activeArtist) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    setIsSubscribing(true);
    try {
      const artName = activeArtist.name || '';
      const artId = activeArtist.id || '';
      const res = await fetch(`${API_URL}/api/library/subscriptions?artistName=${encodeURIComponent(artName)}&artistId=${encodeURIComponent(artId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsArtistSubscribed(false);
        setUnsubscribeModalOpen(false);
        setLibraryRefreshKey(k => (k || 0) + 1);
      } else {
        alert(data.error || 'Erro ao cancelar inscrição.');
      }
    } catch (err) {
      console.error('Erro ao cancelar inscrição do artista:', err);
      alert('Não foi possível conectar ao servidor para cancelar a inscrição.');
    } finally {
      setIsSubscribing(false);
    }
  };

  // Dispara a busca e vai para a tela de resultados do YouTube Music (Foto 2)
  const handleSearchSubmit = async (queryStr) => {
    const q = (queryStr !== undefined ? queryStr : searchQuery).trim();
    if (!q) return;
    setSearchQuery(q);
    setShowSuggestions(false);
    setSelectedAlbum(null);
    setSelectedSearchFilter('Tudo');
    setViewMode('search');
    setIsSearching(true);

    const qLower = q.toLowerCase();

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_URL}/api/music/search?q=${encodeURIComponent(q)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data && data.artist) {
        let art = data.artist;
        if (qLower === 'bk' || qLower === "bk'") {
          art = { ...art, name: 'BK', bannerImg: 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025316/bookhub/img/bk_banner.png', avatarImg: 'https://cdn-images.dzcdn.net/images/artist/7481fc25e9bf8f0d8c416ecb9104927d/1000x1000-000000-80-0-0.jpg', bannerPosition: 'center top' };
        } else if (qLower.includes('baco')) {
          art = { ...art, bannerPosition: 'center 16%' };
        }
        setActiveArtist(art);
      } else {
        setActiveArtist(null);
      }
      setSearchArtists(data.artists || (data.artist ? [data.artist] : []));
      setTracks(data.tracks || []);
    } catch (err) {
      console.error('Erro na busca:', err);
    } finally {
      setIsSearching(false);
    }
  };


  // Ao clicar em um álbum, abre a visualização dedicada do Álbum (Foto do YouTube Music)
  const handleSelectAlbum = async (album, returnState = null) => {
    if (!album) return;
    if (returnState) {
      previousViewRef.current = returnState;
    } else if (viewMode !== 'album') {
      previousViewRef.current = {
        viewMode,
        activeTab,
        selectedSidebarPlaylistId,
        selectedAlbum: selectedAlbum ? { ...selectedAlbum } : null,
        activeArtist: activeArtist ? { ...activeArtist } : null
      };
    }
    const albumSlug = (album.title || album.id || 'album').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const albumUrl = `/album/${album.id || albumSlug}`;
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({ devsongsView: 'album', albumId: album.albumId || album.id, title: album.title }, '', albumUrl);
    }
    try {
      setIsSearching(true);
      setIsAlbumLoading(true);
      // Limpa faixas de álbuns anteriores para evitar dados residuais e salto visual
      setAlbumTracks([]);

      const resolvedArtist = album.artist || album.artistName || album.artist_name || activeArtist?.name || '';
      const resolvedAvatar = album.artistAvatar || (resolvedArtist && activeArtist?.name && activeArtist.name.toLowerCase() === resolvedArtist.toLowerCase() ? activeArtist.avatarImg : '') || '';

      setSelectedAlbum({
        ...album,
        artist: resolvedArtist,
        artistName: resolvedArtist,
        artistAvatar: resolvedAvatar,
        nbTracks: album.nbTracks || null,
        durationSec: album.durationSec || null
      });
      setViewMode('album');

      // Joga a visualização imediatamente para a parte de cima do álbum
      if (mainContentRef.current) {
        mainContentRef.current.scrollTop = 0;
      }
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }

      const albumIdParam = album.albumId || album.id || '';
      const artistNameParam = album.artist || activeArtist?.name || '';
      const albumTitleParam = album.title || '';

      const res = await fetch(
        `${API_URL}/api/music/album-tracks?albumId=${encodeURIComponent(albumIdParam)}&title=${encodeURIComponent(albumTitleParam)}&artist=${encodeURIComponent(artistNameParam)}`
      );
      const data = await res.json();

      if (data && data.album) {
        setSelectedAlbum({
          ...album,
          ...data.album,
          year: getDisplayAlbumYear(data.album, artistNameParam, data.album.year)
        });
      }
      if (data && data.relatedAlbums && data.relatedAlbums.length > 0) {
        setRelatedAlbums(data.relatedAlbums.map(a => ({
          ...a,
          year: getDisplayAlbumYear(a, a.artist || artistNameParam, a.year)
        })));
      } else {
        const pool = (albums && albums.length > 0) ? albums : albunsParaVoce;
        setRelatedAlbums(pool.filter(a => a.id !== (data?.album?.id || album.id)).slice(0, 8).map(a => ({
          ...a,
          year: getDisplayAlbumYear(a, a.artist || artistNameParam, a.year)
        })));
      }
      if (data && data.tracks && data.tracks.length > 0) {
        const enrichedTracks = data.tracks.map(t => ({
          ...t,
          album: t.album || data.album?.title || album.title,
          albumId: t.albumId || data.album?.id || album.id,
          album_id: t.album_id || data.album?.id || album.id
        }));
        setAlbumTracks(enrichedTracks);
        setTracks(enrichedTracks);
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

      // Garante que a tela permaneça no topo com o carregamento final
      if (mainContentRef.current) {
        mainContentRef.current.scrollTop = 0;
      }
    } catch (err) {
      console.warn('Erro ao carregar faixas do álbum:', err);
    } finally {
      setIsSearching(false);
      setIsAlbumLoading(false);
    }
  };
  handleSelectAlbumRef.current = handleSelectAlbum;

  const navigateTo = (path, options = {}) => {
    if (path === '/home') {
      setViewMode('home');
      setActiveTab('inicio');
      setSelectedAlbum(null);
      setSelectedCompany(null);
      setBaseMode('home');
      setCompanyTracks([]);
      setActiveArtist(null);
      if (router.pathname && (router.pathname.startsWith('/artist') || router.pathname.startsWith('/album') || router.pathname.startsWith('/playlist'))) {
        router.push('/home');
      } else if (typeof window !== 'undefined') {
        window.history.pushState({ devsongsView: 'home', tab: 'inicio' }, '', '/home');
      }
    } else if (path === '/community' || path === '/explore') {
      setViewMode('home');
      setActiveTab('comunidade');
      setSelectedAlbum(null);
      setSelectedCompany(null);
      setActiveArtist(null);
      if (router.pathname && (router.pathname.startsWith('/artist') || router.pathname.startsWith('/album') || router.pathname.startsWith('/playlist'))) {
        router.push('/community');
      } else if (typeof window !== 'undefined') {
        window.history.pushState({ devsongsView: 'home', tab: 'comunidade' }, '', '/community');
      }
    } else if (path === '/library') {
      setViewMode('home');
      setActiveTab('biblioteca');
      setSelectedAlbum(null);
      setSelectedSidebarPlaylistId(null);
      setActiveArtist(null);
      fetchUserPurchases();
      if (router.pathname && (router.pathname.startsWith('/artist') || router.pathname.startsWith('/album') || router.pathname.startsWith('/playlist'))) {
        router.push('/library');
      } else if (typeof window !== 'undefined') {
        window.history.pushState({ devsongsView: 'home', tab: 'biblioteca' }, '', '/library');
      }
    } else if (path === '/upgrade') {
      setViewMode('home');
      setActiveTab('upgrade');
      setSelectedAlbum(null);
      setSelectedCompany(null);
      setActiveArtist(null);
      if (router.pathname && (router.pathname.startsWith('/artist') || router.pathname.startsWith('/album') || router.pathname.startsWith('/playlist'))) {
        router.push('/upgrade');
      } else if (typeof window !== 'undefined') {
        window.history.pushState({ devsongsView: 'home', tab: 'upgrade' }, '', '/upgrade');
      }
    } else if (path.startsWith('/artist/')) {
      const slugOrId = path.replace('/artist/', '');
      openArtistProfile(options.artistName || slugOrId, options.artistId || slugOrId, options.returnState);
    } else if (path.startsWith('/album/')) {
      const albumId = path.replace('/album/', '');
      handleSelectAlbum(options.album || { id: albumId, albumId }, options.returnState);
    } else if (path.startsWith('/playlist/')) {
      const plId = path.replace('/playlist/', '');
      setSelectedSidebarPlaylistId(plId);
      setActiveTab('biblioteca');
      setViewMode('home');
      setSelectedAlbum(null);
      setActiveArtist(null);
      if (typeof window !== 'undefined') {
        window.history.pushState({ devsongsView: 'home', playlistId: plId }, '', path);
      }
    }
  };
  navigateToRef.current = navigateTo;

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
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      localStorage.removeItem('devsongs_last_track');
      localStorage.removeItem('devsongs_recent_history');
      localStorage.removeItem('devsongs_cart');
      localStorage.removeItem('devsongs_used_coupons');
    } catch (_) {}
    setUser(null);
    setRecentHistory([]);
    setLastTrack(null);
    setCurrentTrack(null);
    setIsPlaying(false);
    setEscolhaADedo(HOME_ESCOLHA_A_DEDO);
    setAlbunsParaVoce(HOME_ALBUNS_PARA_VOCE);
    router.push('/login');
  };

  const isSuperAdmin = user?.role === 'admin';

  return (
    <>
      <Head>
        <title>DevSongs — Streaming de Músicas</title>
        <meta name="description" content="Streaming oficial DevSongs inspirado no YouTube Music e Spotify com músicas 100% completas." />
        <meta name="referrer" content="no-referrer" />
        <link rel="icon" href="https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025191/bookhub/favicon.png" type="image/png" />
      </Head>

      <audio
        ref={audioFallbackRef}
        style={{ display: 'none' }}
        onTimeUpdate={(e) => {
          const isYtPlaying = ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === 'function' && ytPlayerRef.current.getPlayerState() === 1;
          if (!isYtPlaying && e.currentTarget) {
            setCurrentTime(e.currentTarget.currentTime || 0);
            if (e.currentTarget.duration) {
              setDuration(e.currentTarget.duration);
            }
          }
        }}
        onEnded={() => {
          const isYtPlaying = ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === 'function' && ytPlayerRef.current.getPlayerState() === 1;
          if (!isYtPlaying && !isClosingRef.current && currentTrackRef.current) {
            handleNextTrack();
          }
        }}
        onError={(e) => {
          console.warn('Erro na tag de áudio:', e);
        }}
      />

      <div className={`${styles.appContainer} ${viewMode === 'artist' ? styles.appContainerArtist : ''}`}>

        {/* ─── TOP APP BAR (Barra Superior Completa Estilo YouTube Music) ─── */}
        <header
          className={`${styles.topAppBar} ${
            viewMode === 'artist'
              ? sidebarOpen
                ? styles.topAppBarOpen
                : isScrolled
                  ? styles.topAppBarScrolled
                  : styles.topAppBarTransparent
              : isScrolled
                ? styles.topAppBarScrolled
                : ''
          }`}
        >
          <div className={styles.topAppBarLeft}>
            <button
              className={styles.hamburgerBtn}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Recolher menu' : 'Expandir menu'}
            >
              <Menu size={22} />
            </button>
            <div
              className={styles.ytMusicLogoRow}
              onClick={() => navigateTo('/home')}
              style={{ cursor: 'pointer' }}
              title="Ir para página inicial DevSongs"
            >
              <Image
                src="https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png"
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

          {/* Campo de pesquisa com Autocomplete Dropdown (Foto 1) */}
          <div className={styles.searchWrap} ref={searchContainerRef}>
            <Search size={18} className={styles.searchIcon} />
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
                <X size={16} />
              </button>
            )}

            {/* ─── DROPDOWN DE SUGESTÕES DE BUSCA (Foto 1) ─── */}
            {showSuggestions && searchQuery.trim().length > 0 && (() => {
              const qTrim = searchQuery.trim().toLowerCase();
              const queriesToRender = suggestQueries || [];
              const entitiesToRender = suggestEntities || [];

              if (queriesToRender.length === 0 && entitiesToRender.length === 0) {
                return null;
              }

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
                      className={styles.searchEntityItem}
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
                          openArtistProfile(entity.title, entity.id);
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
                        src={getSafeCover(entity)}
                        alt={entity.title}
                        className={`${styles.searchEntityThumb} ${entity.type === 'artist' ? styles.searchEntityThumbArtist : ''}`}
                        referrerPolicy="no-referrer"
                        onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
                      />
                      <div className={styles.searchEntityContent}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                          <span className={styles.searchEntityTitle}>{entity.title}</span>
                          {(entity.isPurchased || entity.badge === 'Comprada' || isTrackOwned(entity)) ? (
                            <span className={styles.purchasedBadge} style={{ flexShrink: 0, padding: '1px 5px', fontSize: '0.68rem', lineHeight: '1.2' }}>
                              Comprada
                            </span>
                          ) : ((entity.isRented || entity.badge === 'Alugada' || isTrackRentedActive(entity)) && !entity.isExpired) ? (
                            <span className={styles.rentedBadge} style={{ flexShrink: 0, padding: '1px 5px', fontSize: '0.68rem', lineHeight: '1.2' }}>
                              Alugada
                            </span>
                          ) : null}
                        </div>
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
            {/* Seletor de Base / Empresa (Multi-Base) */}
            <div className={styles.baseSelectorWrap} ref={companyDropdownRef}>
              <button
                type="button"
                className={`${styles.baseSelectorBtn} ${(selectedCompany || baseMode !== 'home') ? styles.baseSelectorBtnActive : ''}`}
                onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                title="Alternar entre Bases e Gravadoras"
              >
                <Building2 size={16} />
                <span>
                  {selectedCompany
                    ? selectedCompany.name
                    : baseMode === 'all'
                    ? 'Todas as Bases'
                    : baseMode === 'streaming'
                    ? 'Streaming'
                    : baseMode === 'buy'
                    ? 'Compras'
                    : baseMode === 'rent'
                    ? 'Aluguéis'
                    : 'Todas as Bases'}
                </span>
                <ChevronDown size={14} />
              </button>

              {showCompanyDropdown && (
                <div className={styles.baseDropdown}>
                  <div className={styles.baseDropdownHeader}>
                    <span>Modalidades de Base</span>
                  </div>

                  {/* 1. Início Streaming Livre */}
                  <button
                    type="button"
                    className={`${styles.baseDropdownItem} ${!selectedCompany && baseMode === 'home' ? styles.baseDropdownItemActive : ''}`}
                    onClick={() => handleSelectBaseMode('home')}
                  >
                    <div className={styles.baseItemIconGlobal}>🎧</div>
                    <div className={styles.baseItemMeta}>
                      <span className={styles.baseItemTitle}>Início • Streaming Livre</span>
                      <span className={styles.baseItemSub}>Tela inicial com reprodução contínua e playlists</span>
                    </div>
                  </button>

                  {/* 2. Todas as Bases */}
                  <button
                    type="button"
                    className={`${styles.baseDropdownItem} ${!selectedCompany && baseMode === 'all' ? styles.baseDropdownItemActive : ''}`}
                    onClick={() => handleSelectBaseMode('all')}
                  >
                    <div className={styles.baseItemIconGlobal}>🌐</div>
                    <div className={styles.baseItemMeta}>
                      <span className={styles.baseItemTitle}>Todas as Bases (Comercial)</span>
                      <span className={styles.baseItemSub}>Catálogo completo unificado de todas as gravadoras</span>
                    </div>
                  </button>

                  {/* 3. Streaming Comercial */}
                  <button
                    type="button"
                    className={`${styles.baseDropdownItem} ${!selectedCompany && baseMode === 'streaming' ? styles.baseDropdownItemActive : ''}`}
                    onClick={() => handleSelectBaseMode('streaming')}
                  >
                    <div className={styles.baseItemIconGlobal}>▶️</div>
                    <div className={styles.baseItemMeta}>
                      <span className={styles.baseItemTitle}>Streaming Comercial</span>
                      <span className={styles.baseItemSub}>Faixas de gravadoras autorizadas para streaming</span>
                    </div>
                  </button>

                  {/* 4. Compras */}
                  <button
                    type="button"
                    className={`${styles.baseDropdownItem} ${!selectedCompany && baseMode === 'buy' ? styles.baseDropdownItemActive : ''}`}
                    onClick={() => handleSelectBaseMode('buy')}
                  >
                    <div className={styles.baseItemIconGlobal}>🛒</div>
                    <div className={styles.baseItemMeta}>
                      <span className={styles.baseItemTitle}>Compras de Licenças</span>
                      <span className={styles.baseItemSub}>Faixas comerciais disponíveis para aquisição</span>
                    </div>
                  </button>

                  {/* 5. Aluguéis */}
                  <button
                    type="button"
                    className={`${styles.baseDropdownItem} ${!selectedCompany && baseMode === 'rent' ? styles.baseDropdownItemActive : ''}`}
                    onClick={() => handleSelectBaseMode('rent')}
                  >
                    <div className={styles.baseItemIconGlobal}>⏱️</div>
                    <div className={styles.baseItemMeta}>
                      <span className={styles.baseItemTitle}>Aluguéis de Licenças</span>
                      <span className={styles.baseItemSub}>Acesso temporário (30 dias) com estoque ativo</span>
                    </div>
                  </button>

                  <div className={styles.baseDropdownDivider} />

                  <div className={styles.baseDropdownHeader}>
                    <span>Gravadoras & Selos Parceiros</span>
                  </div>

                  {companies.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`${styles.baseDropdownItem} ${selectedCompany?.id === c.id ? styles.baseDropdownItemActive : ''}`}
                      onClick={() => handleSelectCompany(c)}
                    >
                      <img
                        src={c.logo_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                        alt={c.name}
                        className={styles.baseItemThumb}
                        onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
                      />
                      <div className={styles.baseItemMeta}>
                        <span className={styles.baseItemTitle}>{c.name}</span>
                        <span className={styles.baseItemSub}>
                          {c.genre} • {c.total_stock || 0} em estoque
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Botão de Carrinho de Compras com Badge */}
            <button
              type="button"
              className={styles.cartHeaderBtn}
              onClick={() => {
                setCartStep('cart');
                setIsCartOpen(true);
              }}
              title={`Carrinho de Compras (${cartItems.length} itens)`}
            >
              <ShoppingCart size={20} />
              {cartItems.length > 0 && (
                <span className={styles.cartBadge}>{cartItems.length}</span>
              )}
            </button>

            {isSuperAdmin && (
              <div className={styles.adminPill}>
                <ShieldCheck size={14} />
                <span>Superadmin</span>
              </div>
            )}

            {/* Profile Avatar Circle with Dropdown Menu */}
            <div className={styles.avatarWrapper}>
              <button
                ref={avatarBtnRef}
                onClick={() => setShowAvatarMenu(prev => !prev)}
                className={styles.userBtn}
                title={user?.full_name || 'Meu Perfil'}
                aria-label="Menu do Usuário"
                aria-expanded={showAvatarMenu}
              >
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user?.full_name || 'Avatar'} className={styles.userBtnImg} />
                ) : (
                  user?.full_name?.charAt(0)?.toUpperCase() || 'E'
                )}
              </button>

              {showAvatarMenu && (
                <div ref={avatarMenuRef} className={styles.avatarMenu}>
                  <div className={styles.avatarMenuHeader}>
                    <div className={styles.avatarMenuPicContainer}>
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user?.full_name || 'Avatar'}
                          className={styles.avatarMenuPic}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className={styles.avatarMenuPicPlaceholder}>
                          {(user?.full_name?.trim()?.charAt(0) || user?.email?.trim()?.charAt(0) || 'U').toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className={styles.avatarMenuUserDetails}>
                      <span className={styles.avatarMenuUserName}>
                        {user?.full_name || 'Usuário DevSongs'}
                      </span>
                      <span className={styles.avatarMenuUserEmail}>
                        {user?.email || ''}
                      </span>
                      {isSuperAdmin && (
                        <span className={styles.avatarMenuAdminBadge}>
                          <ShieldCheck size={12} />
                          Superadmin
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 1. Meu Perfil */}
                  <button
                    onClick={() => {
                      setShowAvatarMenu(false);
                      router.push('/profile');
                    }}
                    className={styles.avatarMenuItem}
                  >
                    <User size={16} />
                    <span>Meu Perfil</span>
                  </button>

                  {/* 2. Painel de Controle (Superadmin apenas) */}
                  {isSuperAdmin && (
                    <button
                      onClick={() => {
                        setShowAvatarMenu(false);
                        router.push('/admin');
                      }}
                      className={styles.avatarMenuItem}
                    >
                      <Shield size={16} />
                      <span>Painel de Controle</span>
                      <span className={styles.avatarMenuBadgePill}>Admin</span>
                    </button>
                  )}

                  <div className={styles.avatarMenuDivider} />

                  {/* 3. Sair da Conta */}
                  <button
                    onClick={() => {
                      setShowAvatarMenu(false);
                      handleLogout();
                    }}
                    className={`${styles.avatarMenuItem} ${styles.avatarMenuItemLogout}`}
                  >
                    <LogOut size={16} />
                    <span>Sair da Conta</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ─── CORPO: SIDEBAR À ESQUERDA + CONTEÚDO PRINCIPAL À DIREITA ─── */}
        <div className={styles.appBody}>
          <aside
            className={`${styles.sidebar} ${!sidebarOpen ? styles.sidebarCollapsed : styles.sidebarOpen} ${
              viewMode === 'artist'
                ? isScrolled
                  ? styles.sidebarArtistScrolled
                  : styles.sidebarArtist
                : isScrolled
                  ? styles.sidebarScrolled
                  : ''
            }`}
          >
            <nav className={styles.navSection}>
              <button
                onClick={() => navigateTo('/home')}
                className={`${styles.navItem} ${viewMode === 'home' && activeTab === 'inicio' ? styles.navItemActive : ''}`}
                title="Início"
              >
                <Home size={22} />
                <span>Início</span>
              </button>
              <button
                onClick={() => navigateTo('/community')}
                className={`${styles.navItem} ${viewMode === 'home' && (activeTab === 'comunidade' || activeTab === 'community') ? styles.navItemActive : ''}`}
                title="Comunidade"
              >
                <Users size={22} />
                <span>Comunidade</span>
              </button>
              <button
                onClick={() => navigateTo('/library')}
                className={`${styles.navItem} ${viewMode === 'home' && activeTab === 'biblioteca' ? styles.navItemActive : ''}`}
                title="Biblioteca"
              >
                <Bookmark size={22} />
                <span>Biblioteca</span>
              </button>
              <button
                onClick={() => navigateTo('/upgrade')}
                className={`${styles.navItem} ${viewMode === 'home' && activeTab === 'upgrade' ? styles.navItemActive : ''}`}
                title="Upgrade"
              >
                <PlayCircle size={22} />
                <span>Upgrade</span>
              </button>
            </nav>

            {sidebarOpen && (
              <div className={styles.sidebarPlaylistsContainer}>
                <div className={styles.sidebarDivider} />

                {/* Botão + Nova Playlist */}
                <button
                  type="button"
                  className={styles.newPlaylistBtn}
                  onClick={handleSidebarNewPlaylist}
                  title="Criar nova playlist"
                >
                  <Plus size={18} />
                  <span>Nova playlist</span>
                </button>

                {/* Lista de Playlists com rolagem independente */}
                <div className={styles.sidebarPlaylistScroll}>
                  {sidebarPlaylists && sidebarPlaylists.length > 0 ? (
                    sidebarPlaylists.map((pl) => {
                      const isSelected = String(selectedSidebarPlaylistId) === String(pl.id) || String(router.query.playlist) === String(pl.id);
                      const isThisPlaying = playingPlaylistId === pl.id && isPlaying;
                      return (
                        <div
                          key={pl.id}
                          className={`${styles.sidebarPlaylistItem} ${isSelected ? styles.sidebarPlaylistItemActive : ''}`}
                          onClick={() => handleOpenSidebarPlaylist(pl)}
                          title={`${pl.name} (${pl.track_count || pl.tracks?.length || 0} músicas)`}
                        >
                          <div className={styles.sidebarPlaylistItemIcon}>
                            <ListMusic size={15} />
                          </div>
                          <span className={styles.sidebarPlaylistItemName}>{pl.name}</span>
                          <button
                            type="button"
                            className={styles.sidebarPlaylistPlayBtn}
                            title={isThisPlaying ? `Pausar ${pl.name}` : `Reproduzir ${pl.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isThisPlaying) {
                                togglePlayPause();
                              } else {
                                handlePlaySidebarPlaylist(pl);
                              }
                            }}
                          >
                            {isThisPlaying ? (
                              <Pause size={12} fill="#ffffff" color="#ffffff" />
                            ) : (
                              <Play size={12} fill="#ffffff" color="#ffffff" style={{ marginLeft: 1 }} />
                            )}
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className={styles.sidebarPlaylistsEmpty}>
                      <span>Crie sua primeira playlist para ouvi-la aqui</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>

          {/* ─── MAIN CONTENT (Page background #090909) ──────────────── */}
          <main
            ref={mainContentRef}
            className={`${styles.mainContent} ${
              viewMode === 'artist' ? styles.mainContentArtist : ''
            }`}
            onScroll={(e) => {
              const scrolled = e.currentTarget.scrollTop > 50;
              if (scrolled !== isScrolled) setIsScrolled(scrolled);
            }}
          >

          {/* ══════════════════════════════════════════════════════════
              CONDITIONAL VIEW: TELA DE INÍCIO | ÁLBUM DEDICADO | SEARCH RESULTS | ARTIST PROFILE
              ══════════════════════════════════════════════════════════ */}
          {viewMode === 'home' ? (
            activeTab === 'biblioteca' ? (
              /* ─── VISÃO DE BIBLIOTECA (Largura total, sem margens excessivas) ─── */
              <div className={styles.libraryViewWrapper}>
                {/* Toast de Notificação de Compra / Aluguel Multi-Base */}
                {purchaseNotice && (
                  <div className={`${styles.purchaseToast} ${purchaseNotice.type === 'error' ? styles.purchaseToastError : ''}`}>
                    <CheckCircle2 size={18} />
                    <span>{purchaseNotice.text}</span>
                    <button onClick={() => setPurchaseNotice(null)} className={styles.toastCloseBtn}>
                      <X size={14} />
                    </button>
                  </div>
                )}

                <LibraryView
                  token={typeof window !== 'undefined' ? localStorage.getItem('token') : null}
                  user={user}
                  refreshKey={libraryRefreshKey}
                  onPlayTrack={handlePlayLibraryTrack}
                  onPlayQueue={handlePlayLibraryQueue}
                  onAddToQueue={addToQueue}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  initialPlaylistId={router.query.playlist || null}
                  selectedPlaylistIdFromParent={selectedSidebarPlaylistId}
                  triggerCreatePlaylist={triggerCreatePlaylist}
                  onSelectedPlaylistChange={(id) => {
                    setSelectedSidebarPlaylistId(id);
                    if (!id && router.query.playlist) {
                      const { playlist, ...restQuery } = router.query;
                      router.replace({ pathname: '/home', query: restQuery }, undefined, { shallow: true });
                    }
                  }}
                  onPlaylistsUpdated={fetchSidebarPlaylists}
                  onExploreCatalog={() => {
                    navigateTo('/explore');
                  }}
                  onSelectAlbum={(album) => {
                    navigateTo(`/album/${album.id || album.albumId || slugify(album.title)}`, {
                      album,
                      returnState: {
                        viewMode: 'home',
                        activeTab: 'biblioteca',
                        selectedSidebarPlaylistId
                      }
                    });
                  }}
                  onOpenArtistProfile={(artistName, artistId) => {
                    navigateTo(`/artist/${slugify(artistName || artistId)}`, {
                      artistName,
                      artistId,
                      returnState: {
                        viewMode: 'home',
                        activeTab: 'biblioteca',
                        selectedSidebarPlaylistId
                      }
                    });
                  }}
                />
              </div>
            ) : activeTab === 'upgrade' ? (
              /* ─── TELA DEDICADA DE UPGRADE & PLANOS (/upgrade) ─── */
              <div className={styles.upgradeViewWrapper}>
                <div className={styles.upgradeHero}>
                  <div className={styles.upgradeBadge}>
                    <Sparkles size={14} /> DevSongs Premium
                  </div>
                  <h1 className={styles.upgradeTitle}>Eleve sua experiência musical ao nível profissional</h1>
                  <p className={styles.upgradeSubtitle}>
                    Música sem interrupções, áudio Hi-Fi de estúdio e aluguéis ilimitados de acervos das gravadoras parceiras.
                  </p>
                </div>

                <div className={styles.upgradePlansGrid}>
                  {/* Plano Free */}
                  <div className={styles.upgradePlanCard}>
                    <div className={styles.upgradePlanName}>DevSongs Free</div>
                    <div className={styles.upgradePlanDesc}>Ideal para quem quer ouvir músicas enquanto programa com recursos básicos.</div>
                    <div className={styles.upgradePriceRow}>
                      <span className={styles.upgradePriceValue}>R$ 0</span>
                      <span className={styles.upgradePricePeriod}>/ mês</span>
                    </div>
                    <ul className={styles.upgradeFeatureList}>
                      <li className={styles.upgradeFeatureItem}>
                        <Check size={16} className={styles.upgradeFeatureIcon} />
                        <span>Streaming padrão a 128 kbps</span>
                      </li>
                      <li className={styles.upgradeFeatureItem}>
                        <Check size={16} className={styles.upgradeFeatureIcon} />
                        <span>Acesso ao catálogo de músicas DevSongs</span>
                      </li>
                      <li className={styles.upgradeFeatureItem}>
                        <Check size={16} className={styles.upgradeFeatureIcon} />
                        <span>Criação de até 5 playlists pessoais</span>
                      </li>
                      <li className={styles.upgradeFeatureItem}>
                        <Check size={16} className={styles.upgradeFeatureIcon} />
                        <span>Anúncios ocasionais entre faixas</span>
                      </li>
                    </ul>
                    <button type="button" className={`${styles.upgradePlanBtn} ${styles.upgradePlanBtnCurrent}`} disabled>
                      Plano Atual
                    </button>
                  </div>

                  {/* Plano Pro (Mais Popular) */}
                  <div className={`${styles.upgradePlanCard} ${styles.upgradePlanCardPopular}`}>
                    <div className={styles.upgradePopularTag}>Mais Escolhido</div>
                    <div className={styles.upgradePlanName}>DevSongs Pro</div>
                    <div className={styles.upgradePlanDesc}>Para desenvolvedores que buscam foco absoluto, qualidade máxima e liberdade total.</div>
                    <div className={styles.upgradePriceRow}>
                      <span className={styles.upgradePriceValue}>R$ 19,90</span>
                      <span className={styles.upgradePricePeriod}>/ mês</span>
                    </div>
                    <ul className={styles.upgradeFeatureList}>
                      <li className={styles.upgradeFeatureItem}>
                        <Check size={16} className={styles.upgradeFeatureIcon} />
                        <span>Áudio Hi-Fi Lossless (320 kbps e FLAC de estúdio)</span>
                      </li>
                      <li className={styles.upgradeFeatureItem}>
                        <Check size={16} className={styles.upgradeFeatureIcon} />
                        <span>Zero anúncios e reprodução contínua sem pausas</span>
                      </li>
                      <li className={styles.upgradeFeatureItem}>
                        <Check size={16} className={styles.upgradeFeatureIcon} />
                        <span>Aluguel ilimitado de faixas de todas as bases musicais</span>
                      </li>
                      <li className={styles.upgradeFeatureItem}>
                        <Check size={16} className={styles.upgradeFeatureIcon} />
                        <span>Modo Offline (download de faixas para o cache local)</span>
                      </li>
                      <li className={styles.upgradeFeatureItem}>
                        <Check size={16} className={styles.upgradeFeatureIcon} />
                        <span>Acesso antecipado a discografias e faixas exclusivas</span>
                      </li>
                    </ul>
                    <button
                      type="button"
                      className={`${styles.upgradePlanBtn} ${styles.upgradePlanBtnPrimary}`}
                      onClick={() => {
                        setPurchaseNotice({ type: 'success', text: 'Parabéns! Seu teste de 30 dias do DevSongs Pro foi ativado com sucesso.' });
                        setTimeout(() => setPurchaseNotice(null), 4000);
                      }}
                    >
                      Começar Teste de 30 Dias Grátis
                    </button>
                  </div>

                  {/* Plano Enterprise */}
                  <div className={styles.upgradePlanCard}>
                    <div className={styles.upgradePlanName}>DevSongs Studio</div>
                    <div className={styles.upgradePlanDesc}>Para gravadoras, selos independentes e estúdios que precisam de gestão e royalties.</div>
                    <div className={styles.upgradePriceRow}>
                      <span className={styles.upgradePriceValue}>R$ 49,90</span>
                      <span className={styles.upgradePricePeriod}>/ mês</span>
                    </div>
                    <ul className={styles.upgradeFeatureList}>
                      <li className={styles.upgradeFeatureItem}>
                        <Check size={16} className={styles.upgradeFeatureIcon} />
                        <span>Todos os benefícios do plano DevSongs Pro</span>
                      </li>
                      <li className={styles.upgradeFeatureItem}>
                        <Check size={16} className={styles.upgradeFeatureIcon} />
                        <span>Painel de Analytics e métricas de audiência em tempo real</span>
                      </li>
                      <li className={styles.upgradeFeatureItem}>
                        <Check size={16} className={styles.upgradeFeatureIcon} />
                        <span>Upload e publicação ilimitada de produções autorais</span>
                      </li>
                      <li className={styles.upgradeFeatureItem}>
                        <Check size={16} className={styles.upgradeFeatureIcon} />
                        <span>Licenciamento comercial para games, vídeos e apps</span>
                      </li>
                      <li className={styles.upgradeFeatureItem}>
                        <Check size={16} className={styles.upgradeFeatureIcon} />
                        <span>Suporte técnico prioritário 24/7 com engenheiro dedicado</span>
                      </li>
                    </ul>
                    <button
                      type="button"
                      className={`${styles.upgradePlanBtn} ${styles.upgradePlanBtnOutline}`}
                      onClick={() => {
                        setPurchaseNotice({ type: 'success', text: 'Solicitação enviada! Nossa equipe entrará em contato em breve.' });
                        setTimeout(() => setPurchaseNotice(null), 4000);
                      }}
                    >
                      Contratar Studio
                    </button>
                  </div>
                </div>

                {/* Destaques / Vantagens */}
                <div className={styles.upgradeHighlightsGrid}>
                  <div className={styles.upgradeHighlightCard}>
                    <div className={styles.upgradeHighlightIcon}>
                      <Headphones size={26} />
                    </div>
                    <h3 className={styles.upgradeHighlightTitle}>Áudio de Estúdio</h3>
                    <p className={styles.upgradeHighlightDesc}>Fidelidade sonora cristalina em FLAC e 320 kbps calibrada para fones de alta performance.</p>
                  </div>
                  <div className={styles.upgradeHighlightCard}>
                    <div className={styles.upgradeHighlightIcon}>
                      <ShieldCheck size={26} />
                    </div>
                    <h3 className={styles.upgradeHighlightTitle}>Sem Fidelidade</h3>
                    <p className={styles.upgradeHighlightDesc}>Cancele quando quiser com um clique no seu painel de usuário sem taxas extras.</p>
                  </div>
                  <div className={styles.upgradeHighlightCard}>
                    <div className={styles.upgradeHighlightIcon}>
                      <Compass size={26} />
                    </div>
                    <h3 className={styles.upgradeHighlightTitle}>Multi-Bases Integradas</h3>
                    <p className={styles.upgradeHighlightDesc}>Acesso unificado aos acervos de streaming, compras e aluguéis de todas as gravadoras.</p>
                  </div>
                  <div className={styles.upgradeHighlightCard}>
                    <div className={styles.upgradeHighlightIcon}>
                      <Zap size={26} />
                    </div>
                    <h3 className={styles.upgradeHighlightTitle}>Desenvolvido para Devs</h3>
                    <p className={styles.upgradeHighlightDesc}>Playlists de foco, Lo-Fi de codificação e atalhos rápidos integrados ao seu fluxo de trabalho.</p>
                  </div>
                </div>
              </div>
            ) : (activeTab === 'comunidade' || activeTab === 'community') ? (
              /* ─── TELA DEDICADA DA COMUNIDADE (/community) ─── */
              <CommunityView
                user={user}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onPlayTrack={(track) => playTrack(track, false)}
                onOpenArtist={(artistName) => navigateTo(`/artist/${slugify(artistName)}`, { artistName })}
                onOpenAlbum={(album) => {
                  setSelectedAlbum(album);
                  setViewMode('album');
                }}
              />
            ) : activeTab === 'explorar' ? (
              /* ─── TELA DEDICADA DE EXPLORAR (/explore) ─── */
              <div className={styles.exploreViewWrapper}>
                <div className={styles.exploreHeader}>
                  <h1 className={styles.exploreTitle}>Explorar</h1>
                  <p className={styles.exploreSubtitle}>Descubra novos lançamentos, explore por gênero musical ou acesse acervos de gravadoras parceiras.</p>
                </div>

                {/* Categorias Rápidas */}
                <div className={styles.exploreCategoriesRow}>
                  <button
                    type="button"
                    className={`${styles.exploreCategoryBtn} ${exploreFilter === 'all' ? styles.exploreCategoryBtnActive : ''}`}
                    onClick={() => setExploreFilter('all')}
                  >
                    <Sparkles size={16} /> Todos os Destaques
                  </button>
                  <button
                    type="button"
                    className={`${styles.exploreCategoryBtn} ${exploreFilter === 'releases' ? styles.exploreCategoryBtnActive : ''}`}
                    onClick={() => setExploreFilter('releases')}
                  >
                    <Disc size={16} /> Lançamentos
                  </button>
                  <button
                    type="button"
                    className={`${styles.exploreCategoryBtn} ${exploreFilter === 'genres' ? styles.exploreCategoryBtnActive : ''}`}
                    onClick={() => setExploreFilter('genres')}
                  >
                    <Radio size={16} /> Gêneros & Moods
                  </button>
                  <button
                    type="button"
                    className={`${styles.exploreCategoryBtn} ${exploreFilter === 'artists' ? styles.exploreCategoryBtnActive : ''}`}
                    onClick={() => setExploreFilter('artists')}
                  >
                    <Users size={16} /> Top Artistas
                  </button>
                </div>

                {/* Gêneros em Destaque */}
                {(exploreFilter === 'all' || exploreFilter === 'genres') && (
                  <section style={{ marginBottom: '3rem' }}>
                    <div className={styles.exploreSectionHeader}>
                      <h2 className={styles.exploreSectionTitle}>Gêneros Musicais & Humores</h2>
                    </div>
                    <div className={styles.exploreGenresGrid}>
                      {[
                        { name: 'Trap & Rap', tag: 'Urbano', bg: 'linear-gradient(135deg, #1e3a8a, #3b82f6)' },
                        { name: 'Hip-Hop', tag: 'Clássico & Atual', bg: 'linear-gradient(135deg, #701a75, #ec4899)' },
                        { name: 'Funk Brasil', tag: 'Ritmo & Pista', bg: 'linear-gradient(135deg, #831843, #f43f5e)' },
                        { name: 'R&B / Soul', tag: 'Vibe & Groove', bg: 'linear-gradient(135deg, #4c1d95, #8b5cf6)' },
                        { name: 'Lo-Fi Dev', tag: 'Foco & Código', bg: 'linear-gradient(135deg, #064e3b, #10b981)' },
                        { name: 'Pop Hits', tag: 'Em Alta', bg: 'linear-gradient(135deg, #b45309, #f59e0b)' },
                        { name: 'Rock & Indie', tag: 'Guitarras & Energia', bg: 'linear-gradient(135deg, #991b1b, #ef4444)' },
                        { name: 'Eletrônica', tag: 'Bass & Sintetizadores', bg: 'linear-gradient(135deg, #155e75, #06b6d4)' }
                      ].map((genre, idx) => (
                        <div
                          key={idx}
                          className={styles.exploreGenreCard}
                          style={{ background: genre.bg }}
                          onClick={() => handleSearchSubmit(genre.name)}
                        >
                          <span className={styles.exploreGenreTag}>{genre.tag}</span>
                          <span className={styles.exploreGenreName}>{genre.name}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Artistas em Destaque */}
                {(exploreFilter === 'all' || exploreFilter === 'artists') && (
                  <section style={{ marginBottom: '3rem' }}>
                    <div className={styles.exploreSectionHeader}>
                      <h2 className={styles.exploreSectionTitle}>Artistas em Destaque</h2>
                    </div>
                    <div className={styles.exploreArtistsGrid}>
                      {[
                        { name: '50 Cent', genre: 'Hip-Hop / Rap', avatar: 'https://cdn-images.dzcdn.net/images/artist/8c1df88318aa16cfa2b9ba835df38992/500x500-000000-80-0-0.jpg', id: 'dz-artist-66' },
                        { name: 'BK', genre: 'Rap Nacional', avatar: 'https://cdn-images.dzcdn.net/images/artist/7481fc25e9bf8f0d8c416ecb9104927d/1000x1000-000000-80-0-0.jpg', id: 1 },
                        { name: 'Veigh', genre: 'Trap', avatar: 'https://cdn-images.dzcdn.net/images/artist/f1542f2eb6e99b45dbf6824967396c21/500x500-000000-80-0-0.jpg', id: 2 },
                        { name: 'Matuê', genre: 'Trap', avatar: 'https://cdn-images.dzcdn.net/images/artist/f8d839bb09bbcd3460655ad1e31adfc8/500x500-000000-80-0-0.jpg', id: 14 },
                        { name: 'Justin Bieber', genre: 'Pop', avatar: 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025319/bookhub/img/justin_my_world.jpg', id: 7 },
                        { name: 'Djonga', genre: 'Rap', avatar: 'https://cdn-images.dzcdn.net/images/artist/230f60ce9d8d697843ba9a8a32bb5826/500x500-000000-80-0-0.jpg', id: 9 },
                        { name: 'Eminem', genre: 'Hip-Hop', avatar: 'https://cdn-images.dzcdn.net/images/artist/1805da7227bf611e9a444a7f50d0325b/500x500-000000-80-0-0.jpg', id: 32 }
                      ].map((art, idx) => (
                        <div
                          key={idx}
                          className={styles.exploreArtistCard}
                          onClick={() => navigateTo(`/artist/${slugify(art.name)}`, { artistName: art.name, artistId: art.id })}
                        >
                          <img src={art.avatar} alt={art.name} className={styles.exploreArtistAvatar} />
                          <span className={styles.exploreArtistName}>{art.name}</span>
                          <span className={styles.exploreArtistGenre}>{art.genre}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Lançamentos em Alta */}
                {(exploreFilter === 'all' || exploreFilter === 'releases') && (
                  <section>
                    <div className={styles.exploreSectionHeader}>
                      <h2 className={styles.exploreSectionTitle}>Lançamentos & Faixas Mais Tocadas</h2>
                    </div>
                    <div className={styles.tracksGrid}>
                      {(escolhaADedo || []).slice(0, 12).map((track, idx) => (
                        <div
                          key={track.id || idx}
                          className={styles.trackCard}
                          onClick={() => playTrack(track, false)}
                        >
                          <div className={styles.trackCardCoverWrap}>
                            <img
                              src={track.cover || track.cover_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                              alt={track.title}
                              className={styles.trackCardCover}
                              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
                            />
                            <button
                              type="button"
                              className={styles.trackCardPlayBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                playTrack(track, false);
                              }}
                            >
                              <Play size={18} fill="#ffffff" color="#ffffff" />
                            </button>
                          </div>
                          <div className={styles.trackCardDetails}>
                            <span className={styles.trackCardTitle}>{track.title}</span>
                            <span
                              className={styles.trackCardArtist}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateTo(`/artist/${slugify(track.artist)}`, { artistName: track.artist });
                              }}
                            >
                              {track.artist}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            ) : (
              /* ─── TELA DE INÍCIO YOUTUBE MUSIC (Foto 1 do Usuário) ─── */
              <div className={styles.homeViewContainer}>

                {/* Toast de Notificação de Compra / Aluguel Multi-Base */}
                {purchaseNotice && (
                  <div className={`${styles.purchaseToast} ${purchaseNotice.type === 'error' ? styles.purchaseToastError : ''}`}>
                    <CheckCircle2 size={18} />
                    <span>{purchaseNotice.text}</span>
                    <button onClick={() => setPurchaseNotice(null)} className={styles.toastCloseBtn}>
                      <X size={14} />
                    </button>
                  </div>
                )}

                {(selectedCompany || baseMode !== 'home') ? (
                /* 2. VISÃO DE BASE ESPECÍFICA OU MODALIDADE (Todas as Bases / Streaming / Compras / Aluguéis) */
                <section className={styles.companyHeroSection}>
                  <div className={styles.companyHeroCard}>
                    {selectedCompany ? (
                      <img
                        src={selectedCompany.logo_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                        alt={selectedCompany.name}
                        className={styles.companyHeroLogo}
                        onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
                      />
                    ) : (
                      <div className={styles.baseItemIconGlobal} style={{ width: 80, height: 80, fontSize: '2.5rem' }}>
                        {baseMode === 'all' ? '🌐' : baseMode === 'streaming' ? '▶️' : baseMode === 'buy' ? '🛒' : '⏱️'}
                      </div>
                    )}
                    <div className={styles.companyHeroContent}>
                      <div className={styles.companyBadgeRow}>
                        <span className={styles.companyBadgeTag}>Base Ativa</span>
                        <span className={styles.companyGenreTag}>
                          {selectedCompany
                            ? selectedCompany.genre
                            : baseMode === 'all'
                            ? 'Todas as Gravadoras Integradas'
                            : baseMode === 'streaming'
                            ? 'Streaming Comercial'
                            : baseMode === 'buy'
                            ? 'Aquisição Permanente de Licenças'
                            : 'Locação Temporária (30 dias)'}
                        </span>
                        {selectedCompany && (
                          <span className={styles.companyCityTag}>{selectedCompany.city} - {selectedCompany.state}</span>
                        )}
                      </div>
                      <h1 className={styles.companyHeroTitle}>
                        {selectedCompany
                          ? selectedCompany.name
                          : baseMode === 'all'
                          ? 'Todas as Bases Musicais'
                          : baseMode === 'streaming'
                          ? 'Base Streaming Comercial'
                          : baseMode === 'buy'
                          ? 'Base de Compras de Licenças'
                          : 'Base de Aluguéis de Licenças'}
                      </h1>
                      <p className={styles.companyHeroDesc}>
                        {selectedCompany
                          ? selectedCompany.description
                          : baseMode === 'all'
                          ? 'Catálogo unificado com acervos comerciais de todas as gravadoras e selos parceiros da DevSongs.'
                          : baseMode === 'streaming'
                          ? 'Catálogo com faixas comerciais autorizadas para reprodução contínua.'
                          : baseMode === 'buy'
                          ? 'Acervo exclusivo disponível para aquisição permanente de licenças com baixa em tempo real de estoque.'
                          : 'Músicas e álbuns disponíveis para acesso temporário por 30 dias com controle inteligente de vigência.'}
                      </p>
                      <div className={styles.companyStatsRow}>
                        <span>Músicas no acervo: <strong>{companyTracks.length} faixas</strong></span>
                        {selectedCompany ? (
                          <>
                            <span>•</span>
                            <span>Estoque total: <strong>{selectedCompany.total_stock || 0} unidades</strong></span>
                          </>
                        ) : (
                          <>
                            <span>•</span>
                            <span>Gravadoras parceiras: <strong>{companies.length} bases ativas</strong></span>
                          </>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {selectedCompany && (
                        <button
                          type="button"
                          className={styles.btnVoltarGlobal}
                          onClick={() => handleSelectBaseMode('all')}
                          title="Ver todas as gravadoras e bases"
                          style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                        >
                          🌐 Ver Todas as Bases
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.btnVoltarGlobal}
                        onClick={() => handleSelectBaseMode('home')}
                        title="Voltar para início streaming livre"
                      >
                        Voltar ao Início
                      </button>
                    </div>
                  </div>

                  {/* Lista de músicas com Estoque e Preços dessa Base */}
                  <div className={styles.companyTracksSection}>
                    <div className={styles.homeSectionHeader}>
                      <div>
                        <h2 className={styles.homeSectionTitle}>
                          {selectedCompany
                            ? `Acervo da ${selectedCompany.name}`
                            : baseMode === 'all'
                            ? 'Catálogo Completo Multibase'
                            : baseMode === 'streaming'
                            ? 'Músicas Autorizadas para Streaming'
                            : baseMode === 'buy'
                            ? 'Músicas Disponíveis para Compra'
                            : 'Músicas Disponíveis para Aluguel'}
                        </h2>
                        <span className={styles.recentSectionSub}>
                          {selectedCompany
                            ? `Exclusivo da ${selectedCompany.name} • Compre ou alugue com baixa direta de estoque`
                            : baseMode === 'all'
                            ? 'Músicas comerciais organizadas por gravadora com estoque e licenças em tempo real'
                            : baseMode === 'streaming'
                            ? 'Ouça com alta fidelidade sem restrições'
                            : baseMode === 'buy'
                            ? 'Garanta sua cópia com acesso permanente em sua biblioteca'
                            : 'Alugue por 30 dias com preço acessível'}
                        </span>
                      </div>
                    </div>

                    {isCompanyLoading ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#a7a7a7' }}>Carregando catálogo da base...</div>
                    ) : companyTracks.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#a7a7a7' }}>Nenhuma música disponível nesta modalidade no momento.</div>
                    ) : (
                      <div className={styles.companyTracksGrid}>
                        {companyTracks.map((track) => {
                          const isCurrent = currentTrack?.id === track.id || currentTrack?.title === track.title;
                          const isOwned = track.isPurchased || userPurchases.some(p => (p.dbTrackId === track.dbTrackId || p.id === track.id) && p.type === 'buy');
                          const isRentedActive = track.isRented || userPurchases.some(p => (p.dbTrackId === track.dbTrackId || p.id === track.id) && !p.isExpired && p.type === 'rent');
                          const isUnlocked = isOwned || isRentedActive;

                          return (
                            <div
                              key={track.id}
                              className={`${styles.companyTrackCard} ${isCurrent ? styles.companyTrackCardActive : ''}`}
                            >
                              <div
                                className={styles.companyTrackCoverWrap}
                                onClick={() => {
                                  if (isUnlocked) {
                                    playTrack(track);
                                  } else {
                                    addToCart(track, 'buy');
                                  }
                                }}
                              >
                                <img
                                  src={track.cover || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                                  alt={track.title}
                                  className={styles.companyTrackCover}
                                  onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
                                />
                                {!isUnlocked && (
                                  <div className={styles.lockOverlay} title="Faixa Bloqueada • Requer Compra ou Aluguel">
                                    <Lock size={14} />
                                  </div>
                                )}
                                <div className={styles.companyTrackPlayOverlay}>
                                  {isUnlocked ? (
                                    isCurrent && isPlaying ? (
                                      <Pause size={22} fill="#ffffff" color="#ffffff" />
                                    ) : (
                                      <Play size={22} fill="#ffffff" color="#ffffff" style={{ marginLeft: 2 }} />
                                    )
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#ffffff', fontSize: '0.74rem', fontWeight: 700 }}>
                                      <Lock size={20} />
                                      <span>Liberar Acesso</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className={styles.companyTrackInfo}>
                                <span className={styles.companyTrackTitle} title={track.title}>{track.title}</span>
                                <span className={styles.companyTrackArtist}>{track.artist}</span>
                                <span className={styles.companyTrackAlbum}>{track.album}</span>

                                <div className={styles.companyStockBadgeRow} style={{ flexWrap: 'wrap' }}>
                                  <span className={styles.companyLabelBadge} title={`Gravadora: ${track.companyName}`}>
                                    🏢 {track.companyName}
                                  </span>
                                  <span className={`${styles.stockBadge} ${track.stockQuantity <= 10 ? styles.stockBadgeLow : ''}`}>
                                    Estoque: {track.stockQuantity} un
                                  </span>
                                  {track.genre && (
                                    <span className={styles.exclusiveBadge} style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', borderColor: 'rgba(234, 179, 8, 0.3)' }}>
                                      {track.genre}
                                    </span>
                                  )}
                                  {track.isExclusive && <span className={styles.exclusiveBadge}>Exclusivo</span>}
                                  {isOwned ? (
                                    <span className={styles.purchasedBadge}>Comprado (Liberada)</span>
                                  ) : isRentedActive ? (
                                    <span className={styles.rentedBadge}>Alugada (Liberada)</span>
                                  ) : (
                                    <span className={styles.lockedBadge}>
                                      <Lock size={11} /> Bloqueada
                                    </span>
                                  )}
                                </div>

                                <div className={styles.companyTrackActionsRow}>
                                  {isUnlocked ? (
                                    <>
                                      <button
                                        type="button"
                                        className={styles.btnBuyTrack}
                                        onClick={() => playTrack(track)}
                                        title="Reproduzir esta faixa agora"
                                      >
                                        Ouvir Agora ▶
                                      </button>
                                      <button
                                        type="button"
                                        className={styles.btnRentTrack}
                                        onClick={() => setActiveTab('biblioteca')}
                                        title="Ver na Biblioteca"
                                      >
                                        Na Biblioteca 📚
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        className={styles.btnBuyTrack}
                                        disabled={!track.availableForSale}
                                        onClick={() => addToCart(track, 'buy')}
                                        title={`Adicionar compra ao carrinho por ${track.priceSale}`}
                                      >
                                        Comprar {track.priceSale}
                                      </button>
                                      <button
                                        type="button"
                                        className={styles.btnRentTrack}
                                        disabled={!track.availableForRent}
                                        onClick={() => addToCart(track, 'rent')}
                                        title={`Adicionar aluguel ao carrinho por ${track.priceRent}`}
                                      >
                                        Alugar {track.priceRent}
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>
              ) : (
                <>

                  {/* ─── CONTINUAR OUVINDO (6 Músicas Recentes e Histórico Completo) ─── */}
                  {(() => {
                    const rawList = (recentHistory && recentHistory.length > 0)
                      ? recentHistory
                      : (lastTrack ? [lastTrack] : []);

                    if (rawList.length === 0) return null;

                    // Na grade de atalhos da Home, exibe faixas únicas recentes (Estilo Spotify: atalhos distintos)
                    const seen = new Set();
                    const uniqueTracks = [];
                    for (const t of rawList) {
                      const titleKey = `${(t.title || '').trim().toLowerCase()}__${(t.artist || '').trim().toLowerCase()}`;
                      const idKey = t.dbTrackId ? `ct_${t.dbTrackId}` : (t.id ? String(t.id) : null);
                      const key = idKey || titleKey;
                      if (!seen.has(key) && !seen.has(titleKey)) {
                        seen.add(key);
                        seen.add(titleKey);
                        uniqueTracks.push(t);
                      }
                    }

                    if (uniqueTracks.length === 0) return null;

                    const visibleTracks = uniqueTracks.slice(0, 6);

                    return (
                      <section className={styles.spotifyRecentSection}>
                        <div className={styles.recentSectionHeader}>
                          <div>
                            <h2 className={styles.homeSectionTitle}>Continuar ouvindo</h2>
                            <span className={styles.recentSectionSub}>Suas reproduções recentes</span>
                          </div>

                          <div className={styles.recentHeaderActions}>
                            <button
                              type="button"
                              className={styles.btnRecentFullHistory}
                              onClick={() => {
                                setHistoryVisibleCount(15);
                                setHistorySearchTerm('');
                                setShowFullHistoryModal(true);
                              }}
                              title="Visualizar histórico completo de reprodução"
                            >
                              <Clock size={14} />
                              <span>Ver histórico completo</span>
                            </button>
                          </div>
                        </div>

                        <div className={styles.spotifyRecentGrid}>
                          {visibleTracks.map((track, idx) => {
                            const isCurrent = (currentTrack?.id && track.id && String(currentTrack.id) === String(track.id)) ||
                                              (currentTrack?.title && track.title && currentTrack.title.trim().toLowerCase() === track.title.trim().toLowerCase());
                            return (
                              <div
                                key={track.id || `${track.title}-${idx}`}
                                className={`${styles.spotifyRecentCard} ${isCurrent ? styles.spotifyRecentCardActive : ''}`}
                                onClick={() => playTrack(track)}
                                title={`Continuar ouvindo ${track.title} - ${track.artist}`}
                              >
                                <div className={styles.spotifyRecentCoverWrap}>
                                  <img
                                    src={getSafeCover(track)}
                                    alt={track.title}
                                    className={styles.spotifyRecentCover}
                                    referrerPolicy="no-referrer"
                                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
                                  />
                                </div>

                                <div className={styles.spotifyRecentInfo}>
                                  <div className={styles.spotifyRecentTitleRow}>
                                    {idx === 0 && <span className={styles.recentBadge}>Última ouvida</span>}
                                    <span className={styles.spotifyRecentTitle}>{track.title}</span>
                                  </div>
                                  <span className={styles.spotifyRecentArtist}>{track.artist}</span>
                                </div>

                                <div className={styles.spotifyRecentPlayCircle}>
                                  {isCurrent && isPlaying ? (
                                    <Pause size={16} fill="#030303" color="#030303" />
                                  ) : (
                                    <Play size={16} fill="#030303" color="#030303" style={{ marginLeft: 2 }} />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })()}

              {/* ─── SEÇÃO 1: ESCOLHA A DEDO (3 colunas x 4 linhas - Foto 1) ─── */}
              <section className={styles.homeSection}>
                <div className={styles.homeSectionHeader}>
                  <h2 className={styles.homeSectionTitle}>Escolha a dedo</h2>
                  <div className={styles.homeHeaderActions}>
                    <button
                      type="button"
                      className={styles.tocarTudoBtn}
                      onClick={() => {
                        const list = (escolhaADedo && escolhaADedo.length > 0) ? escolhaADedo : HOME_ESCOLHA_A_DEDO;
                        setTracks(list);
                        playTrack(list[0], false, list, 'Escolha a dedo');
                      }}
                      title="Tocar todas as faixas de Escolha a dedo"
                    >
                      <span>Tocar tudo</span>
                    </button>
                    <button
                      type="button"
                      className={styles.roundNavBtn}
                      onClick={() => {}}
                      title="Anterior"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      className={styles.roundNavBtn}
                      onClick={() => {}}
                      title="Próximo"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div className={styles.escolhaDedoGrid}>
                  {(escolhaADedo || []).map((item) => {
                    const isCurrent = currentTrack?.title?.toLowerCase() === item.title.toLowerCase();
                    return (
                      <div
                        key={item.id}
                        className={`${styles.escolhaDedoCard} ${isCurrent ? styles.escolhaDedoCardActive : ''}`}
                        onClick={() => {
                          setTracks(prev => {
                            if (!prev.some(t => t.id === item.id)) {
                              return [item, ...prev];
                            }
                            return prev;
                          });
                          const list = (escolhaADedo && escolhaADedo.length > 0) ? escolhaADedo : HOME_ESCOLHA_A_DEDO;
                          playTrack(item, false, list, 'Escolha a dedo');
                        }}
                        title={`Tocar ${item.title} - ${item.artist}`}
                      >
                        <div className={styles.escolhaDedoThumbWrap}>
                          <img
                            src={getSafeCover(item)}
                            alt={item.title}
                            className={styles.escolhaDedoThumb}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png';
                            }}
                          />
                          <div className={styles.escolhaDedoPlayOverlay}>
                            {isCurrent && isPlaying ? (
                              <Pause size={15} fill="#ffffff" color="#ffffff" />
                            ) : (
                              <Play size={15} fill="#ffffff" color="#ffffff" style={{ marginLeft: 2 }} />
                            )}
                          </div>
                        </div>

                        <div className={styles.escolhaDedoInfo}>
                          <span className={styles.escolhaDedoTitle}>
                            {item.title}
                          </span>
                          <span className={styles.escolhaDedoSub}>
                            {item.explicit && <span className={styles.explicitBadge}>E</span>}
                            <span>{item.artist}</span>
                            <span>•</span>
                            <span>{item.plays}</span>
                          </span>
                        </div>

                        <button
                          type="button"
                          className={styles.trackCardMoreBtn}
                          onClick={(e) => openTrackContextMenu(item, e)}
                          title="Mais opções"
                          aria-label="Mais opções"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ─── SEÇÃO 2: ÁLBUNS PARA VOCÊ (Carrossel Horizontal - Foto 1) ─── */}
              <section className={styles.homeSection}>
                <div className={styles.homeSectionHeader}>
                  <h2 className={styles.homeSectionTitle}>Álbuns para você</h2>
                  <div className={styles.homeHeaderActions}>
                    <button
                      type="button"
                      className={styles.roundNavBtn}
                      onClick={() => scrollAlbuns('left')}
                      title="Rolar álbuns para esquerda"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      className={styles.roundNavBtn}
                      onClick={() => scrollAlbuns('right')}
                      title="Rolar álbuns para direita"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div className={styles.albunsCarousel} ref={albunsScrollRef}>
                  {(albunsParaVoce || []).map((album) => (
                    <div
                      key={album.id}
                      className={styles.albumCard}
                      onClick={() => handleSelectAlbum(album)}
                      title={`Abrir álbum ${album.title} - ${album.artist}`}
                    >
                      <div className={styles.albumCardCoverWrap}>
                        <img
                          src={getSafeCover(album)}
                          alt={album.title}
                          className={styles.albumCardCover}
                          referrerPolicy="no-referrer"
                          onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
                        />
                        <button
                          type="button"
                          className={styles.albumCardPlayBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAlbum(album);
                          }}
                          title="Ouvir álbum"
                        >
                          <Play size={20} fill="#ffffff" color="#ffffff" style={{ marginLeft: 2 }} />
                        </button>
                      </div>

                      <span className={styles.albumCardTitle}>{album.title}</span>
                      <span className={styles.albumCardArtist}>Álbum • {album.artist}</span>
                    </div>
                  ))}
                </div>
              </section>
                </>
              )}
            </div>
            )
          ) : viewMode === 'album' && selectedAlbum ? (
            /* ─── TELA DO ÁLBUM ESTILO YOUTUBE MUSIC (Foto do Usuário) ─── */
            <div className={styles.albumViewWrapper}>
              {/* Fundo Dinâmico com Aura / Ambient Glow da capa do Álbum (Estilo YouTube Music & Spotify) */}
              <div className={styles.albumAmbientBackdrop} aria-hidden="true">
                <div
                  className={styles.albumAmbientGlow}
                  style={{ backgroundImage: `url('${selectedAlbum.cover || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}')` }}
                />
                <div className={styles.albumAmbientGradientOverlay} />
              </div>

              <div className={styles.albumViewContainer}>
                {/* Coluna Esquerda: Mini Artista Centralizado no Meio, Cover HD, Título, Estatísticas e Ações */}
                <div className={styles.albumHeroColumn}>
                  <div className={styles.albumTopControls}>
                    <div
                      className={styles.albumArtistRow}
                      onClick={() => {
                        const artName = selectedAlbum.artistName || selectedAlbum.artist || activeArtist?.name;
                        if (artName) openArtistProfile(artName, selectedAlbum.artistId || activeArtist?.id);
                      }}
                      title={`Ver perfil de ${selectedAlbum.artistName || selectedAlbum.artist || activeArtist?.name || 'Artista'}`}
                    >
                      <img
                        src={selectedAlbum.artistAvatar || (selectedAlbum.artistName && activeArtist?.name && selectedAlbum.artistName.toLowerCase() === activeArtist.name.toLowerCase() ? activeArtist.avatarImg : '') || activeArtist?.avatarImg || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                        alt={selectedAlbum.artistName || selectedAlbum.artist || activeArtist?.name || 'Artista'}
                        className={styles.albumArtistMiniAvatar}
                        referrerPolicy="no-referrer"
                        onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
                      />
                      <span>{selectedAlbum.artistName || selectedAlbum.artist || activeArtist?.name || 'Artista'}</span>
                    </div>
                  </div>

                  <div className={styles.albumHeroCoverWrap}>
                    <img
                      src={selectedAlbum.cover || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                      alt={selectedAlbum.title}
                      className={styles.albumHeroCover}
                      referrerPolicy="no-referrer"
                      onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
                    />
                  </div>

                  <h1 className={styles.albumHeroTitle}>{selectedAlbum.title}</h1>

                  <div className={styles.albumHeroMeta}>
                    {selectedAlbum.explicit && <span className={styles.explicitTagSmall}>E</span>}
                    <span>Álbum</span>
                    <span className={styles.albumDot}>•</span>
                    <span>{getDisplayAlbumYear(selectedAlbum, selectedAlbum.artistName || selectedAlbum.artist || activeArtist?.name, selectedAlbum.year)}</span>
                  </div>

                  <div className={styles.albumHeroStats}>
                    {isAlbumLoading && (!selectedAlbum.nbTracks || !selectedAlbum.durationSec) ? (
                      <span style={{ color: '#64748b', fontSize: '0.82rem' }}>Carregando faixas...</span>
                    ) : (
                      <span>
                        {(albumTracks.length > 0 ? albumTracks.length : selectedAlbum.nbTracks) || 0} músicas • {formatDurationSummary(selectedAlbum.durationSec || albumTracks.reduce((acc, t) => acc + (t.durationSec || 0), 0))}
                      </span>
                    )}
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
                          playTrack(albumTracks[0], false, albumTracks, selectedAlbum?.title || selectedAlbum?.name || 'Álbum');
                        }
                      }}
                    >
                      <Play size={26} fill="#0f0f0f" color="#0f0f0f" style={{ marginLeft: '3px' }} />
                    </button>

                    <button
                      type="button"
                      className={styles.albumActionCircleBtn}
                      title="Mais opções"
                    >
                      <MoreVertical size={20} />
                    </button>
                  </div>

                  {/* Bloco Comercial de Compra, Aluguel e Desconto Inteligente de Álbuns */}
                  <div className={styles.albumCommerceBox}>
                    {currentAlbumPricing.isOwned ? (
                      <div className={styles.albumPurchasedBadge}>
                        <CheckCircle2 size={18} color="#22c55e" />
                        <span>Álbum Comprado • Acesso Vitalício Liberado</span>
                      </div>
                    ) : (
                      <>
                        <div className={styles.albumCommerceRow}>
                          <button
                            type="button"
                            className={styles.btnBuyAlbum}
                            onClick={() => handleBuyOrRentAlbum(selectedAlbum, 'buy', currentAlbumPricing)}
                          >
                            <ShoppingCart size={17} />
                            <span>Comprar Álbum • R$ {currentAlbumPricing.finalPrice.toFixed(2).replace('.', ',')}</span>
                          </button>
                          <button
                            type="button"
                            className={styles.btnRentAlbum}
                            onClick={() => handleBuyOrRentAlbum(selectedAlbum, 'rent', currentAlbumPricing)}
                            disabled={currentAlbumPricing.isRented && !currentAlbumPricing.isRentExpired}
                          >
                            <Clock size={17} />
                            <span>
                              {currentAlbumPricing.isRented && !currentAlbumPricing.isRentExpired
                                ? `Alugado • ${currentAlbumPricing.remainingDays}d restantes`
                                : 'Alugar Álbum • R$ 9,90 / mês'}
                            </span>
                          </button>
                        </div>

                        {currentAlbumPricing.discount > 0 && (
                          <div className={styles.smartDiscountNotice}>
                            <Sparkles size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>
                              <strong>Desconto Inteligente:</strong> - R$ {currentAlbumPricing.discount.toFixed(2).replace('.', ',')} ({currentAlbumPricing.purchasedTracksCount} {currentAlbumPricing.purchasedTracksCount === 1 ? 'faixa já adquirida' : 'faixas já adquiridas'}). De <s style={{ opacity: 0.7 }}>R$ {currentAlbumPricing.originalPrice.toFixed(2).replace('.', ',')}</s> por <strong>R$ {currentAlbumPricing.finalPrice.toFixed(2).replace('.', ',')}</strong>.
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Coluna Direita: Tracklist Oficial com Números e Duração */}
                <div className={styles.albumTracklistColumn}>
                  <div className={styles.albumTracklistHeader}>
                    <h2>Faixas</h2>
                  </div>

                  {isAlbumLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.75rem' }}>
                      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div
                          key={i}
                          className={styles.skeletonTrackRow}
                          style={{
                            height: '52px',
                            opacity: Math.max(0.35, 1 - i * 0.1)
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    albumTracks.map((track, idx) => {
                      const isCurrent = currentTrack?.id === track.id || currentTrack?.title === track.title;
                      return (
                        <div
                          key={track.id || idx}
                          className={`${styles.albumTrackRow} ${isCurrent ? styles.albumTrackRowActive : ''}`}
                          onClick={() => playTrack(track, false, albumTracks, selectedAlbum?.title || selectedAlbum?.name || 'Álbum')}
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
                              <span>{track.artist || selectedAlbum.artistName || activeArtist?.name}</span>
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

                          <button
                            type="button"
                            className={styles.trackCardMoreBtn}
                            onClick={(e) => openTrackContextMenu(track, e)}
                            title="Mais opções"
                            aria-label="Mais opções"
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Seção Sugestões de Álbuns do Mesmo Tipo / Artista (Carrossel Horizontal) */}
              {relatedAlbums && relatedAlbums.length > 0 && (
                <section className={styles.relatedAlbumsSection}>
                  <div className={styles.relatedAlbumsHeader}>
                    <h2 className={styles.relatedAlbumsHeading}>Outros álbuns que você pode gostar</h2>
                    <div className={styles.homeHeaderActions}>
                      <button
                        type="button"
                        className={styles.roundNavBtn}
                        onClick={() => scrollRelatedAlbums('left')}
                        title="Rolar álbuns para esquerda"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        type="button"
                        className={styles.roundNavBtn}
                        onClick={() => scrollRelatedAlbums('right')}
                        title="Rolar álbuns para direita"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>

                  <div className={styles.relatedAlbumsCarousel} ref={relatedAlbumsScrollRef}>
                    {relatedAlbums.map((alb) => (
                      <div
                        key={alb.id}
                        className={styles.relatedAlbumCard}
                        onClick={() => handleSelectAlbum(alb)}
                        title={`Ouvir ${alb.title} - ${alb.artist}`}
                      >
                        <div className={styles.relatedAlbumCoverWrap}>
                          <img
                            src={alb.cover || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                            alt={alb.title}
                            className={styles.relatedAlbumCover}
                            referrerPolicy="no-referrer"
                            onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
                          />
                          <div className={styles.relatedAlbumPlayHover}>
                            <Play size={20} fill="#ffffff" color="#ffffff" style={{ marginLeft: 2 }} />
                          </div>
                        </div>
                        <span className={styles.relatedAlbumTitle}>{alb.title}</span>
                        <span className={styles.relatedAlbumMeta}>
                          Álbum • {alb.artist} • {getDisplayAlbumYear(alb, alb.artist, alb.year)}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
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

              {isSearching ? (
                <div className={styles.searchLoadingSkeleton}>
                  <div className={styles.skeletonHeroCard} />
                  <div className={styles.skeletonTrackRow} />
                  <div className={styles.skeletonTrackRow} />
                  <div className={styles.skeletonTrackRow} />
                  <div className={styles.skeletonTrackRow} />
                </div>
              ) : tracks.length === 0 && !activeArtist && searchArtists.length === 0 ? (
                <div className={styles.searchEmptyContainer}>
                  <Search size={48} className={styles.searchEmptyIcon} />
                  <h2 className={styles.searchEmptyTitle}>Nenhum resultado encontrado para &quot;{searchQuery}&quot;</h2>
                  <p className={styles.searchEmptySub}>Tente verificar a ortografia ou buscar por outros artistas, músicas ou álbuns.</p>
                </div>
              ) : selectedSearchFilter === 'Artistas' ? (
                <div className={styles.searchArtistsGrid}>
                  {(searchArtists.length > 0 ? searchArtists : (activeArtist ? [activeArtist] : [])).map((art, idx) => (
                    <div
                      key={art.id || idx}
                      className={styles.searchArtistCard}
                      onClick={() => openArtistProfile(art.name, art.id)}
                      title={`Abrir perfil de ${art.name}`}
                    >
                      <img
                        src={art.avatarImg || art.bannerImg || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                        alt={art.name}
                        className={styles.searchArtistCardAvatar}
                        referrerPolicy="no-referrer"
                        onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
                      />
                      <span className={styles.searchArtistCardName}>{art.name}</span>
                      <span className={styles.searchArtistCardSub}>Artista • {art.listeners || 'Vários ouvintes'}</span>
                    </div>
                  ))}
                  {tracks.length > 0 && (
                    <div style={{ gridColumn: '1 / -1', marginTop: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', marginBottom: '1rem' }}>Músicas do artista</h3>
                      <div className={styles.searchResultsList} style={{ padding: 0 }}>
                        {tracks.slice(0, 10).map((track) => {
                          const isCurrent = currentTrack?.id === track.id;
                          return (
                            <div
                              key={track.id}
                              className={`${styles.resultTrackItem} ${isCurrent ? styles.resultTrackItemActive : ''}`}
                              onClick={() => playTrack(track)}
                            >
                              <div className={styles.resultTrackThumbWrap}>
                                <img
                                  src={track.cover || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                                  alt={track.title}
                                  className={styles.resultTrackThumb}
                                  referrerPolicy="no-referrer"
                                  onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                                  <span className={`${styles.resultTrackTitle} ${isCurrent ? styles.resultTrackTitleActive : ''}`}>
                                    {track.title}
                                  </span>
                                  {(track.isPurchased || track.badge === 'Comprada' || isTrackOwned(track)) ? (
                                    <span className={styles.purchasedBadge} style={{ flexShrink: 0, padding: '1px 5px', fontSize: '0.68rem', lineHeight: '1.2' }}>
                                      Comprada
                                    </span>
                                  ) : ((track.isRented || track.badge === 'Alugada' || isTrackRentedActive(track)) && !track.isExpired) ? (
                                    <span className={styles.rentedBadge} style={{ flexShrink: 0, padding: '1px 5px', fontSize: '0.68rem', lineHeight: '1.2' }}>
                                      Alugada
                                    </span>
                                  ) : null}
                                </div>
                                <span className={styles.resultTrackMeta}>
                                  Música • {track.artist} • {track.plays}
                                </span>
                              </div>

                              <button
                                type="button"
                                className={styles.trackCardMoreBtn}
                                onClick={(e) => openTrackContextMenu(track, e)}
                                title="Mais opções"
                                aria-label="Mais opções"
                              >
                                <MoreVertical size={16} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : selectedSearchFilter === 'Músicas' ? (
                <div className={styles.searchResultsList} style={{ paddingTop: '1.5rem' }}>
                  {tracks.map((track) => {
                    const isCurrent = currentTrack?.id === track.id;
                    return (
                      <div
                        key={track.id}
                        className={`${styles.resultTrackItem} ${isCurrent ? styles.resultTrackItemActive : ''}`}
                        onClick={() => playTrack(track)}
                      >
                        <div className={styles.resultTrackThumbWrap}>
                          <img
                            src={track.cover || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                            alt={track.title}
                            className={styles.resultTrackThumb}
                            referrerPolicy="no-referrer"
                            onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                            <span className={`${styles.resultTrackTitle} ${isCurrent ? styles.resultTrackTitleActive : ''}`}>
                              {track.title}
                            </span>
                            {(track.isPurchased || track.badge === 'Comprada' || isTrackOwned(track)) ? (
                              <span className={styles.purchasedBadge} style={{ flexShrink: 0, padding: '1px 5px', fontSize: '0.68rem', lineHeight: '1.2' }}>
                                Comprada
                              </span>
                            ) : ((track.isRented || track.badge === 'Alugada' || isTrackRentedActive(track)) && !track.isExpired) ? (
                              <span className={styles.rentedBadge} style={{ flexShrink: 0, padding: '1px 5px', fontSize: '0.68rem', lineHeight: '1.2' }}>
                                Alugada
                              </span>
                            ) : null}
                          </div>
                          <span className={styles.resultTrackMeta}>
                            Música • {track.artist} • {track.plays}
                          </span>
                        </div>

                        <button
                          type="button"
                          className={styles.trackCardMoreBtn}
                          onClick={(e) => openTrackContextMenu(track, e)}
                          title="Mais opções"
                          aria-label="Mais opções"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : selectedSearchFilter === 'Álbuns' ? (
                <div className={styles.sectionAlbumsGrid} style={{ padding: '1.5rem 2.25rem 3.5rem' }}>
                  {searchAlbums.length > 0 ? (
                    searchAlbums.map((album) => (
                      <div
                        key={album.id}
                        className={styles.cardCoverOnly}
                        onClick={() => handleSelectAlbum(album)}
                        title={`Abrir álbum ${album.title}`}
                      >
                        <div className={styles.coverWrapper}>
                          <img
                            src={album.cover || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                            alt={album.title}
                            className={styles.coverImage}
                            referrerPolicy="no-referrer"
                            onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
                          />
                          <div className={styles.playOverlay}>
                            <Play size={20} fill="#ffffff" color="#ffffff" style={{ marginLeft: 2 }} />
                          </div>
                        </div>
                        <span className={styles.cardTitle}>{album.title}</span>
                        <span className={styles.cardSubtitle}>Álbum • {album.artist}</span>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#aaa', padding: '1rem' }}>Nenhum álbum encontrado para esta busca.</p>
                  )}
                </div>
              ) : (
                (() => {
                  const cleanSimp = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['"`.,\s]/g, '');
                  const qNorm = cleanSimp(searchQuery);
                  const trackTitleNorm = cleanSimp(tracks[0]?.title);
                  const artistNameNorm = cleanSimp(activeArtist?.name);

                  // Se a primeira música corresponder ao título buscado (ex: "Planeta de Cores") e o artista não for um match exato:
                  const isTopSongMatch = tracks.length > 0 && (
                    trackTitleNorm === qNorm && artistNameNorm !== qNorm
                  );

                  const shouldShowArtistHero = activeArtist && !isTopSongMatch;

                  return (
                    <>
                      {shouldShowArtistHero ? (
                        <div className={styles.searchHeroSplitCard}>
                          {/* Lado Esquerdo: Card de Destaque do Artista */}
                          <div
                            className={styles.searchHeroArtistCard}
                            onClick={() => openArtistProfile(activeArtist.name, activeArtist.id)}
                            title={`Abrir perfil do artista ${activeArtist.name}`}
                          >
                            <ChevronRight size={18} className={styles.artistCardChevronIcon} />
                            <img
                              src={activeArtist.avatarImg || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                              alt={activeArtist.name}
                              className={styles.artistAvatarImage}
                              referrerPolicy="no-referrer"
                              onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
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

                          {/* Lado Direito: Preview das 3 Melhores Músicas do Artista */}
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
                                      src={track.cover || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                                      alt={track.title}
                                      className={styles.heroTrackThumb}
                                      referrerPolicy="no-referrer"
                                      onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                                      <span className={`${styles.heroTrackName} ${isCurrent ? styles.heroTrackNameActive : ''}`}>
                                        {track.title}
                                      </span>
                                      {(track.isPurchased || track.badge === 'Comprada' || isTrackOwned(track)) ? (
                                        <span className={styles.purchasedBadge} style={{ flexShrink: 0, padding: '1px 5px', fontSize: '0.68rem', lineHeight: '1.2' }}>
                                          Comprada
                                        </span>
                                      ) : ((track.isRented || track.badge === 'Alugada' || isTrackRentedActive(track)) && !track.isExpired) ? (
                                        <span className={styles.rentedBadge} style={{ flexShrink: 0, padding: '1px 5px', fontSize: '0.68rem', lineHeight: '1.2' }}>
                                          Alugada
                                        </span>
                                      ) : null}
                                    </div>
                                    <span className={styles.heroTrackSubtitle}>
                                      Música • {track.duration || '3:30'} • {track.plays}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : tracks.length > 0 ? (
                        /* ─── CARD DE MELHOR RESULTADO QUANDO FOR UMA MÚSICA ─── */
                        <div className={styles.searchHeroSplitCard}>
                          <div
                            className={styles.searchHeroSongCard}
                            onClick={() => playTrack(tracks[0])}
                            title={`Reproduzir ${tracks[0].title}`}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <span className={styles.topResultTag} style={{ marginBottom: 0 }}>Melhor resultado</span>
                              {(tracks[0].isPurchased || tracks[0].badge === 'Comprada' || isTrackOwned(tracks[0])) ? (
                                <span className={styles.purchasedBadge}>Comprada</span>
                              ) : ((tracks[0].isRented || tracks[0].badge === 'Alugada' || isTrackRentedActive(tracks[0])) && !tracks[0].isExpired) ? (
                                <span className={styles.rentedBadge}>Alugada</span>
                              ) : null}
                            </div>
                            <div className={styles.songCardCoverWrap}>
                              <img
                                src={tracks[0].cover || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                                alt={tracks[0].title}
                                className={styles.songCardCover}
                                referrerPolicy="no-referrer"
                                onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
                              />
                              <div className={styles.songCardPlayBtn}>
                                <div className={styles.songCardPlayCircle}>
                                  {currentTrack?.id === tracks[0].id && isPlaying ? (
                                    <Pause size={20} fill="#000000" color="#000000" />
                                  ) : (
                                    <Play size={20} fill="#000000" color="#000000" style={{ marginLeft: 2 }} />
                                  )}
                                </div>
                              </div>
                            </div>
                            <h2 className={styles.songCardTitle}>{tracks[0].title}</h2>
                            <p className={styles.songCardMeta}>
                              Música • <span className={styles.songCardArtistLink} onClick={(e) => { e.stopPropagation(); openArtistProfile(tracks[0].artist); }}>{tracks[0].artist}</span> • {tracks[0].album}
                            </p>
                          </div>

                          <div className={styles.searchHeroTracksCol}>
                            {tracks.slice(1, 4).map((track) => {
                              const isCurrent = currentTrack?.id === track.id;
                              return (
                                <div
                                  key={track.id}
                                  className={`${styles.heroTrackRow} ${isCurrent ? styles.heroTrackRowActive : ''}`}
                                  onClick={() => playTrack(track)}
                                >
                                  <div className={styles.heroTrackThumbWrap}>
                                    <img
                                      src={track.cover || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                                      alt={track.title}
                                      className={styles.heroTrackThumb}
                                      referrerPolicy="no-referrer"
                                      onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                                      <span className={`${styles.heroTrackName} ${isCurrent ? styles.heroTrackNameActive : ''}`}>
                                        {track.title}
                                      </span>
                                      {(track.isPurchased || track.badge === 'Comprada' || isTrackOwned(track)) ? (
                                        <span className={styles.purchasedBadge} style={{ flexShrink: 0, padding: '1px 5px', fontSize: '0.68rem', lineHeight: '1.2' }}>
                                          Comprada
                                        </span>
                                      ) : ((track.isRented || track.badge === 'Alugada' || isTrackRentedActive(track)) && !track.isExpired) ? (
                                        <span className={styles.rentedBadge} style={{ flexShrink: 0, padding: '1px 5px', fontSize: '0.68rem', lineHeight: '1.2' }}>
                                          Alugada
                                        </span>
                                      ) : null}
                                    </div>
                                    <span className={styles.heroTrackSubtitle}>
                                      Música • {track.artist} • {track.duration || '3:30'}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    className={styles.trackCardMoreBtn}
                                    onClick={(e) => openTrackContextMenu(track, e)}
                                    title="Mais opções"
                                    aria-label="Mais opções"
                                  >
                                    <MoreVertical size={16} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      {/* ─── DEMAIS MÚSICAS ENCONTRADAS (Foto 2) ─── */}
                      <div className={styles.searchResultsList}>
                        {(shouldShowArtistHero ? tracks.slice(3) : tracks.slice(4)).map((track) => {
                      const isCurrent = currentTrack?.id === track.id;
                      return (
                        <div
                          key={track.id}
                          className={`${styles.resultTrackItem} ${isCurrent ? styles.resultTrackItemActive : ''}`}
                          onClick={() => playTrack(track)}
                        >
                          <div className={styles.resultTrackThumbWrap}>
                            <img
                              src={track.cover || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                              alt={track.title}
                              className={styles.resultTrackThumb}
                              referrerPolicy="no-referrer"
                              onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                              <span className={`${styles.resultTrackTitle} ${isCurrent ? styles.resultTrackTitleActive : ''}`}>
                                {track.title}
                              </span>
                              {(track.isPurchased || track.badge === 'Comprada' || isTrackOwned(track)) ? (
                                <span className={styles.purchasedBadge} style={{ flexShrink: 0, padding: '1px 5px', fontSize: '0.68rem', lineHeight: '1.2' }}>
                                  Comprada
                                </span>
                              ) : ((track.isRented || track.badge === 'Alugada' || isTrackRentedActive(track)) && !track.isExpired) ? (
                                <span className={styles.rentedBadge} style={{ flexShrink: 0, padding: '1px 5px', fontSize: '0.68rem', lineHeight: '1.2' }}>
                                  Alugada
                                </span>
                              ) : null}
                            </div>
                            <span className={styles.resultTrackMeta}>
                              Música • {track.artist} • {track.plays}
                            </span>
                          </div>

                          <button
                            type="button"
                            className={styles.trackCardMoreBtn}
                            onClick={(e) => openTrackContextMenu(track, e)}
                            title="Mais opções"
                            aria-label="Mais opções"
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()
          )}
        </div>
      ) : (
            /* ─── PERFIL DO ARTISTA MANTIDO (Foto 3) ─── */
            <>


              {/* Banner Cinematográfico do Artista (Foto 3) */}
              <section
                className={styles.artistBannerContainer}
                style={{
                  backgroundImage: `url('${activeArtist?.bannerImg || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025309/bookhub/img/artist_banner_justin.jpg'}')`,
                  backgroundPosition: activeArtist?.bannerPosition || 'center 18%'
                }}
              >
                <div className={styles.bannerContent}>
                  <h1 className={styles.bannerArtistTitle}>{activeArtist?.name || 'Artista'}</h1>
                  <p className={styles.bannerMonthlyListeners}>{activeArtist?.listeners || ''}</p>
                  <p className={styles.bannerBio}>
                    {activeArtist?.bio || ''}
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
                      className={isArtistSubscribed ? styles.btnSubscribed : styles.btnSubscribe}
                      onClick={handleToggleArtistSubscription}
                      disabled={isSubscribing}
                      title={isArtistSubscribed ? 'Inscrito • Clique para cancelar inscrição' : 'Inscrever-se neste artista'}
                    >
                      {isArtistSubscribed ? (
                        <>
                          <Check size={16} strokeWidth={2.5} />
                          <span>Inscrito</span>
                        </>
                      ) : (
                        <span>Inscrever-se {activeArtist?.subscribers || '428 mil'}</span>
                      )}
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
                                  src={
                                    (track.cover && !track.cover.includes('42078a6ff6071ef28ba866bbf30fe357'))
                                      ? track.cover
                                      : (track.cover_url && !track.cover_url.includes('42078a6ff6071ef28ba866bbf30fe357'))
                                        ? track.cover_url
                                        : 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'
                                  }
                                  alt={track.title}
                                  className={styles.topMusicasThumb}
                                  referrerPolicy="no-referrer"
                                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
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

                              <button
                                type="button"
                                className={styles.trackCardMoreBtn}
                                onClick={(e) => openTrackContextMenu(track, e)}
                                title="Mais opções"
                                aria-label="Mais opções"
                              >
                                <MoreVertical size={16} />
                              </button>
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
                {albums && albums.length > 0 && (
                  <section className={styles.carouselSection}>
                    <div className={styles.sectionHeaderRow}>
                      <h2 className={styles.sectionHeading}>Álbuns</h2>
                      <div className={styles.sectionNavControls}>
                        {albums.length > 5 && (
                          <button
                            type="button"
                            className={styles.btnMais}
                            onClick={() => setShowAllAlbums(!showAllAlbums)}
                          >
                            {showAllAlbums ? 'Mostrar menos' : 'Mais'}
                          </button>
                        )}
                        {!showAllAlbums && (
                          <>
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
                          </>
                        )}
                      </div>
                    </div>

                    <div className={showAllAlbums ? styles.cardsGrid : styles.cardsRow} ref={albumsRowRef}>
                      {albums.map((album) => (
                        <div
                          key={album.id}
                          className={styles.mediaCard}
                          onClick={() => handleSelectAlbum(album)}
                        >
                          <div className={styles.mediaCoverWrap}>
                            <img
                              src={album.cover || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                              alt={album.title}
                              className={styles.mediaCover}
                              referrerPolicy="no-referrer"
                              onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
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
                            <span>{getDisplayAlbumYear(album, activeArtist?.name || album.artist, album.year)}</span>
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
                )}

                {/* ─── SEÇÃO SINGLES E EPs (Foto 3) ──────────────────── */}
                {singles && singles.length > 0 && (
                  <section className={styles.carouselSection}>
                    <div className={styles.sectionHeaderRow}>
                      <h2 className={styles.sectionHeading}>Singles e EPs</h2>
                      <div className={styles.sectionNavControls}>
                        {singles.length > 5 && (
                          <button
                            type="button"
                            className={styles.btnMais}
                            onClick={() => setShowAllSingles(!showAllSingles)}
                          >
                            {showAllSingles ? 'Mostrar menos' : 'Mais'}
                          </button>
                        )}
                        {!showAllSingles && (
                          <>
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
                          </>
                        )}
                      </div>
                    </div>

                    <div className={showAllSingles ? styles.cardsGrid : styles.cardsRow} ref={singlesRowRef}>
                      {singles.map((single) => (
                        <div
                          key={single.id}
                          className={styles.mediaCard}
                          onClick={() => handleSelectAlbum(single)}
                        >
                          <div className={styles.mediaCoverWrap}>
                            <img
                              src={single.cover || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                              alt={single.title}
                              className={styles.mediaCover}
                              referrerPolicy="no-referrer"
                              onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
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
                            <span>{getDisplayAlbumYear(single, activeArtist?.name || single.artist, single.year)}</span>
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
                )}

                {/* ─── SEÇÃO APARECE EM / PARTICIPAÇÕES EM ÁLBUNS ────── */}
                {appearsOn && appearsOn.length > 0 && (
                  <section className={styles.carouselSection}>
                    <div className={styles.sectionHeaderRow}>
                      <div>
                        <h2 className={styles.sectionHeading}>Aparece em</h2>
                        <p className={styles.sectionSubheading}>
                          Participações e colaborações em álbuns de outros artistas
                        </p>
                      </div>
                      <div className={styles.sectionNavControls}>
                        <button
                          type="button"
                          className={styles.carouselArrowBtn}
                          onClick={() => scrollRow(appearsOnRowRef, 'left')}
                          aria-label="Rolar participações para esquerda"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <button
                          type="button"
                          className={styles.carouselArrowBtn}
                          onClick={() => scrollRow(appearsOnRowRef, 'right')}
                          aria-label="Rolar participações para direita"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>

                    <div className={styles.cardsRow} ref={appearsOnRowRef}>
                      {appearsOn.map((feat) => (
                        <div
                          key={feat.id}
                          className={styles.mediaCard}
                          onClick={() => handleSelectAlbum(feat)}
                        >
                          <div className={styles.mediaCoverWrap}>
                            <img
                              src={feat.cover || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                              alt={feat.title}
                              className={styles.mediaCover}
                              referrerPolicy="no-referrer"
                              onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
                            />
                            <div className={styles.cardPlayOverlay}>
                              <Play size={24} fill="#ffffff" color="#ffffff" />
                            </div>
                          </div>
                          <h3 className={styles.mediaCardTitle} title={feat.title}>
                            {feat.title}
                          </h3>
                          <div className={styles.mediaCardSubtitle}>
                            <span style={{ color: '#38bdf8', fontWeight: 600 }}>{feat.artist}</span>
                            <span className={styles.albumDot}>•</span>
                            <span className={styles.albumTypeLabel}>Participação</span>
                          </div>
                          {feat.priceSale && (
                            <div className={styles.mediaCardPricing}>
                              <span className={styles.priceSaleTag} title="Preço de Compra">Comprar {feat.priceSale}</span>
                              <span className={styles.priceRentTag} title="Aluguel por 30 dias">Alugar {feat.priceRent}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </>
          )}
        </main>
      </div> {/* fim appBody */}

      {/* ─── CARRINHO DE COMPRAS INTEGRADO (SUBSTITUI MODAL POPUP) ─── */}
      {isCartOpen && (
        <div
          className={styles.cartBackdrop}
          onClick={() => setIsCartOpen(false)}
          title="Clique para fechar o carrinho"
        />
      )}

      {isCartOpen && (
        <aside className={styles.cartDrawer} onClick={(e) => e.stopPropagation()} aria-label="Carrinho de Compras">
          {/* Cabeçalho do Carrinho */}
          <div className={styles.cartHeader}>
            <div className={styles.cartHeaderTitleWrap}>
              <h2 className={styles.cartHeaderTitle}>
                <ShoppingCart size={22} color="#10b981" />
                <span>Carrinho de Compras</span>
              </h2>
              {cartItems.length > 0 && (
                <span className={styles.cartHeaderBadge}>
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}
                </span>
              )}
            </div>
            <button
              type="button"
              className={styles.cartCloseBtn}
              onClick={() => setIsCartOpen(false)}
              title="Fechar Carrinho"
            >
              <X size={18} />
            </button>
          </div>

          {/* Conteúdo do Carrinho */}
          <div className={styles.cartContent}>
            {/* ETAPA: SUCESSO DO PEDIDO */}
            {cartStep === 'success' ? (
              <div className={styles.cartSuccessBox}>
                <div style={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981'
                }}>
                  <CheckCircle2 size={40} />
                </div>
                <h3 className={styles.cartSuccessTitle}>Pagamento Confirmado!</h3>
                <p className={styles.cartSuccessDesc}>
                  Parabéns! Suas músicas foram desbloqueadas com sucesso e já estão disponíveis com reprodução ilimitada na sua biblioteca do DevSongs.
                </p>

                {checkoutEmail && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: '0.82rem',
                    color: '#34d399'
                  }}>
                    <Mail size={16} />
                    <span>Recibo e comprovante enviados para <strong>{checkoutEmail}</strong></span>
                  </div>
                )}

                {lastOrderPurchased.length > 0 && (
                  <div style={{ width: '100%', marginTop: '0.5rem', textAlign: 'left' }}>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 8 }}>
                      Faixas Adquiridas ({lastOrderPurchased.length}):
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {lastOrderPurchased.map((it, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          background: 'rgba(255, 255, 255, 0.03)',
                          padding: '6px 10px',
                          borderRadius: 8
                        }}>
                          <img
                            src={it.cover || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                            alt={it.title}
                            style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover' }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.86rem', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {it.title}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                              {it.type === 'buy' ? '✨ Compra Definitiva' : '⏳ Aluguel 30 dias'} • R$ {Number(it.price || 0).toFixed(2).replace('.', ',')}
                            </div>
                          </div>
                          <Check size={16} color="#10b981" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className={styles.btnCartCheckout}
                  style={{ marginTop: '1rem' }}
                  onClick={() => {
                    setCartStep('cart');
                    setIsCartOpen(false);
                  }}
                >
                  <Play size={18} fill="currentColor" />
                  <span>Continuar Ouvindo Músicas</span>
                </button>
              </div>
            ) : cartItems.length === 0 ? (
              /* ESTADO: CARRINHO VAZIO */
              <div className={styles.cartEmptyState}>
                <div className={styles.cartEmptyIconWrap}>
                  <ShoppingBag size={38} />
                </div>
                <h3 className={styles.cartEmptyTitle}>Seu carrinho está vazio</h3>
                <p className={styles.cartEmptySub}>
                  Navegue pelo catálogo de gravadoras e selecione músicas para comprar ou alugar. Elas aparecerão aqui para você finalizar tudo de uma vez.
                </p>
                <button
                  type="button"
                  className={styles.btnCartSecondary}
                  style={{ width: 'auto', padding: '0.7rem 1.4rem', marginTop: '0.5rem' }}
                  onClick={() => setIsCartOpen(false)}
                >
                  Explorar Catálogo
                </button>
              </div>
            ) : cartStep === 'cart' ? (
              /* ETAPA 1: REVISÃO DE ITENS DO CARRINHO */
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Itens no Carrinho ({cartItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={clearCart}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Trash2 size={13} />
                    <span>Esvaziar</span>
                  </button>
                </div>

                <div className={styles.cartItemsList}>
                  {cartItems.map((item) => (
                    <div key={item.cartId} className={styles.cartItemCard}>
                      <div className={styles.cartItemTopRow}>
                        <div className={styles.cartItemCoverWrap}>
                          <img
                            src={item.cover || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                            alt={item.title}
                            className={styles.cartItemCover}
                            onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
                          />
                        </div>

                        <div className={styles.cartItemInfo}>
                          <span className={styles.cartItemTitle} title={item.title}>{item.title}</span>
                          <span className={styles.cartItemArtist}>{item.artist}</span>
                        </div>

                        <div className={styles.cartItemRightMeta}>
                          <span className={styles.cartItemPrice}>
                            R$ {Number(item.price || 0).toFixed(2).replace('.', ',')}
                          </span>
                          <button
                            type="button"
                            className={styles.cartItemRemoveBtn}
                            onClick={() => removeFromCart(item.cartId)}
                            title="Remover música do carrinho"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Seletor Segmentado Moderno: Compra Vitalícia vs Aluguel */}
                      <div className={styles.cartSegmentedControl}>
                        <button
                          type="button"
                          className={`${styles.cartSegmentBtn} ${item.type === 'buy' ? styles.cartSegmentBtnActiveBuy : ''}`}
                          onClick={() => item.type !== 'buy' && toggleCartItemType(item.cartId)}
                          title="Alternar para Compra Vitalícia"
                        >
                          <div className={styles.cartSegmentInner}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Sparkles size={13} color={item.type === 'buy' ? '#10b981' : '#94a3b8'} />
                              <span className={styles.cartSegmentTitle}>
                                {item.isAlbum ? 'Álbum Vitalício' : 'Compra Vitalícia'}
                              </span>
                            </div>
                            <span className={styles.cartSegmentPriceTag}>
                              {item.isAlbum
                                ? `R$ ${(item.originalPrice !== undefined ? Math.max(0, item.originalPrice - (item.discount || 0)) : 29.90).toFixed(2).replace('.', ',')}`
                                : (item.rawTrack?.salePrice || item.rawTrack?.priceSale || 'R$ 4,90')}
                            </span>
                          </div>
                        </button>

                        <button
                          type="button"
                          className={`${styles.cartSegmentBtn} ${item.type === 'rent' ? styles.cartSegmentBtnActiveRent : ''}`}
                          onClick={() => item.type !== 'rent' && toggleCartItemType(item.cartId)}
                          title="Alternar para Aluguel por 30 Dias"
                        >
                          <div className={styles.cartSegmentInner}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Clock size={13} color={item.type === 'rent' ? '#3b82f6' : '#94a3b8'} />
                              <span className={styles.cartSegmentTitle}>
                                {item.isAlbum ? 'Aluguel Álbum 30d' : 'Aluguel 30d'}
                              </span>
                            </div>
                            <span className={styles.cartSegmentPriceTag}>
                              {item.isAlbum ? 'R$ 9,90' : (item.rawTrack?.rentPrice || item.rawTrack?.priceRent || 'R$ 1,90')}
                            </span>
                          </div>
                        </button>
                      </div>

                      {item.isAlbum && item.discount > 0 && item.type === 'buy' && (
                        <div style={{ marginTop: '0.4rem', fontSize: '0.74rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Sparkles size={12} />
                          <span>Desconto inteligente aplicado: - R$ {Number(item.discount).toFixed(2).replace('.', ',')} por faixas já compradas</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Seção de Cupom de Desconto */}
                <div className={styles.cartCouponSection}>
                  <div className={styles.cartCouponHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Tag size={15} color="#10b981" />
                      <span className={styles.cartCouponLabel}>Cupom de Desconto</span>
                    </div>

                    <button
                      type="button"
                      className={styles.cartCouponToggleBtn}
                      onClick={() => setShowCreateCoupon(!showCreateCoupon)}
                      title={showCreateCoupon ? 'Fechar criador de cupom' : 'Criar novo cupom de desconto'}
                    >
                      {showCreateCoupon ? 'Fechar' : '+ Criar Novo Cupom'}
                    </button>
                  </div>

                  {/* Formulário de Criação de Novo Cupom */}
                  {showCreateCoupon ? (
                    <form onSubmit={handleCreateCoupon} className={styles.cartCouponCreateBox}>
                      <div className={styles.cartCouponCreateTitleRow}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ffffff' }}>
                          ✨ Criar Novo Cupom de Uso Único
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          (Após ser usado 1x na compra, será desativado)
                        </span>
                      </div>

                      <div className={styles.cartCouponCreateRow}>
                        <input
                          type="text"
                          placeholder="Código (ex: MEUCUPOM30)"
                          value={newCouponForm.code}
                          onChange={(e) => setNewCouponForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                          className={styles.cartCouponInput}
                          maxLength={15}
                        />

                        <div className={styles.cartCouponTypeRow}>
                          <button
                            type="button"
                            className={`${styles.cartCouponTypeBtn} ${newCouponForm.type === 'percent' ? styles.cartCouponTypeBtnActive : ''}`}
                            onClick={() => setNewCouponForm(prev => ({ ...prev, type: 'percent', value: '20' }))}
                          >
                            % Porcentagem
                          </button>
                          <button
                            type="button"
                            className={`${styles.cartCouponTypeBtn} ${newCouponForm.type === 'fixed' ? styles.cartCouponTypeBtnActive : ''}`}
                            onClick={() => setNewCouponForm(prev => ({ ...prev, type: 'fixed', value: '3.00' }))}
                          >
                            R$ Fixo
                          </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="number"
                            min="1"
                            max={newCouponForm.type === 'percent' ? 100 : 999}
                            value={newCouponForm.value}
                            onChange={(e) => setNewCouponForm(prev => ({ ...prev, value: e.target.value }))}
                            className={styles.cartCouponValueInput}
                            placeholder="Valor"
                          />
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700 }}>
                            {newCouponForm.type === 'percent' ? '%' : 'R$'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        <button type="submit" className={styles.cartCouponCreateSubmitBtn}>
                          Salvar e Aplicar Cupom
                        </button>
                        <button
                          type="button"
                          className={styles.cartCouponCreateCancelBtn}
                          onClick={() => setShowCreateCoupon(false)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : appliedCoupon ? (
                    /* Cupom Atualmente Aplicado */
                    <div className={styles.cartCouponAppliedBox}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className={styles.cartCouponBadge}>
                            <Percent size={12} />
                            <span>{appliedCoupon.code}</span>
                          </div>
                          <span className={styles.cartCouponDesc} title={appliedCoupon.label}>
                            {appliedCoupon.label} (- R$ {couponDiscount.toFixed(2).replace('.', ',')})
                          </span>
                        </div>
                        <span style={{ fontSize: '0.68rem', color: '#10b981', marginLeft: 2 }}>
                          🔒 Uso único: Este cupom será invalidado após a confirmação deste pedido.
                        </span>
                      </div>
                      <button
                        type="button"
                        className={styles.cartCouponRemoveBtn}
                        onClick={handleRemoveCoupon}
                        title="Remover cupom"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    /* Formulário Normal de Aplicação */
                    <>
                      <form onSubmit={handleApplyCoupon} className={styles.cartCouponForm}>
                        <input
                          type="text"
                          placeholder="Digite o código (ex: DEVSONGS10)"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          className={styles.cartCouponInput}
                        />
                        <button
                          type="submit"
                          className={styles.cartCouponBtn}
                          disabled={!couponInput.trim()}
                        >
                          Aplicar
                        </button>
                      </form>

                      {/* Lista de Cupons Disponíveis / Sugestões */}
                      {availableCouponsList.length > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Disponíveis:</span>
                          {availableCouponsList.slice(0, 4).map(code => (
                            <button
                              key={code}
                              type="button"
                              onClick={(e) => handleApplyCoupon(e, code)}
                              className={styles.cartCouponQuickTag}
                              title={`Clique para aplicar ${code}`}
                            >
                              {code} ({allCoupons[code]?.label?.split(' ')[0]})
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.72rem', color: '#eab308', background: 'rgba(234, 179, 8, 0.1)', padding: '5px 8px', borderRadius: 6 }}>
                          ⚠️ Todos os cupons padrão já foram utilizados! Clique em <strong>"+ Criar Novo Cupom"</strong> acima para criar um cupom inédito.
                        </div>
                      )}
                    </>
                  )}

                  {couponFeedback && (
                    <div className={`${styles.cartCouponAlert} ${couponFeedback.type === 'error' ? styles.cartCouponAlertError : styles.cartCouponAlertSuccess}`}>
                      {couponFeedback.message}
                    </div>
                  )}
                </div>

                {/* Resumo do Pedido */}
                <div className={styles.cartOrderSummary}>
                  <div className={styles.cartSummaryRow}>
                    <span>Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'})</span>
                    <span>R$ {cartSubtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  {appliedCoupon && (
                    <div className={styles.cartSummaryRow}>
                      <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Tag size={13} /> Desconto Cupom ({appliedCoupon.code})
                      </span>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>
                        - R$ {couponDiscount.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  )}
                  <div className={styles.cartSummaryRow}>
                    <span>Acesso imediato</span>
                    <span style={{ color: '#60a5fa' }}>Grátis (Digital)</span>
                  </div>
                  <div className={styles.cartSummaryTotalRow}>
                    <span>Total</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      {appliedCoupon && (
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                          R$ {cartSubtotal.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                      <span style={{ color: '#10b981' }}>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* ETAPA 2: PROCESSO DE PAGAMENTO / CHECKOUT NO CARRINHO */
              <>
                <button
                  type="button"
                  className={styles.cartBackToItemsBtn}
                  onClick={() => setCartStep('cart')}
                >
                  <ArrowLeft size={16} />
                  <span>Voltar aos itens do carrinho</span>
                </button>

                {/* Resumo compacto de valor */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block' }}>Total do Pedido:</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981' }}>
                        R$ {cartTotal.toFixed(2).replace('.', ',')}
                      </span>
                      {appliedCoupon && (
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                          R$ {cartSubtotal.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{ fontSize: '0.78rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '3px 8px', borderRadius: 999, fontWeight: 700 }}>
                      {cartItems.length} {cartItems.length === 1 ? 'faixa selecionada' : 'faixas selecionadas'}
                    </span>
                    {appliedCoupon && (
                      <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Tag size={11} /> Cupom: {appliedCoupon.code}
                      </span>
                    )}
                  </div>
                </div>

                {/* Abas de Formas de Pagamento */}
                <div className={styles.paymentMethodsRow}>
                  <span className={styles.paymentMethodTitle}>Forma de Pagamento</span>
                  <div className={styles.paymentTabs}>
                    <button
                      type="button"
                      className={`${styles.paymentTabBtn} ${paymentMethod === 'pix' ? styles.paymentTabBtnActive : ''}`}
                      onClick={() => setPaymentMethod('pix')}
                    >
                      <QrCode size={16} style={{ marginRight: 6 }} />
                      Pix Instantâneo
                    </button>
                    <button
                      type="button"
                      className={`${styles.paymentTabBtn} ${paymentMethod === 'card' ? styles.paymentTabBtnActive : ''}`}
                      onClick={() => setPaymentMethod('card')}
                    >
                      <CreditCard size={16} style={{ marginRight: 6 }} />
                      Cartão de Crédito
                    </button>
                    <button
                      type="button"
                      className={`${styles.paymentTabBtn} ${paymentMethod === 'balance' ? styles.paymentTabBtnActive : ''}`}
                      onClick={() => setPaymentMethod('balance')}
                    >
                      <Sparkles size={16} style={{ marginRight: 6 }} />
                      Saldo DevSongs
                    </button>
                  </div>
                </div>

                {/* Conteúdo específico da forma selecionada */}
                {paymentMethod === 'pix' && (
                  <div className={styles.pixQrSection}>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', display: 'block' }}>
                        Escaneie o QR Code Pix Oficial
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        Abra o app do seu banco e aponte a câmera para o QR Code abaixo
                      </span>
                    </div>

                    <div className={styles.pixQrWrap}>
                      {pixQrDataUrl ? (
                        <img
                          src={pixQrDataUrl}
                          alt="QR Code Pix Oficial Banco Central"
                          style={{ width: 200, height: 200, display: 'block', borderRadius: 8 }}
                        />
                      ) : (
                        <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                          Gerando QR Code Pix...
                        </div>
                      )}
                    </div>

                    {/* Chave de Destino com botão de configurar */}
                    <div className={styles.pixKeyConfigRow}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                          Chave Pix de Destino
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingPixKey(!isEditingPixKey)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#38bdf8',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {isEditingPixKey ? 'Salvar Chave' : 'Alterar Chave'}
                        </button>
                      </div>

                      {isEditingPixKey ? (
                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                          <input
                            type="text"
                            value={pixReceiverKey}
                            onChange={(e) => setPixReceiverKey(e.target.value)}
                            placeholder="E-mail, CPF, celular ou EVP Nubank"
                            style={{
                              flex: 1,
                              background: 'rgba(0, 0, 0, 0.45)',
                              border: '1px solid #10b981',
                              borderRadius: 6,
                              color: '#fff',
                              padding: '5px 8px',
                              fontSize: '0.8rem',
                              outline: 'none'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (typeof window !== 'undefined') {
                                localStorage.setItem('devsongs_pix_key', pixReceiverKey);
                              }
                              setIsEditingPixKey(false);
                            }}
                            style={{
                              background: '#10b981',
                              border: 'none',
                              color: '#fff',
                              borderRadius: 6,
                              padding: '5px 10px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.84rem', color: '#e2e8f0', fontWeight: 600, wordBreak: 'break-all' }}>
                          {pixReceiverKey || 'enzo@devsongs.com.br'}
                        </span>
                      )}
                    </div>

                    {/* Pix Copia e Cola */}
                    <div className={styles.pixCopyRow}>
                      <input
                        type="text"
                        readOnly
                        value={pixCodeString || 'Gerando código Pix Copia e Cola...'}
                        className={styles.pixInputCode}
                      />
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className={styles.btnCopyPix}
                        title="Copiar código Pix"
                      >
                        {copiedPix ? <Check size={16} /> : <Copy size={16} />}
                        <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Cartão de Crédito Visual */}
                    <div className={styles.cardPreviewBox}>
                      <div className={styles.cardTopRow}>
                        <div className={styles.cardChip} />
                        <span className={styles.cardBrand}>DEVSONGS PAY</span>
                      </div>
                      <div className={styles.cardNumberText}>
                        {cardForm.number || '•••• •••• •••• ••••'}
                      </div>
                      <div className={styles.cardBottomRow}>
                        <div>
                          <div style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Titular
                          </div>
                          <div className={styles.cardHolderName}>
                            {cardForm.name || 'NOME DO TITULAR'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Validade
                          </div>
                          <div className={styles.cardExpiryDate}>
                            {cardForm.expiry || 'MM/AA'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Inputs do Cartão com Validações */}
                    <div className={styles.cardInputsGrid}>
                      <div className={styles.cardInputGroup}>
                        <label className={styles.cardInputLabel}>Número do Cartão</label>
                        <input
                          type="text"
                          placeholder="0000 0000 0000 0000"
                          value={cardForm.number}
                          onChange={handleCardNumberChange}
                          maxLength={19}
                          className={styles.cardTextInput}
                        />
                      </div>

                      <div className={styles.cardInputGroup}>
                        <label className={styles.cardInputLabel}>Nome Impresso no Cartão (Somente Letras)</label>
                        <input
                          type="text"
                          placeholder="EX: ENZO VIEIRA"
                          value={cardForm.name}
                          onChange={handleCardNameChange}
                          className={styles.cardTextInput}
                        />
                      </div>

                      <div className={styles.cardInputsRow}>
                        <div className={styles.cardInputGroup}>
                          <label className={styles.cardInputLabel}>Validade</label>
                          <input
                            type="text"
                            placeholder="MM/AA"
                            value={cardForm.expiry}
                            onChange={handleCardExpiryChange}
                            maxLength={5}
                            className={styles.cardTextInput}
                          />
                        </div>
                        <div className={styles.cardInputGroup}>
                          <label className={styles.cardInputLabel}>CVV</label>
                          <input
                            type="password"
                            placeholder="•••"
                            value={cardForm.cvv}
                            onChange={(e) => setCardForm(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                            maxLength={4}
                            className={styles.cardTextInput}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'balance' && (
                  <div className={styles.pixBox}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Sparkles size={20} color="#10b981" />
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>
                        Saldo em Conta DevSongs
                      </span>
                    </div>
                    <span className={styles.pixText}>
                      Seu saldo atual disponível para compras: <strong style={{ color: '#10b981' }}>R$ 150,00</strong>.
                      O valor de R$ {cartTotal.toFixed(2).replace('.', ',')} será debitado imediatamente e as faixas liberadas.
                    </span>
                  </div>
                )}

                {/* E-mail de confirmação para envio do recibo */}
                <div className={styles.emailInputWrap}>
                  <label className={styles.emailInputLabel}>
                    <Mail size={15} color="#10b981" />
                    <span>E-mail para Envio do Comprovante</span>
                  </label>
                  <input
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    value={checkoutEmail}
                    onChange={(e) => setCheckoutEmail(e.target.value)}
                    className={styles.emailInputField}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Enviaremos o comprovante de pagamento e a licença de reprodução para este e-mail.
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Rodapé / Ações do Carrinho */}
          {cartItems.length > 0 && cartStep !== 'success' && (
            <div className={styles.cartFooterActions}>
              {cartStep === 'cart' ? (
                <>
                  <button
                    type="button"
                    className={styles.btnCartCheckout}
                    onClick={() => setCartStep('checkout')}
                  >
                    <span>Finalizar Pedido • R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                    <ArrowRight size={18} />
                  </button>
                  <button
                    type="button"
                    className={styles.btnCartSecondary}
                    onClick={() => setIsCartOpen(false)}
                  >
                    Continuar Navegando
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={styles.btnCartCheckout}
                    onClick={handleConfirmCartCheckout}
                    disabled={isProcessingPayment}
                  >
                    {isProcessingPayment ? (
                      <span>Processando e Enviando Comprovante...</span>
                    ) : (
                      <>
                        <Check size={18} />
                        <span>Confirmar Pagamento (R$ {cartTotal.toFixed(2).replace('.', ',')})</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className={styles.btnCartSecondary}
                    onClick={() => setCartStep('cart')}
                    disabled={isProcessingPayment}
                  >
                    Voltar aos Itens
                  </button>
                </>
              )}
            </div>
          )}
        </aside>
      )}

        {showVideoDock && isVideoExpanded && (
          <div
            className={styles.videoBackdrop}
            onClick={() => setIsVideoExpanded(false)}
            title="Clique para recolher o vídeo"
          />
        )}

        {/* ─── YOUTUBE MUSIC VIDEO DOCK (Mini-Player & Modo Cinema Expandido) ───── */}
        <div
          id="devsongs-yt-dock-container"
          className={
            showVideoDock
              ? `${styles.youtubeDock} ${isVideoExpanded ? styles.youtubeDockExpanded : ''}`
              : styles.youtubeDockHidden
          }
        >
          <div className={styles.dockHeader}>
            <span className={styles.dockTitle} title={currentTrack ? `${currentTrack.title} • ${currentTrack.artist}` : ''}>
              🎬 {currentTrack?.title} • {currentTrack?.artist}
            </span>
            <div className={styles.dockActions}>
              <button
                type="button"
                onClick={() => setIsVideoExpanded(!isVideoExpanded)}
                className={styles.dockBtn}
                title={isVideoExpanded ? "Restaurar para o canto (PiP)" : "Expandir vídeo (Modo Cinema)"}
              >
                {isVideoExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className={styles.dockBtn}
                title="Assistir em Tela Cheia"
              >
                <Tv size={15} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowVideoDock(false);
                  setIsVideoExpanded(false);
                }}
                className={styles.dockBtn}
                title="Fechar clipe"
              >
                <X size={15} />
              </button>
            </div>
          </div>
          <div style={{ flex: 1, width: '100%', height: 'calc(100% - 32px)', position: 'relative' }}>
            <div id="devsongs-yt-frame" style={{ width: '100%', height: '100%' }} />
          </div>
        </div>

        {/* ─── FILA DE REPRODUÇÃO (DRAWER LATERAL ESTILO SPOTIFY - FOTO 1) ─── */}
        {isQueueOpen && (
          <aside className={styles.queueDrawer}>
            <div className={styles.queueHeader}>
              <div className={styles.queueHeaderTitleWrap}>
                <h3 className={styles.queueTitle}>Fila</h3>
              </div>
              <button
                type="button"
                className={styles.queueCloseBtn}
                onClick={() => setIsQueueOpen(false)}
                title="Fechar fila"
                aria-label="Fechar fila"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.queueContent}>
              {/* Seção 1: Tocando agora */}
              {currentTrack && (
                <div className={styles.queueSection}>
                  <div className={styles.queueSectionTitle}>Tocando agora</div>
                  <div className={styles.queueCurrentCard}>
                    <img
                      src={getSafeCover(currentTrack)}
                      alt={currentTrack.title}
                      className={styles.queueCurrentCover}
                      referrerPolicy="no-referrer"
                      onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
                    />
                    <div className={styles.queueCurrentMeta}>
                      <span className={styles.queueCurrentTitle}>{currentTrack.title}</span>
                      <div className={styles.queueTrackArtistRow}>
                        {currentTrack.explicit && <span className={styles.explicitTag}>E</span>}
                        <span className={styles.queueCurrentArtist}>{currentTrack.artist}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Seção 2: A seguir (Músicas adicionadas manualmente pelo usuário com "Limpar fila") */}
              {manualQueue && manualQueue.length > 0 && (
                <div className={styles.queueSection}>
                  <div className={styles.queueSectionHeaderRow}>
                    <div className={styles.queueSectionTitle} style={{ margin: 0, padding: 0 }}>
                      A seguir
                    </div>
                    <button
                      type="button"
                      className={styles.queueClearManualBtn}
                      onClick={clearManualQueue}
                      title="Limpar faixas adicionadas manualmente"
                    >
                      Limpar fila
                    </button>
                  </div>

                  <div className={styles.queueList}>
                    {manualQueue.map((item, idx) => {
                      return (
                        <div
                          key={item.manualQueueId || item.id || `manual-${idx}`}
                          className={styles.queueTrackItem}
                          onClick={() => playManualQueueTrack(idx)}
                          title={`Tocar agora: ${item.title} - ${item.artist}`}
                        >
                          <div className={styles.queueTrackCoverWrap}>
                            <img
                              src={getSafeCover(item)}
                              alt={item.title}
                              className={styles.queueTrackCover}
                              referrerPolicy="no-referrer"
                              onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
                            />
                            <div className={styles.queueTrackPlayHover}>
                              <Play size={16} fill="#ffffff" color="#ffffff" style={{ marginLeft: 2 }} />
                            </div>
                          </div>

                          <div className={styles.queueTrackMeta}>
                            <span className={styles.queueTrackTitle}>{item.title}</span>
                            <div className={styles.queueTrackArtistRow}>
                              {item.explicit && <span className={styles.explicitTag}>E</span>}
                              <span>{item.artist}</span>
                            </div>
                          </div>

                          {item.duration && (
                            <span className={styles.queueTrackDuration}>{item.duration}</span>
                          )}

                          <button
                            type="button"
                            className={styles.queueItemRemoveBtn}
                            onClick={(e) => removeFromManualQueue(idx, e)}
                            title="Remover da fila"
                            aria-label="Remover da fila"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Seção 3: Próximas de: [Nome do álbum ou playlist] */}
              <div className={styles.queueSection}>
                <div className={styles.queueSectionTitle}>
                  {displayContextTitle}{' '}
                  {effectiveContextQueue.length > 0 && (
                    <span className={styles.queueSectionSub}>
                      ({effectiveContextQueue.length} {effectiveContextQueue.length === 1 ? 'música' : 'músicas'})
                    </span>
                  )}
                </div>

                {effectiveContextQueue && effectiveContextQueue.length > 0 ? (
                  <div className={styles.queueList}>
                    {effectiveContextQueue.map((item, idx) => {
                      return (
                        <div
                          key={item.purchaseId || item.id || `ctx-${idx}`}
                          className={styles.queueTrackItem}
                          onClick={() => playContextQueueTrack(idx)}
                          title={`Tocar agora: ${item.title} - ${item.artist}`}
                        >
                          <div className={styles.queueTrackCoverWrap}>
                            <img
                              src={getSafeCover(item)}
                              alt={item.title}
                              className={styles.queueTrackCover}
                              referrerPolicy="no-referrer"
                              onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
                            />
                            <div className={styles.queueTrackPlayHover}>
                              <Play size={16} fill="#ffffff" color="#ffffff" style={{ marginLeft: 2 }} />
                            </div>
                          </div>

                          <div className={styles.queueTrackMeta}>
                            <span className={styles.queueTrackTitle}>{item.title}</span>
                            <div className={styles.queueTrackArtistRow}>
                              {item.explicit && <span className={styles.explicitTag}>E</span>}
                              <span>{item.artist}</span>
                            </div>
                          </div>

                          {item.duration && (
                            <span className={styles.queueTrackDuration}>{item.duration}</span>
                          )}

                          <button
                            type="button"
                            className={styles.queueItemRemoveBtn}
                            onClick={(e) => removeFromContextQueue(idx, e)}
                            title="Remover da fila"
                            aria-label="Remover da fila"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  (!manualQueue || manualQueue.length === 0) && (
                    <div className={styles.queueEmptyState}>
                      <span>Sua fila de reprodução está vazia.</span>
                      <span style={{ fontSize: '0.78rem', color: '#a7a7a7', marginTop: 4, textAlign: 'center', lineHeight: '1.4' }}>
                        Clique no menu de três pontinhos (⋮) em qualquer música para adicioná-la à fila.
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </aside>
        )}

        {/* ─── BOTTOM STICKY PLAYER (YouTube Music Compact) ────── */}
        {currentTrack && (
          <footer className={styles.stickyPlayer}>
            {/* Scrubber contínuo no topo exatamente como o YouTube Music (Foto 1) */}
            <div
              className={styles.topProgressBarContainer}
              onClick={handleSeek}
              title="Avançar / Retroceder na música"
            >
              <div
                className={styles.topProgressBarFill}
                style={{ width: `${Math.min(100, Math.max(0, (currentTime / (duration || 1)) * 100))}%` }}
              >
                <div className={styles.topProgressBarThumb} />
              </div>
            </div>

            {/* Player Left: Current Track */}
            <div className={styles.playerLeft}>
              <div className={styles.playerCoverWrap}>
                <img
                  src={currentTrack ? getSafeCover(currentTrack) : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
                  alt={currentTrack?.title}
                  className={styles.playerCover}
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
                />
              </div>

              <div className={styles.playerTrackDetails}>
                <span className={styles.playerTrackTitle}>{currentTrack?.title || 'Selecione uma faixa'}</span>
                <span className={styles.playerTrackArtist}>{currentTrack?.artist || 'Artista'}</span>
              </div>
            </div>

            {/* Player Center: Controls em linha única */}
            <div className={styles.playerCenter}>
              <button
                type="button"
                onClick={toggleShuffle}
                className={`${styles.controlBtn} ${isShuffle ? styles.controlBtnActive : ''}`}
                title="Ordem aleatória"
              >
                <Shuffle size={18} />
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
                  <Pause size={18} fill="currentColor" />
                ) : (
                  <Play size={18} fill="currentColor" style={{ marginLeft: 2 }} />
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
                <Repeat size={18} />
              </button>

              <button
                type="button"
                onClick={() => setIsQueueOpen(!isQueueOpen)}
                className={`${styles.controlBtn} ${isQueueOpen ? styles.controlBtnActive : ''}`}
                title="Fila de reprodução"
                aria-label="Fila de reprodução"
              >
                <ListMusic size={18} />
              </button>
            </div>

            {/* Player Right: Tempo, Like, Vídeo, Volume e Fechar */}
            <div className={styles.playerRight}>
              <span
                className={styles.timeDisplay}
                onClick={() => setShowRemainingTime(prev => !prev)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                title={showRemainingTime ? 'Clique para ver duração total' : 'Clique para ver tempo restante (-mm:ss)'}
              >
                {showRemainingTime ? (
                  `${formatSeconds(currentTime)} / -${formatSeconds(Math.max(0, duration - currentTime))}`
                ) : (
                  `${formatSeconds(currentTime)} / ${formatSeconds(duration)}`
                )}
              </span>

              <button
                type="button"
                onClick={() => currentTrack && toggleLike(currentTrack.id)}
                className={`${styles.likeBtn} ${currentTrack && likedMap[currentTrack.id] ? styles.likeBtnActive : ''}`}
                title="Curtir / Salvar na sua biblioteca"
              >
                <Heart size={18} fill={currentTrack && likedMap[currentTrack.id] ? '#ff0000' : 'none'} color={currentTrack && likedMap[currentTrack.id] ? '#ff0000' : 'currentColor'} />
              </button>

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
                <X size={16} />
              </button>
            </div>
          </footer>
        )}

        {/* Modal de Confirmação para Cancelar Inscrição */}
        {unsubscribeModalOpen && (
          <div className={styles.unsubModalBackdrop} onClick={() => !isSubscribing && setUnsubscribeModalOpen(false)}>
            <div className={styles.unsubModal} onClick={(e) => e.stopPropagation()}>
              <h3 className={styles.unsubModalTitle}>Cancelar inscrição?</h3>
              <p className={styles.unsubModalDesc}>
                Deseja cancelar a sua inscrição em <strong>{activeArtist?.name}</strong>? O artista será removido da aba <strong>Artistas</strong> na sua Biblioteca Musical.
              </p>
              <div className={styles.unsubModalActions}>
                <button
                  type="button"
                  className={styles.unsubModalCancelBtn}
                  onClick={() => setUnsubscribeModalOpen(false)}
                  disabled={isSubscribing}
                >
                  Manter inscrição
                </button>
                <button
                  type="button"
                  className={styles.unsubModalConfirmBtn}
                  onClick={handleConfirmUnsubscribe}
                  disabled={isSubscribing}
                >
                  {isSubscribing ? 'Cancelando...' : 'Cancelar inscrição'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Dedicado de Histórico Completo de Reprodução */}
        {showFullHistoryModal && (
          <div className={styles.historyModalBackdrop} onClick={() => setShowFullHistoryModal(false)}>
            <div className={styles.historyModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.historyModalHeader}>
                <div>
                  <div className={styles.historyModalTitleRow}>
                    <Clock size={20} className={styles.historyModalIcon} />
                    <h3 className={styles.historyModalTitle}>Histórico de Reprodução</h3>
                    <span className={styles.historyDurationBadge}>Linha do tempo</span>
                  </div>
                  <span className={styles.historyModalSubtitle}>
                    {(() => {
                      const totalCount = (recentHistory || []).length;
                      return `${totalCount} ${totalCount === 1 ? 'reprodução registrada no histórico' : 'reproduções registradas no histórico'}`;
                    })()}
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.historyModalCloseBtn}
                  onClick={() => setShowFullHistoryModal(false)}
                  title="Fechar histórico"
                  aria-label="Fechar histórico"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Barra de Busca rápida no Histórico */}
              <div className={styles.historySearchBox}>
                <Search size={15} className={styles.historySearchIcon} />
                <input
                  type="text"
                  placeholder="Pesquisar nas faixas escutadas..."
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  className={styles.historySearchInput}
                />
                {historySearchTerm && (
                  <button
                    type="button"
                    className={styles.historySearchClearBtn}
                    onClick={() => setHistorySearchTerm('')}
                    title="Limpar busca"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Tabela / Lista compacta de faixas */}
              <div className={styles.historyModalBody}>
                {(() => {
                  const rawList = (recentHistory && recentHistory.length > 0)
                    ? recentHistory
                    : (lastTrack ? [lastTrack] : []);
                  const displayList = rawList;

                  const filtered = historySearchTerm.trim()
                    ? displayList.filter(t => {
                        const q = historySearchTerm.trim().toLowerCase();
                        return (t.title && t.title.toLowerCase().includes(q)) ||
                               (t.artist && t.artist.toLowerCase().includes(q)) ||
                               (t.album && t.album.toLowerCase().includes(q));
                      })
                    : displayList;

                  if (filtered.length === 0) {
                    return (
                      <div className={styles.historyEmptyState}>
                        <Headphones size={40} className={styles.historyEmptyIcon} />
                        <p className={styles.historyEmptyTitle}>
                          {historySearchTerm ? 'Nenhuma faixa encontrada para esta busca' : 'Nenhuma música no histórico ainda'}
                        </p>
                        <span className={styles.historyEmptySubtitle}>
                          {historySearchTerm ? 'Tente buscar por outro termo ou nome de artista.' : 'As músicas que você escutar aparecerão listadas aqui em ordem cronológica.'}
                        </span>
                      </div>
                    );
                  }

                  const paginated = filtered.slice(0, historyVisibleCount);

                  return (
                    <>
                      <div className={styles.historyTable}>
                        <div className={styles.historyTableHeader}>
                          <span className={styles.historyColNum}>#</span>
                          <span className={styles.historyColTitle}>Título</span>
                          <span className={styles.historyColAlbum}>Álbum</span>
                          <span className={styles.historyColDate}>Quando</span>
                          <span className={styles.historyColDuration}>Duração</span>
                        </div>

                        <div className={styles.historyTableRows}>
                          {paginated.map((track, idx) => {
                            const isCurrent = (currentTrack?.id && track.id && String(currentTrack.id) === String(track.id)) ||
                                              (currentTrack?.title && track.title && currentTrack.title.trim().toLowerCase() === track.title.trim().toLowerCase());

                            return (
                              <div
                                key={track.historyId ? `hist-${track.historyId}` : `${track.id || track.title}-${track.playedAt || idx}-${idx}`}
                                className={`${styles.historyTableRow} ${isCurrent ? styles.historyTableRowActive : ''}`}
                                onClick={() => playTrack(track)}
                                title={`Tocar ${track.title} - ${track.artist}`}
                              >
                                <div className={styles.historyColNum}>
                                  <span className={styles.historyTrackIndex}>{idx + 1}</span>
                                  <div className={styles.historyRowPlayIcon}>
                                    {isCurrent && isPlaying ? (
                                      <Pause size={14} fill="#3ea6ff" color="#3ea6ff" />
                                    ) : (
                                      <Play size={14} fill="#ffffff" color="#ffffff" style={{ marginLeft: 2 }} />
                                    )}
                                  </div>
                                </div>

                                <div className={styles.historyColTitle}>
                                  <img
                                    src={getSafeCover(track)}
                                    alt={track.title}
                                    className={styles.historyTrackCover}
                                    referrerPolicy="no-referrer"
                                    onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
                                  />
                                  <div className={styles.historyTrackText}>
                                    <div className={styles.historyTitleWrapper}>
                                      {idx === 0 && <span className={styles.historyBadgeLatest}>Última</span>}
                                      <span className={`${styles.historyTrackName} ${isCurrent ? styles.historyTrackNameActive : ''}`}>
                                        {track.title}
                                      </span>
                                    </div>
                                    <span className={styles.historyTrackArtist}>{track.artist}</span>
                                  </div>
                                </div>

                                <div className={styles.historyColAlbum}>
                                  <span className={styles.historyAlbumText}>
                                    {track.album || 'Single'}
                                  </span>
                                </div>

                                <div className={styles.historyColDate}>
                                  <span className={styles.historyDateText}>
                                    {formatPlayedTime(track.playedAt)}
                                  </span>
                                </div>

                                <div className={styles.historyColDuration}>
                                  <span className={styles.historyDurationText}>
                                    {track.duration || (track.durationSec ? `${Math.floor(track.durationSec / 60)}:${String(track.durationSec % 60).padStart(2, '0')}` : '--:--')}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {filtered.length > historyVisibleCount && (
                        <div className={styles.historyLoadMoreWrapper}>
                          <button
                            type="button"
                            className={styles.historyLoadMoreBtn}
                            onClick={() => setHistoryVisibleCount(prev => prev + 15)}
                          >
                            <span>Carregar mais faixas ({filtered.length - historyVisibleCount} restantes)</span>
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Backdrop para fechar o menu de contexto de 3 pontinhos */}
        {activeTrackMenu && (
          <div
            className={styles.contextMenuBackdrop}
            onClick={() => setActiveTrackMenu(null)}
          />
        )}

        {/* Menu de contexto flutuante da música */}
        {activeTrackMenu && (
          <div
            className={styles.trackContextMenu}
            style={{
              top: activeTrackMenu.y,
              left: activeTrackMenu.x
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.trackContextMenuHeader}>
              <img
                src={activeTrackMenu.track.cover || activeTrackMenu.track.cover_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'}
                alt={activeTrackMenu.track.title}
                className={styles.trackContextMenuThumb}
                onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png'; }}
              />
              <div className={styles.trackContextMenuMeta}>
                <span className={styles.trackContextMenuTitle}>{activeTrackMenu.track.title}</span>
                <span className={styles.trackContextMenuArtist}>{activeTrackMenu.track.artist}</span>
              </div>
            </div>
            <div className={styles.trackContextMenuDivider} />
            <button
              type="button"
              className={styles.trackContextMenuItem}
              onClick={() => {
                const t = activeTrackMenu.track;
                setActiveTrackMenu(null);
                addToQueue(t);
              }}
            >
              <ListMusic size={16} color="#3ea6ff" />
              <span>Adicionar à fila</span>
            </button>
          </div>
        )}

        {/* Toast flutuante de feedback da fila */}
        {queueToast && (
          <div className={styles.queueToast}>
            <ListMusic size={16} />
            <span>{queueToast}</span>
          </div>
        )}

      </div>
    </>
  );
}
