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
  Radio, X, PlayCircle, ListMusic, Building2, ChevronDown, CheckCircle2
} from 'lucide-react';
import styles from '../styles/home.module.css';

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
    cover: 'https://cdn-images.dzcdn.net/images/cover/0d571082af7c78114321031d7f84d331/500x500-000000-80-0-0.jpg',
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

export default function HomeUnifiedYouTubeMusic() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPill, setSelectedPill] = useState('Energia');
  const [tracks, setTracks] = useState(HOME_ESCOLHA_A_DEDO);
  const [showAllTopTracks, setShowAllTopTracks] = useState(false);
  const [albums, setAlbums] = useState(JUSTIN_ALBUMS);
  const [singles, setSingles] = useState(JUSTIN_SINGLES);
  const [appearsOn, setAppearsOn] = useState([]);

  // Multi-Base / Empresas (Gravadoras com estoque próprio de músicas)
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [companyTracks, setCompanyTracks] = useState([]);
  const [isCompanyLoading, setIsCompanyLoading] = useState(false);
  const [purchaseNotice, setPurchaseNotice] = useState(null);
  const companyDropdownRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/api/companies`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setCompanies(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target)) {
        setShowCompanyDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCompany = async (company) => {
    setSelectedCompany(company);
    setShowCompanyDropdown(false);
    if (!company) {
      setCompanyTracks([]);
      return;
    }
    setIsCompanyLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/companies/${company.id}/tracks`);
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
    if (!track || !selectedCompany) return;
    try {
      const res = await fetch(`${API_URL}/api/companies/${selectedCompany.id}/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: track.dbTrackId || track.id, userId: user?.id || 1 })
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
              availableForRent: data.remainingStock > 0
            };
          }
          return t;
        }));
        setPurchaseNotice({
          type: 'success',
          text: `${type === 'buy' ? 'Compra' : 'Aluguel'} de "${track.title}" realizado com sucesso! Restam ${data.remainingStock} unidades no estoque da ${selectedCompany.name}.`
        });
        setTimeout(() => setPurchaseNotice(null), 5500);
      } else {
        setPurchaseNotice({
          type: 'error',
          text: data.error || 'Não foi possível processar a transação.'
        });
        setTimeout(() => setPurchaseNotice(null), 5500);
      }
    } catch (err) {
      console.error('Erro na compra:', err);
    }
  };

  // View Mode: 'home' (Tela de Início YouTube Music) | 'artist' (Perfil) | 'search' (Resultados) | 'album' (Álbum dedicado)
  const [viewMode, setViewMode] = useState('home');
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumTracks, setAlbumTracks] = useState([]);
  const [relatedAlbums, setRelatedAlbums] = useState([]);
  const [isAlbumLoading, setIsAlbumLoading] = useState(false);
  const [activeArtist, setActiveArtist] = useState(null);
  const [searchArtists, setSearchArtists] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);

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

      // 2. Músicas reais e artista correspondentes pesquisados no catálogo
      fetch(`${API_URL}/api/music/search?q=${encodeURIComponent(searchQuery)}`, { signal })
        .then(r => r.json())
        .then(d => {
          if (!isMounted) return;
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
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [likedMap, setLikedMap] = useState({});
  const [activeTab, setActiveTab] = useState('inicio');
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [smartQueue, setSmartQueue] = useState([]);
  const [queueSource, setQueueSource] = useState('');

  // Fila de reprodução dinâmica das faixas seguintes
  const upcomingQueue = useMemo(() => {
    if (!currentTrack) return [];
    const pool = (tracks && tracks.length > 0) ? tracks : HOME_ESCOLHA_A_DEDO;
    const currentIndex = pool.findIndex(t => t.id === currentTrack.id || (t.title && t.title.toLowerCase() === currentTrack.title?.toLowerCase()));
    if (currentIndex >= 0 && currentIndex < pool.length - 1) {
      return pool.slice(currentIndex + 1);
    }
    const filtered = pool.filter(t => t.id !== currentTrack.id && t.title !== currentTrack.title);
    return filtered.slice(0, 15);
  }, [currentTrack, tracks]);

  const displayQueue = useMemo(() => {
    if (smartQueue && smartQueue.length > 0) return smartQueue;
    return upcomingQueue;
  }, [smartQueue, upcomingQueue]);

  // Histórico de músicas ouvidas (Estilo Spotify - Lembra última música e ouvidas recentemente)
  const [lastTrack, setLastTrack] = useState(null);
  const [recentHistory, setRecentHistory] = useState([]);

  useEffect(() => {
    try {
      const storedLast = localStorage.getItem('devsongs_last_track');
      const storedHistory = localStorage.getItem('devsongs_recent_history');
      if (storedLast) {
        const parsed = JSON.parse(storedLast);
        setLastTrack(parsed);
        // Deixa o player preparado na barra inferior com a última música, pausada, exatamente igual ao Spotify!
        setCurrentTrack(parsed);
        setDuration(parsed.durationSec || 214);

        // Preenche a rádio inteligente inicial baseada no artista da última música ouvida e histórico
        try {
          const histArr = storedHistory ? JSON.parse(storedHistory) : [];
          const histParam = histArr.map(t => t.artist).slice(0, 8).join(',');
          fetch(`${API_URL}/api/music/smart-queue?artist=${encodeURIComponent(parsed.artist)}&title=${encodeURIComponent(parsed.title)}&history=${encodeURIComponent(histParam)}`)
            .then(r => r.json())
            .then(data => {
              if (data && data.tracks && data.tracks.length > 0) {
                setSmartQueue(data.tracks);
                setQueueSource(data.source || `Rádio de ${parsed.artist}`);
              }
            })
            .catch(() => {});
        } catch (_) {}
      }
      if (storedHistory) {
        setRecentHistory(JSON.parse(storedHistory));
      } else if (storedLast) {
        setRecentHistory([JSON.parse(storedLast)]);
      }
    } catch (_) {}
  }, []);

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
  const progressTimerRef = useRef(null);
  const pillsBarRef = useRef(null);
  const albumsRowRef = useRef(null);
  const singlesRowRef = useRef(null);
  const appearsOnRowRef = useRef(null);
  const albunsScrollRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchFilterBarRef = useRef(null);
  const isClosingRef = useRef(false);
  const currentTrackRef = useRef(null);
  const mainContentRef = useRef(null);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

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
    if (!query) return;
    setIsSearching(true);
    try {
      const qLower = (query || '').toLowerCase().trim();
      if (qLower === 'justin bieber') {
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

      if (qLower === 'bk' || qLower === "bk'") {
        setTracks(BK_TOP_TRACKS);
        setAlbums(BK_ALBUMS);
        setSingles(BK_SINGLES);
        setActiveArtist({
          id: 'bk',
          name: 'BK',
          listeners: '9,31 mi ouvintes mensais',
          bio: "Uma das vozes mais contundentes dentro do rap nacional, Abebe Bikila, mais conhecido como BK', é um rapper carioca que carrega em suas rimas as vivências de um corpo negro dentro das grandes...",
          bannerImg: '/img/bk_banner.jpg',
          avatarImg: '/img/bk_avatar.png',
          subscribers: '1,25 mi'
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
    if (!track) return;
    isClosingRef.current = false;
    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(track.durationSec || 214);
    setLastTrack(track);

    // Salva no histórico de ouvidas recentemente (Estilo Spotify)
    try {
      localStorage.setItem('devsongs_last_track', JSON.stringify(track));
      setRecentHistory(prev => {
        const filtered = (prev || []).filter(t => t.id !== track.id && t.title !== track.title);
        const updated = [track, ...filtered].slice(0, 6);
        localStorage.setItem('devsongs_recent_history', JSON.stringify(updated));
        return updated;
      });
    } catch (_) {}

    // Dispara a busca inteligente da Rádio de Afinidade / Gosto do Usuário (Smart Queue)
    try {
      const histParam = (recentHistory || []).map(t => t.artist).slice(0, 8).join(',');
      fetch(`${API_URL}/api/music/smart-queue?artist=${encodeURIComponent(track.artist)}&title=${encodeURIComponent(track.title)}&history=${encodeURIComponent(histParam)}`)
        .then(r => r.json())
        .then(data => {
          if (data && data.tracks && data.tracks.length > 0) {
            setSmartQueue(data.tracks);
            setQueueSource(data.source || `Rádio de ${track.artist}`);
          }
        })
        .catch(() => {});
    } catch (_) {}

    try {
      const searchParams = new URLSearchParams({
        title: track.title || '',
        artist: track.artist || '',
        album: (track.album && track.album !== 'Single' && track.album !== track.title) ? track.album : '',
        q: `${track.artist || ''} ${track.title || ''} ${(track.album && track.album !== 'Single' && track.album !== track.title) ? track.album : ''}`.trim()
      });
      const res = await fetch(`${API_URL}/api/youtube/search?${searchParams.toString()}`);
      const data = await res.json();

      if (data && data.videoId) {
        setActiveVideoId(data.videoId);
        if (audioFallbackRef.current) {
          audioFallbackRef.current.pause();
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
        }
      } else {
        // Se não encontrar no YouTube, toca o preview oficial da própria música no Deezer (nunca música aleatória de outro artista)
        setActiveVideoId(null);
        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
          ytPlayerRef.current.pauseVideo();
        }
        if (audioFallbackRef.current && track.preview) {
          audioFallbackRef.current.src = track.preview;
          audioFallbackRef.current.play().catch(() => {});
        }
      }
    } catch (err) {
      console.warn('Erro ao buscar YouTube, usando áudio da faixa:', err);
      setActiveVideoId(null);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        ytPlayerRef.current.pauseVideo();
      }
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

    // 1. Prioriza avançar na Fila Inteligente (Rádio do Artista & Gosto do Usuário)
    if (smartQueue && smartQueue.length > 0) {
      const nextTrack = smartQueue[0];
      setSmartQueue(prev => prev.slice(1));
      playTrack(nextTrack);
      return;
    }

    // 2. Fallback para lista de faixas do contexto atual
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
    if (!artistName) return;
    setViewMode('artist');
    setSelectedAlbum(null);
    setShowSuggestions(false);
    setSidebarOpen(false);

    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    const aLower = artistName.toLowerCase().trim();
    if (aLower === 'justin bieber') {
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
      setAppearsOn([]);
    } else if (aLower === 'bk' || aLower === "bk'") {
      setActiveArtist({
        id: 'bk',
        name: 'BK',
        listeners: '9,31 mi ouvintes mensais',
        bio: "Uma das vozes mais contundentes dentro do rap nacional, Abebe Bikila, mais conhecido como BK', é um rapper carioca que carrega em suas rimas as vivências de um corpo negro dentro das grandes...",
        bannerImg: '/img/bk_banner.jpg',
        avatarImg: '/img/bk_avatar.png',
        subscribers: '1,25 mi'
      });
      setTracks(BK_TOP_TRACKS);
      setAlbums(BK_ALBUMS);
      setSingles(BK_SINGLES);
      setAppearsOn([]);
    } else {
      fetchArtistTracks(artistName);
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
    if (qLower === 'bk' || qLower === "bk'" || qLower.startsWith('bk ')) {
      setTracks(BK_TOP_TRACKS);
      setAlbums(BK_ALBUMS);
      setSingles(BK_SINGLES);
      const bkObj = {
        id: 'bk',
        name: 'BK',
        listeners: '9,31 mi ouvintes mensais',
        bio: "Uma das vozes mais contundentes dentro do rap nacional, Abebe Bikila, mais conhecido como BK', é um rapper carioca que carrega em suas rimas as vivências de um corpo negro dentro das grandes...",
        bannerImg: '/img/bk_banner.jpg',
        avatarImg: '/img/bk_avatar.png',
        subscribers: '1,25 mi'
      };
      setActiveArtist(bkObj);
      setSearchArtists([bkObj]);
      setIsSearching(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/music/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data && data.artist) {
        setActiveArtist(data.artist);
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
  const handleSelectAlbum = async (album) => {
    try {
      setIsSearching(true);
      setIsAlbumLoading(true);
      setSelectedAlbum(album);
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
        setSelectedAlbum(data.album);
      }
      if (data && data.relatedAlbums && data.relatedAlbums.length > 0) {
        setRelatedAlbums(data.relatedAlbums);
      } else {
        const pool = (albums && albums.length > 0) ? albums : HOME_ALBUNS_EM_ALTA;
        setRelatedAlbums(pool.filter(a => a.id !== (data?.album?.id || album.id)).slice(0, 8));
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
              onClick={() => {
                setActiveTab('inicio');
                setViewMode('home');
                setSelectedAlbum(null);
              }}
              style={{ cursor: 'pointer' }}
              title="Ir para página inicial DevSongs"
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
            {/* Seletor de Base / Empresa (Multi-Base) */}
            <div className={styles.baseSelectorWrap} ref={companyDropdownRef}>
              <button
                type="button"
                className={`${styles.baseSelectorBtn} ${selectedCompany ? styles.baseSelectorBtnActive : ''}`}
                onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                title="Alternar entre Bases / Empresas"
              >
                <Building2 size={16} />
                <span>{selectedCompany ? selectedCompany.name : 'Todas as Bases'}</span>
                <ChevronDown size={14} />
              </button>

              {showCompanyDropdown && (
                <div className={styles.baseDropdown}>
                  <div className={styles.baseDropdownHeader}>
                    <span>Bases & Gravadoras Parceiras</span>
                  </div>

                  <button
                    type="button"
                    className={`${styles.baseDropdownItem} ${!selectedCompany ? styles.baseDropdownItemActive : ''}`}
                    onClick={() => handleSelectCompany(null)}
                  >
                    <div className={styles.baseItemIconGlobal}>🌐</div>
                    <div className={styles.baseItemMeta}>
                      <span className={styles.baseItemTitle}>Todas as Bases (Global)</span>
                      <span className={styles.baseItemSub}>Catálogo geral aberto</span>
                    </div>
                  </button>

                  {companies.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`${styles.baseDropdownItem} ${selectedCompany?.id === c.id ? styles.baseDropdownItemActive : ''}`}
                      onClick={() => handleSelectCompany(c)}
                    >
                      <img
                        src={c.logo_url || '/img/logo-devsongs.png'}
                        alt={c.name}
                        className={styles.baseItemThumb}
                        onError={(e) => { e.currentTarget.src = '/img/logo-devsongs.png'; }}
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

        {/* ─── CORPO: SIDEBAR À ESQUERDA + CONTEÚDO PRINCIPAL À DIREITA ─── */}
        <div className={styles.appBody}>
          <aside
            className={`${styles.sidebar} ${!sidebarOpen ? styles.sidebarCollapsed : styles.sidebarOpen} ${viewMode === 'artist' ? styles.sidebarArtist : ''}`}
          >
            <nav className={styles.navSection}>
              <button
                onClick={() => {
                  setActiveTab('inicio');
                  setViewMode('home');
                  setSelectedAlbum(null);
                }}
                className={`${styles.navItem} ${viewMode === 'home' ? styles.navItemActive : ''}`}
                title="Início"
              >
                <Home size={22} />
                <span>Início</span>
              </button>
              <button
                onClick={() => {
                  openArtistProfile('BK');
                }}
                className={`${styles.navItem} ${viewMode === 'artist' ? styles.navItemActive : ''}`}
                title="Explorar"
              >
                <Compass size={22} />
                <span>Explorar</span>
              </button>
              <button
                onClick={() => setActiveTab('biblioteca')}
                className={`${styles.navItem} ${activeTab === 'biblioteca' ? styles.navItemActive : ''}`}
                title="Biblioteca"
              >
                <Bookmark size={22} />
                <span>Biblioteca</span>
              </button>
              <button
                onClick={() => setActiveTab('upgrade')}
                className={`${styles.navItem} ${activeTab === 'upgrade' ? styles.navItemActive : ''}`}
                title="Upgrade"
              >
                <PlayCircle size={22} />
                <span>Upgrade</span>
              </button>
            </nav>

            {sidebarOpen && (
              <>
                <div className={styles.sidebarDivider} />

                {/* Botão + Nova Playlist (Foto 1) */}
                <button className={styles.newPlaylistBtn} onClick={() => alert('Criar nova playlist')}>
                  <Plus size={18} />
                  <span>Nova playlist</span>
                </button>

                <div className={styles.autoPlaylistSection}>
                  <div className={styles.autoPlaylistTitle}>Episódios para mais tarde</div>
                  <div className={styles.autoPlaylistSub}>Playlist automática</div>
                </div>
              </>
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

              {/* Seletor de Base Específica: Hero e Catálogo de Estoque Exclusivo */}
              {selectedCompany ? (
                <section className={styles.companyHeroSection}>
                  <div className={styles.companyHeroCard}>
                    <img
                      src={selectedCompany.logo_url || '/img/logo-devsongs.png'}
                      alt={selectedCompany.name}
                      className={styles.companyHeroLogo}
                      onError={(e) => { e.currentTarget.src = '/img/logo-devsongs.png'; }}
                    />
                    <div className={styles.companyHeroContent}>
                      <div className={styles.companyBadgeRow}>
                        <span className={styles.companyBadgeTag}>Base Ativa</span>
                        <span className={styles.companyGenreTag}>{selectedCompany.genre}</span>
                        <span className={styles.companyCityTag}>{selectedCompany.city} - {selectedCompany.state}</span>
                      </div>
                      <h1 className={styles.companyHeroTitle}>{selectedCompany.name}</h1>
                      <p className={styles.companyHeroDesc}>{selectedCompany.description}</p>
                      <div className={styles.companyStatsRow}>
                        <span>Estoque total da base: <strong>{selectedCompany.total_stock || 0} unidades</strong></span>
                        <span>•</span>
                        <span>Músicas exclusivas: <strong>{companyTracks.length} faixas</strong></span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={styles.btnVoltarGlobal}
                      onClick={() => handleSelectCompany(null)}
                      title="Voltar para todas as bases"
                    >
                      Ver Catálogo Global
                    </button>
                  </div>

                  {/* Lista de músicas com Estoque e Preços dessa Base */}
                  <div className={styles.companyTracksSection}>
                    <div className={styles.homeSectionHeader}>
                      <div>
                        <h2 className={styles.homeSectionTitle}>Músicas e Estoque desta Base</h2>
                        <span className={styles.recentSectionSub}>
                          Exclusivo da {selectedCompany.name} • Compre ou alugue com baixa direta de estoque
                        </span>
                      </div>
                    </div>

                    {isCompanyLoading ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#a7a7a7' }}>Carregando estoque da base...</div>
                    ) : companyTracks.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#a7a7a7' }}>Nenhuma música disponível no estoque desta base no momento.</div>
                    ) : (
                      <div className={styles.companyTracksGrid}>
                        {companyTracks.map((track) => {
                          const isCurrent = currentTrack?.id === track.id || currentTrack?.title === track.title;
                          return (
                            <div
                              key={track.id}
                              className={`${styles.companyTrackCard} ${isCurrent ? styles.companyTrackCardActive : ''}`}
                            >
                              <div className={styles.companyTrackCoverWrap} onClick={() => playTrack(track)}>
                                <img
                                  src={track.cover || '/img/logo-devsongs.png'}
                                  alt={track.title}
                                  className={styles.companyTrackCover}
                                  onError={(e) => { e.currentTarget.src = '/img/logo-devsongs.png'; }}
                                />
                                <div className={styles.companyTrackPlayOverlay}>
                                  {isCurrent && isPlaying ? (
                                    <Pause size={22} fill="#ffffff" color="#ffffff" />
                                  ) : (
                                    <Play size={22} fill="#ffffff" color="#ffffff" style={{ marginLeft: 2 }} />
                                  )}
                                </div>
                              </div>

                              <div className={styles.companyTrackInfo}>
                                <span className={styles.companyTrackTitle} title={track.title}>{track.title}</span>
                                <span className={styles.companyTrackArtist}>{track.artist}</span>
                                <span className={styles.companyTrackAlbum}>{track.album}</span>

                                <div className={styles.companyStockBadgeRow}>
                                  <span className={`${styles.stockBadge} ${track.stockQuantity <= 10 ? styles.stockBadgeLow : ''}`}>
                                    Estoque: {track.stockQuantity} un
                                  </span>
                                  {track.isExclusive && <span className={styles.exclusiveBadge}>Exclusivo</span>}
                                </div>

                                <div className={styles.companyTrackActionsRow}>
                                  <button
                                    type="button"
                                    className={styles.btnBuyTrack}
                                    disabled={!track.availableForSale}
                                    onClick={() => handleBuyCompanyTrack(track, 'buy')}
                                    title={`Comprar cópia por ${track.priceSale}`}
                                  >
                                    Comprar {track.priceSale}
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.btnRentTrack}
                                    disabled={!track.availableForRent}
                                    onClick={() => handleBuyCompanyTrack(track, 'rent')}
                                    title={`Alugar por 30 dias por ${track.priceRent}`}
                                  >
                                    Alugar {track.priceRent}
                                  </button>
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
                  {/* ─── CONTINUAR OUVINDO (Estilo Spotify - Últimas Músicas Ouvidas) ─── */}
                  {(() => {
                    const displayList = (recentHistory && recentHistory.length > 0)
                      ? recentHistory
                      : (lastTrack ? [lastTrack] : []);

                    if (displayList.length === 0) return null;

                    return (
                      <section className={styles.spotifyRecentSection}>
                    <div className={styles.homeSectionHeader}>
                      <div>
                        <h2 className={styles.homeSectionTitle}>Continuar ouvindo</h2>
                        <span className={styles.recentSectionSub}>Últimas músicas que você escutou</span>
                      </div>
                    </div>

                    <div className={styles.spotifyRecentGrid}>
                      {displayList.map((track, idx) => {
                        const isCurrent = currentTrack?.id === track.id || currentTrack?.title === track.title;
                        return (
                          <div
                            key={track.id || idx}
                            className={`${styles.spotifyRecentCard} ${isCurrent ? styles.spotifyRecentCardActive : ''}`}
                            onClick={() => playTrack(track)}
                            title={`Continuar ouvindo ${track.title}`}
                          >
                            <div className={styles.spotifyRecentCoverWrap}>
                              <img
                                src={track.cover || '/img/logo-devsongs.png'}
                                alt={track.title}
                                className={styles.spotifyRecentCover}
                                referrerPolicy="no-referrer"
                                onError={(e) => { e.currentTarget.src = '/img/logo-devsongs.png'; }}
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
                                <Pause size={20} fill="#030303" color="#030303" />
                              ) : (
                                <Play size={20} fill="#030303" color="#030303" style={{ marginLeft: 2 }} />
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
                        setTracks(HOME_ESCOLHA_A_DEDO);
                        playTrack(HOME_ESCOLHA_A_DEDO[0]);
                      }}
                      title="Tocar todas as 12 faixas de Escolha a dedo"
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
                  {HOME_ESCOLHA_A_DEDO.map((item) => {
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
                          playTrack(item);
                        }}
                        title={`Tocar ${item.title} - ${item.artist}`}
                      >
                        <div className={styles.escolhaDedoThumbWrap}>
                          <img
                            src={item.cover}
                            alt={item.title}
                            className={styles.escolhaDedoThumb}
                            referrerPolicy="no-referrer"
                            onError={(e) => { e.currentTarget.src = '/img/logo-devsongs.png'; }}
                          />
                          <div className={styles.escolhaDedoPlayOverlay}>
                            {isCurrent && isPlaying ? (
                              <Pause size={18} fill="#ffffff" color="#ffffff" />
                            ) : (
                              <Play size={18} fill="#ffffff" color="#ffffff" style={{ marginLeft: 2 }} />
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
                  {HOME_ALBUNS_PARA_VOCE.map((album) => (
                    <div
                      key={album.id}
                      className={styles.albumCard}
                      onClick={() => handleSelectAlbum(album)}
                      title={`Abrir álbum ${album.title} - ${album.artist}`}
                    >
                      <div className={styles.albumCardCoverWrap}>
                        <img
                          src={album.cover}
                          alt={album.title}
                          className={styles.albumCardCover}
                          referrerPolicy="no-referrer"
                          onError={(e) => { e.currentTarget.src = '/img/logo-devsongs.png'; }}
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
          ) : viewMode === 'album' && selectedAlbum ? (
            /* ─── TELA DO ÁLBUM ESTILO YOUTUBE MUSIC (Foto do Usuário) ─── */
            <div className={styles.albumViewWrapper}>
              {/* Fundo Dinâmico com Aura / Ambient Glow da capa do Álbum (Estilo YouTube Music & Spotify) */}
              <div className={styles.albumAmbientBackdrop} aria-hidden="true">
                <div
                  className={styles.albumAmbientGlow}
                  style={{ backgroundImage: `url('${selectedAlbum.cover || '/img/logo-devsongs.png'}')` }}
                />
                <div className={styles.albumAmbientGradientOverlay} />
              </div>

              <div className={styles.albumViewContainer}>
                {/* Coluna Esquerda: Mini Artista, Cover HD, Título, Estatísticas e Ações */}
                <div className={styles.albumHeroColumn}>
                  <div
                    className={styles.albumArtistRow}
                    onClick={() => openArtistProfile(selectedAlbum.artistName || activeArtist?.name)}
                    title={`Voltar ao perfil de ${selectedAlbum.artistName || activeArtist?.name}`}
                  >
                    <img
                      src={selectedAlbum.artistAvatar || activeArtist?.avatarImg || '/img/logo-devsongs.png'}
                      alt={selectedAlbum.artistName || activeArtist?.name}
                      className={styles.albumArtistMiniAvatar}
                      referrerPolicy="no-referrer"
                      onError={(e) => { e.currentTarget.src = '/img/logo-devsongs.png'; }}
                    />
                    <span>{selectedAlbum.artistName || activeArtist?.name}</span>
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
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Seção Sugestões de Álbuns do Mesmo Tipo / Artista */}
              {relatedAlbums && relatedAlbums.length > 0 && (
                <section className={styles.relatedAlbumsSection}>
                  <h2 className={styles.relatedAlbumsHeading}>Outros álbuns que você pode gostar</h2>
                  <div className={styles.relatedAlbumsGrid}>
                    {relatedAlbums.map((alb) => (
                      <div
                        key={alb.id}
                        className={styles.relatedAlbumCard}
                        onClick={() => handleSelectAlbum(alb)}
                        title={`Ouvir ${alb.title} - ${alb.artist}`}
                      >
                        <div className={styles.relatedAlbumCoverWrap}>
                          <img
                            src={alb.cover || '/img/logo-devsongs.png'}
                            alt={alb.title}
                            className={styles.relatedAlbumCover}
                            referrerPolicy="no-referrer"
                            onError={(e) => { e.currentTarget.src = '/img/logo-devsongs.png'; }}
                          />
                          <div className={styles.relatedAlbumPlayHover}>
                            <Play size={20} fill="#ffffff" color="#ffffff" style={{ marginLeft: 2 }} />
                          </div>
                        </div>
                        <span className={styles.relatedAlbumTitle}>{alb.title}</span>
                        <span className={styles.relatedAlbumMeta}>
                          Álbum • {alb.artist} {alb.year ? `• ${alb.year}` : ''}
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
                      onClick={() => openArtistProfile(art.name)}
                      title={`Abrir perfil de ${art.name}`}
                    >
                      <img
                        src={art.avatarImg || art.bannerImg || '/img/logo-devsongs.png'}
                        alt={art.name}
                        className={styles.searchArtistCardAvatar}
                        referrerPolicy="no-referrer"
                        onError={(e) => { e.currentTarget.src = '/img/logo-devsongs.png'; }}
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
                            src={album.cover || '/img/logo-devsongs.png'}
                            alt={album.title}
                            className={styles.coverImage}
                            referrerPolicy="no-referrer"
                            onError={(e) => { e.currentTarget.src = '/img/logo-devsongs.png'; }}
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
                            onClick={() => openArtistProfile(activeArtist.name)}
                            title={`Abrir perfil do artista ${activeArtist.name}`}
                          >
                            <ChevronRight size={18} className={styles.artistCardChevronIcon} />
                            <img
                              src={activeArtist.avatarImg || '/img/logo-devsongs.png'}
                              alt={activeArtist.name}
                              className={styles.artistAvatarImage}
                              referrerPolicy="no-referrer"
                              onError={(e) => { e.currentTarget.src = '/img/logo-devsongs.png'; }}
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
                      ) : tracks.length > 0 ? (
                        /* ─── CARD DE MELHOR RESULTADO QUANDO FOR UMA MÚSICA ─── */
                        <div className={styles.searchHeroSplitCard}>
                          <div
                            className={styles.searchHeroSongCard}
                            onClick={() => playTrack(tracks[0])}
                            title={`Reproduzir ${tracks[0].title}`}
                          >
                            <span className={styles.topResultTag}>Melhor resultado</span>
                            <div className={styles.songCardCoverWrap}>
                              <img
                                src={tracks[0].cover || '/img/logo-devsongs.png'}
                                alt={tracks[0].title}
                                className={styles.songCardCover}
                                referrerPolicy="no-referrer"
                                onError={(e) => { e.currentTarget.src = '/img/logo-devsongs.png'; }}
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
                                      Música • {track.artist} • {track.duration || '3:30'}
                                    </span>
                                  </div>
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
                style={{ backgroundImage: `url('${activeArtist?.bannerImg || '/img/artist_banner_justin.jpg'}')` }}
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
                      className={styles.btnSubscribe}
                      onClick={() => alert('Inscrição confirmada!')}
                    >
                      <span>Inscrever-se {activeArtist?.subscribers || '78,6 mi'}</span>
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
                {albums && albums.length > 0 && (
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
                )}

                {/* ─── SEÇÃO SINGLES E EPs (Foto 3) ──────────────────── */}
                {singles && singles.length > 0 && (
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
                              src={feat.cover || '/img/logo-devsongs.png'}
                              alt={feat.title}
                              className={styles.mediaCover}
                              referrerPolicy="no-referrer"
                              onError={(e) => { e.currentTarget.src = '/img/logo-devsongs.png'; }}
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



        {/* Backdrop escuro quando o vídeo está em Modo Cinema Expandido */}
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
              <h3 className={styles.queueTitle}>Fila</h3>
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
                      src={currentTrack.cover || '/img/logo-devsongs.png'}
                      alt={currentTrack.title}
                      className={styles.queueCurrentCover}
                      referrerPolicy="no-referrer"
                      onError={(e) => { e.currentTarget.src = '/img/logo-devsongs.png'; }}
                    />
                    <div className={styles.queueCurrentMeta}>
                      <span className={styles.queueCurrentTitle}>{currentTrack.title}</span>
                      <span className={styles.queueCurrentArtist}>{currentTrack.artist}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Seção 2: Próximas de: */}
              <div className={styles.queueSection}>
                <div className={styles.queueSectionTitle}>
                  Próximas de:{' '}
                  <span className={styles.queueSectionSub}>
                    {queueSource || selectedAlbum?.title || activeArtist?.name || 'Rádio da Faixa'}
                  </span>
                </div>

                {displayQueue && displayQueue.length > 0 ? (
                  <div className={styles.queueList}>
                    {displayQueue.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className={styles.queueTrackItem}
                        onClick={() => {
                          if (smartQueue.length > 0) {
                            setSmartQueue(prev => prev.filter((_, i) => i > idx));
                          }
                          playTrack(item);
                        }}
                        title={`Tocar agora: ${item.title} - ${item.artist}`}
                      >
                        <div className={styles.queueTrackCoverWrap}>
                          <img
                            src={item.cover || '/img/logo-devsongs.png'}
                            alt={item.title}
                            className={styles.queueTrackCover}
                            referrerPolicy="no-referrer"
                            onError={(e) => { e.currentTarget.src = '/img/logo-devsongs.png'; }}
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.queueEmptyState}>
                    <span>Nenhuma música seguinte na fila.</span>
                  </div>
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
                style={{ width: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%` }}
              >
                <div className={styles.topProgressBarThumb} />
              </div>
            </div>

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
            </div>

            {/* Player Center: Controls em linha única */}
            <div className={styles.playerCenter}>
              <button
                type="button"
                onClick={() => setIsShuffle(!isShuffle)}
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
              <span className={styles.timeDisplay}>
                {formatSeconds(currentTime)} / {formatSeconds(duration)}
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

      </div>
    </>
  );
}
