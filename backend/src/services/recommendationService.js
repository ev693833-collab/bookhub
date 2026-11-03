const path = require('path');
const fs = require('fs');
const libraryStorage = require('./libraryStorage');

const DATA_DIR = path.join(__dirname, '../../data');
const ALBUMS_FILE = path.join(DATA_DIR, 'albums.json');
const TRACKS_FILE = path.join(DATA_DIR, 'company_tracks.json');

// Mapeamento de clusters de afinidade e estilos musicais
const MUSIC_CLUSTERS = [
  {
    genre: 'Rap & Trap Nacional',
    related: [
      'BK', 'Baco Exu do Blues', 'Djonga', 'Matuê', 'Teto', 'WIU',
      'Veigh', 'KayBlack', 'MC Cabelinho', 'Filipe Ret', 'L7NNON',
      'Brandão85', 'Jovem Dex', 'Leviano', 'Alee', 'MC GP', 'Orochi',
      'Tz da Coronel', 'Major RD', 'Yago Oproprio', 'Matchola', '2ZDINIZ', 'Criolo'
    ]
  },
  {
    genre: 'Rock Nacional & MPB Clássica',
    related: [
      'Cazuza', 'Barão Vermelho', 'Legião Urbana', 'Djavan', 'Jorge Vercillo',
      'Titãs', 'Raul Seixas', 'Rita Lee', 'Engenheiros do Hawaii', 'Capital Inicial',
      'Paralamas do Sucesso', 'Cássia Eller', 'Nando Reis', 'Frejat', 'Lulu Santos'
    ]
  },
  {
    genre: 'Pop & R&B Internacional',
    related: [
      'Justin Bieber', 'The Weeknd', 'Bruno Mars', 'Shawn Mendes', 'Post Malone',
      'Daniel Caesar', 'Frank Ocean', 'Ed Sheeran', 'Dua Lipa', 'Harry Styles',
      'Billie Eilish', 'Charlie Puth', 'Maroon 5', 'SZA', 'Steve Lacy'
    ]
  },
  {
    genre: 'Hip-Hop & R&B US',
    related: [
      'Kendrick Lamar', 'Travis Scott', 'Drake', 'Tyler, The Creator', 'J. Cole',
      'A$AP Rocky', 'Kanye West', 'Mac Miller', 'Childish Gambino', '50 Cent', 'Akon', 'Eminem'
    ]
  },
  {
    genre: 'Piseiro & Forró',
    related: [
      'Pricila areba', 'Priscila Areba', 'Forrozão Tropykália', 'João Gomes', 'Zé Vaqueiro', 'Tarcísio do Acordeon'
    ]
  }
];

// Catálogo curado e diversificado para novos usuários (sem histórico)
const NEW_USER_SHOWCASE_TRACKS = [
  {
    id: 'rec-nu-1',
    title: 'Amanhecer',
    artist: 'BK, Nansy Silvwz e Gigantes',
    album: 'ICARUS',
    cover: 'https://cdn-images.dzcdn.net/images/cover/927397ea14b00eba92454a88ec4f352d/1000x1000-000000-80-0-0.jpg',
    genre: 'Rap',
    durationSec: 195,
    duration: '3:15',
    plays: '18 mi vezes'
  },
  {
    id: 'rec-nu-2',
    title: 'Girassóis de Van Gogh',
    artist: 'Baco Exu do Blues',
    album: 'Bluesman',
    cover: 'https://cdn-images.dzcdn.net/images/cover/0421054a6a7d8cb4e52dd27ff4deef2c/500x500-000000-80-0-0.jpg',
    genre: 'Rap & Trap Nacional',
    durationSec: 198,
    duration: '3:18',
    plays: '240 mi vezes'
  },
  {
    id: 'rec-nu-3',
    title: 'Procuro Alguém',
    artist: 'Djonga e Coyote Beat',
    album: 'Histórias da Minha Área',
    cover: 'https://cdn-images.dzcdn.net/images/cover/86427da38e1e93f57746964d3851f9fb/500x500-000000-80-0-0.jpg',
    genre: 'Rap & Trap Nacional',
    durationSec: 192,
    duration: '3:12',
    plays: '110 mi vezes'
  },
  {
    id: 'rec-nu-4',
    title: 'Flow Espacial',
    artist: 'Teto e Matuê',
    album: 'Flow Espacial - Single',
    cover: 'https://cdn-images.dzcdn.net/images/cover/6a607b99dfcb2dcd32f787ed0e11bf41/500x500-000000-80-0-0.jpg',
    genre: 'Trap',
    durationSec: 178,
    duration: '2:58',
    plays: '190 mi vezes'
  },
  {
    id: 'rec-nu-5',
    title: '100% MOLHO',
    artist: 'Brandão85, Jovem Dex, Leviano',
    album: 'ISSO É TRAP',
    cover: 'https://cdn-images.dzcdn.net/images/cover/823c311b28a72801b809da4d99c621f4/500x500-000000-80-0-0.jpg',
    genre: 'Trap',
    durationSec: 204,
    duration: '3:24',
    plays: '85 mi vezes'
  },
  {
    id: 'rec-nu-6',
    title: 'LUZ, CAMA E AÇÃO',
    artist: 'Alee, Mc Cabelinho e Qualy',
    album: 'CAOS DLX',
    cover: 'https://cdn-images.dzcdn.net/images/cover/6646c5f4c6b60b0ddd4f00987623437c/500x500-000000-80-0-0.jpg',
    genre: 'Trap',
    durationSec: 184,
    duration: '3:04',
    plays: '95 mi vezes'
  },
  {
    id: 'rec-nu-7',
    title: 'One Less Lonely Girl',
    artist: 'Justin Bieber',
    album: 'My World',
    cover: 'https://cdn-images.dzcdn.net/images/cover/a40e48bd5bae166186dc04c57efdae7a/500x500-000000-80-0-0.jpg',
    genre: 'Pop Internacional',
    durationSec: 229,
    duration: '3:49',
    plays: '648 mi vezes'
  },
  {
    id: 'rec-nu-8',
    title: 'Superpowers',
    artist: 'Daniel Caesar',
    album: 'NEVER ENOUGH',
    cover: 'https://cdn-images.dzcdn.net/images/cover/0d571082af7c78114321031d7f84d331/1000x1000-000000-80-0-0.jpg',
    genre: 'R&B Internacional',
    durationSec: 174,
    duration: '2:54',
    plays: '85 mi vezes'
  },
  {
    id: 'rec-nu-9',
    title: 'O Tempo Não Para',
    artist: 'Cazuza',
    album: 'O Tempo Não Para',
    cover: 'https://cdn-images.dzcdn.net/images/cover/0f61ba029f3a14618b64e32bc0fd1559/500x500-000000-80-0-0.jpg',
    genre: 'Rock Nacional & MPB Clássica',
    durationSec: 282,
    duration: '4:42',
    plays: '130 mi vezes'
  },
  {
    id: 'rec-nu-10',
    title: 'Se...',
    artist: 'Djavan',
    album: 'Coisa de Acender',
    cover: 'https://cdn-images.dzcdn.net/images/cover/9c20912f7f7754d1c0e334dbfb1731bb/500x500-000000-80-0-0.jpg',
    genre: 'MPB & Indie Brasil',
    durationSec: 290,
    duration: '4:50',
    plays: '175 mi vezes'
  },
  {
    id: 'rec-nu-11',
    title: 'Final Feliz',
    artist: 'Jorge Vercillo',
    album: 'Leve',
    cover: 'https://cdn-images.dzcdn.net/images/cover/919ea70f4fe87ed0455fb356813f49f8/500x500-000000-80-0-0.jpg',
    genre: 'MPB & Indie Brasil',
    durationSec: 260,
    duration: '4:20',
    plays: '65 mi vezes'
  },
  {
    id: 'rec-nu-12',
    title: 'M4',
    artist: 'Teto e Matuê',
    album: 'M4 - Single',
    cover: 'https://cdn-images.dzcdn.net/images/cover/2001711833ffbd1db9c156bc2422e929/500x500-000000-80-0-0.jpg',
    genre: 'Trap',
    durationSec: 141,
    duration: '2:21',
    plays: '422 mi vezes'
  }
];

const NEW_USER_SHOWCASE_ALBUMS = [
  {
    id: 1,
    title: 'ICARUS',
    artist: 'BK',
    year: '2022',
    cover: 'https://cdn-images.dzcdn.net/images/cover/927397ea14b00eba92454a88ec4f352d/1000x1000-000000-80-0-0.jpg',
    genre: 'Rap'
  },
  {
    id: 122,
    title: 'Bluesman',
    artist: 'Baco Exu do Blues',
    year: '2018',
    cover: 'https://cdn-images.dzcdn.net/images/cover/0421054a6a7d8cb4e52dd27ff4deef2c/500x500-000000-80-0-0.jpg',
    genre: 'Trap & Rap'
  },
  {
    id: 9,
    title: 'Purpose',
    artist: 'Justin Bieber',
    year: '2015',
    cover: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/81/a4/dc/81a4dc50-8d7e-6ae5-71d3-f83393348248/15UMGIM59807.rgb.jpg/600x600bb.jpg',
    genre: 'Pop'
  },
  {
    id: 104,
    title: 'O Tempo Não Para (Ao Vivo)',
    artist: 'Cazuza',
    year: '1988',
    cover: 'https://cdn-images.dzcdn.net/images/cover/0f61ba029f3a14618b64e32bc0fd1559/1000x1000-000000-80-0-0.jpg',
    genre: 'Rock Nacional & MPB'
  },
  {
    id: 3,
    title: 'Dos Prédios Deluxe',
    artist: 'Veigh',
    year: '2023',
    cover: 'https://cdn-images.dzcdn.net/images/cover/b300e05a1b78466f15c81677e4ba33d9/1000x1000-000000-80-0-0.jpg',
    genre: 'Trap'
  },
  {
    id: 120,
    title: 'QVVJFA?',
    artist: 'Baco Exu do Blues',
    year: '2022',
    cover: 'https://cdn-images.dzcdn.net/images/cover/ca1787fb655df1405ff3bebea7c6add8/1000x1000-000000-80-0-0.jpg',
    genre: 'Trap & Rap'
  },
  {
    id: 105,
    title: 'Ideologia',
    artist: 'Cazuza',
    year: '1988',
    cover: 'https://cdn-images.dzcdn.net/images/cover/b3421c83bafa3634fa7ce3475cb895e0/1000x1000-000000-80-0-0.jpg',
    genre: 'Rock Nacional & MPB'
  },
  {
    id: 32,
    title: 'NU',
    artist: 'Djonga',
    year: '2021',
    cover: 'https://cdn-images.dzcdn.net/images/cover/4df1597321ee02c46b995bf7746e3bb5/500x500-000000-80-0-0.jpg',
    genre: 'Rap & Trap'
  }
];

function readJsonFile(filePath, fallback = []) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (_) {}
  return fallback;
}

const cleanSimple = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

function getClusterForArtist(artistName) {
  if (!artistName) return null;
  const clean = cleanSimple(artistName);
  for (const cluster of MUSIC_CLUSTERS) {
    const match = cluster.related.some(a => {
      const aClean = cleanSimple(a);
      return clean === aClean || clean.includes(aClean) || aClean.includes(clean);
    });
    if (match) return cluster;
  }
  return null;
}

/**
 * Motor de Recomendações Inteligentes e Personalizadas da Home DevSongs
 */
async function getUserHomeRecommendations(userId) {
  const uId = Number(userId);

  // Se não houver usuário autenticado, retorna vitrine de boas-vindas diversa
  if (!uId) {
    return {
      isPersonalized: false,
      escolhaADedo: NEW_USER_SHOWCASE_TRACKS,
      albunsParaVoce: NEW_USER_SHOWCASE_ALBUMS
    };
  }

  // 1. Coleta sinais de atividade estritamente do usuário atual
  const [history, followedArtists, libraryTracks, libraryAlbums] = await Promise.all([
    libraryStorage.getUserPlaybackHistory(uId, 50),
    libraryStorage.getUserSubscribedArtists(uId),
    libraryStorage.getUserLibraryTracks(uId, 'all'),
    libraryStorage.getUserPurchasedAlbums(uId)
  ]);

  const hasActivity = (history.length > 0 || followedArtists.length > 0 || libraryTracks.length > 0 || libraryAlbums.length > 0);

  // 2. Se for usuário novo sem histórico ou compras
  if (!hasActivity) {
    return {
      isPersonalized: false,
      isNewUser: true,
      escolhaADedo: NEW_USER_SHOWCASE_TRACKS,
      albunsParaVoce: NEW_USER_SHOWCASE_ALBUMS
    };
  }

  // 3. Monta mapa de pesos de afinidade artística e de gênero do usuário
  const artistWeights = new Map();
  const genreWeights = new Map();

  // Histórico de reproduções (mais recente = maior peso)
  history.forEach((h, index) => {
    const art = (h.artist || '').trim();
    if (art) {
      const score = Math.max(1, 10 - Math.floor(index / 2));
      artistWeights.set(art, (artistWeights.get(art) || 0) + score);
    }
    const gen = (h.genre || '').trim();
    if (gen && gen !== 'Variado') {
      genreWeights.set(gen, (genreWeights.get(gen) || 0) + 3);
    }
  });

  // Artistas seguidos (alto valor de intenção)
  followedArtists.forEach(a => {
    const art = (a.name || '').trim();
    if (art) {
      artistWeights.set(art, (artistWeights.get(art) || 0) + 12);
    }
    const gen = (a.genre || '').trim();
    if (gen && gen !== 'Variado') {
      genreWeights.set(gen, (genreWeights.get(gen) || 0) + 5);
    }
  });

  // Músicas adquiridas na biblioteca
  libraryTracks.forEach(t => {
    const art = (t.artist || '').trim();
    if (art) {
      artistWeights.set(art, (artistWeights.get(art) || 0) + 8);
    }
    const gen = (t.genre || '').trim();
    if (gen && gen !== 'Variado') {
      genreWeights.set(gen, (genreWeights.get(gen) || 0) + 4);
    }
  });

  // Álbuns adquiridos
  libraryAlbums.forEach(alb => {
    const art = (alb.artist || alb.artist_name || '').trim();
    if (art) {
      artistWeights.set(art, (artistWeights.get(art) || 0) + 15);
    }
    const gen = (alb.genre || '').trim();
    if (gen && gen !== 'Variado') {
      genreWeights.set(gen, (genreWeights.get(gen) || 0) + 6);
    }
  });

  // Artistas ordenados por afinidade
  const sortedUserArtists = [...artistWeights.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);

  // Identifica clusters e artistas semelhantes
  const relatedArtistsSet = new Set();
  for (const art of sortedUserArtists.slice(0, 5)) {
    const cl = getClusterForArtist(art);
    if (cl) {
      cl.related.forEach(rel => {
        if (!sortedUserArtists.includes(rel)) {
          relatedArtistsSet.add(rel);
        }
      });
    }
  }
  const relatedArtistsList = [...relatedArtistsSet];

  // 4. Montar "Escolha a dedo" personalizada (12 faixas)
  const allCompanyTracks = readJsonFile(TRACKS_FILE, []);
  const pool = [...allCompanyTracks, ...NEW_USER_SHOWCASE_TRACKS];

  const chosenTracks = [];
  const chosenTitles = new Set();

const CANONICAL_COVERS_MAP = {
  "flowespacial": "https://cdn-images.dzcdn.net/images/cover/6a607b99dfcb2dcd32f787ed0e11bf41/500x500-000000-80-0-0.jpg",
  "qvvjfa": "https://cdn-images.dzcdn.net/images/cover/ca1787fb655df1405ff3bebea7c6add8/1000x1000-000000-80-0-0.jpg",
  "quantasvezesvocejabioamado": "https://cdn-images.dzcdn.net/images/cover/ca1787fb655df1405ff3bebea7c6add8/1000x1000-000000-80-0-0.jpg",
  "otemponaopara": "https://cdn-images.dzcdn.net/images/cover/0f61ba029f3a14618b64e32bc0fd1559/1000x1000-000000-80-0-0.jpg",
  "otemponaoparaaovivo": "https://cdn-images.dzcdn.net/images/cover/0f61ba029f3a14618b64e32bc0fd1559/1000x1000-000000-80-0-0.jpg",
  "otemponaoparaoshowcompletoaovivo": "https://cdn-images.dzcdn.net/images/cover/649e4ac67b395aa59903eb5a0eaa620f/1000x1000-000000-80-0-0.jpg",
  "ideologia": "https://cdn-images.dzcdn.net/images/cover/b3421c83bafa3634fa7ce3475cb895e0/1000x1000-000000-80-0-0.jpg",
  "precisodizerqueteamo": "https://cdn-images.dzcdn.net/images/cover/c5a02b4e539a856c34331002dd9814dd/500x500-000000-80-0-0.jpg",
  "redhotrio": "https://cdn-images.dzcdn.net/images/cover/c5a02b4e539a856c34331002dd9814dd/500x500-000000-80-0-0.jpg",
  "superpowers": "https://cdn-images.dzcdn.net/images/cover/0d571082af7c78114321031d7f84d331/1000x1000-000000-80-0-0.jpg",
  "neverenough": "https://cdn-images.dzcdn.net/images/cover/0d571082af7c78114321031d7f84d331/1000x1000-000000-80-0-0.jpg",
  "indaclub": "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/6e/56/af/6e56af83-bdff-56c2-7c6a-b30cd0d356ce/06UMGIM08757.rgb.jpg/600x600bb.jpg",
  "getrichordietryin": "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/6e/56/af/6e56af83-bdff-56c2-7c6a-b30cd0d356ce/06UMGIM08757.rgb.jpg/600x600bb.jpg",
  "amanhecer": "https://cdn-images.dzcdn.net/images/cover/927397ea14b00eba92454a88ec4f352d/1000x1000-000000-80-0-0.jpg",
  "icarus": "https://cdn-images.dzcdn.net/images/cover/927397ea14b00eba92454a88ec4f352d/1000x1000-000000-80-0-0.jpg",
  "se": "https://cdn-images.dzcdn.net/images/cover/9c20912f7f7754d1c0e334dbfb1731bb/500x500-000000-80-0-0.jpg",
  "coisadeacender": "https://cdn-images.dzcdn.net/images/cover/9c20912f7f7754d1c0e334dbfb1731bb/500x500-000000-80-0-0.jpg",
  "finalfeliz": "https://cdn-images.dzcdn.net/images/cover/919ea70f4fe87ed0455fb356813f49f8/500x500-000000-80-0-0.jpg",
  "leve": "https://cdn-images.dzcdn.net/images/cover/919ea70f4fe87ed0455fb356813f49f8/500x500-000000-80-0-0.jpg",
  "quenemmare": "https://cdn-images.dzcdn.net/images/cover/22b9a69d0ac7d5951ced1302bc7674d3/500x500-000000-80-0-0.jpg",
  "m4": "https://cdn-images.dzcdn.net/images/cover/2001711833ffbd1db9c156bc2422e929/500x500-000000-80-0-0.jpg",
  "100molho": "https://cdn-images.dzcdn.net/images/cover/823c311b28a72801b809da4d99c621f4/500x500-000000-80-0-0.jpg",
  "issoetrap": "https://cdn-images.dzcdn.net/images/cover/823c311b28a72801b809da4d99c621f4/500x500-000000-80-0-0.jpg",
  "luzcamaeacao": "https://cdn-images.dzcdn.net/images/cover/6646c5f4c6b60b0ddd4f00987623437c/500x500-000000-80-0-0.jpg",
  "caosdlx": "https://cdn-images.dzcdn.net/images/cover/6646c5f4c6b60b0ddd4f00987623437c/500x500-000000-80-0-0.jpg",
  "girassoisdevangogh": "https://cdn-images.dzcdn.net/images/cover/0421054a6a7d8cb4e52dd27ff4deef2c/500x500-000000-80-0-0.jpg",
  "bluesman": "https://cdn-images.dzcdn.net/images/cover/0421054a6a7d8cb4e52dd27ff4deef2c/500x500-000000-80-0-0.jpg",
  "solto": "https://cdn-images.dzcdn.net/images/cover/10ba01b01c2e8517166d7f2270a7d454/1000x1000-000000-80-0-0.jpg",
  "omeninoquequeriaserdeus": "https://cdn-images.dzcdn.net/images/cover/10ba01b01c2e8517166d7f2270a7d454/1000x1000-000000-80-0-0.jpg",
  "nu": "https://cdn-images.dzcdn.net/images/cover/4df1597321ee02c46b995bf7746e3bb5/500x500-000000-80-0-0.jpg",
  "eu": "https://cdn-images.dzcdn.net/images/cover/4df1597321ee02c46b995bf7746e3bb5/500x500-000000-80-0-0.jpg",
  "rico": "https://cdn-images.dzcdn.net/images/cover/4df1597321ee02c46b995bf7746e3bb5/500x500-000000-80-0-0.jpg",
  "nos": "https://cdn-images.dzcdn.net/images/cover/4df1597321ee02c46b995bf7746e3bb5/500x500-000000-80-0-0.jpg",
  "oquemchega": "https://cdn-images.dzcdn.net/images/cover/4df1597321ee02c46b995bf7746e3bb5/500x500-000000-80-0-0.jpg",
  "procuroalguem": "https://cdn-images.dzcdn.net/images/cover/86427da38e1e93f57746964d3851f9fb/500x500-000000-80-0-0.jpg",
  "historiasdaminhaarea": "https://cdn-images.dzcdn.net/images/cover/86427da38e1e93f57746964d3851f9fb/500x500-000000-80-0-0.jpg",
  "maquinadotempo": "https://cdn-images.dzcdn.net/images/cover/9ad06bcb9f0bfe52bbd5e6ff464e4ca4/1000x1000-000000-80-0-0.jpg",
  "onelesslonelygirl": "https://cdn-images.dzcdn.net/images/cover/a40e48bd5bae166186dc04c57efdae7a/500x500-000000-80-0-0.jpg",
  "myworld": "https://cdn-images.dzcdn.net/images/cover/a40e48bd5bae166186dc04c57efdae7a/500x500-000000-80-0-0.jpg",
  "yummy": "https://cdn-images.dzcdn.net/images/cover/8d54ffac647e9e40cd91686c8a906de6/1000x1000-000000-80-0-0.jpg",
  "sonhodeamor": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/c5/8c/e6/c58ce6ca-8b7b-8cbf-7513-c57b1535636e/8721416112201.jpg/1000x1000bb.jpg",
  "praiadorosaacustico": "https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/aa/45/98/aa4598c4-c24b-7dfe-7ffc-7c11e09f3356/886447438053.jpg/1000x1000bb.jpg",
  "tacomessadai": "https://cdn-images.dzcdn.net/images/cover/a6ee408695fa151f6d05a318bb0fb7e9/1000x1000-000000-80-0-0.jpg",
  "bomenovo": "https://cdn-images.dzcdn.net/images/cover/a6ee408695fa151f6d05a318bb0fb7e9/1000x1000-000000-80-0-0.jpg",
  "palaciodelona": "https://cdn-images.dzcdn.net/images/cover/a6ee408695fa151f6d05a318bb0fb7e9/1000x1000-000000-80-0-0.jpg",
  "sorock2": "https://cdn-images.dzcdn.net/images/cover/b91d171dee51eb10eb799382fad0acec/1000x1000-000000-80-0-0.jpg",
  "sorock3": "https://cdn-images.dzcdn.net/images/cover/04984889a4024d617d8fcaab1267365d/1000x1000-000000-80-0-0.jpg",
  "pensandoemmim": "https://cdn-images.dzcdn.net/images/cover/31b86e4b5a5dc901013878cb70cdb66d/500x500-000000-80-0-0.jpg",
  "acabouacabou": "https://cdn-images.dzcdn.net/images/cover/9801cd5811ab4677837a17edbaefb505/1000x1000-000000-80-0-0.jpg",
  "desgracadagostosamaldita": "https://cdn-images.dzcdn.net/images/cover/3ef64652d6f7da29ce07bc38a11093a3/1000x1000-000000-80-0-0.jpg",
  "vagabundodeluxo": "https://cdn-images.dzcdn.net/images/cover/3ef64652d6f7da29ce07bc38a11093a3/1000x1000-000000-80-0-0.jpg",
  "300no7": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/4a/74/0a/4a740a7a-d14a-af72-90d7-a12232742116/cover.jpg/1000x1000bb.jpg",
  "penumbra": "https://cdn-images.dzcdn.net/images/cover/5c415f9e2f05ad4d3d5781ad52f66aca/1000x1000-000000-80-0-0.jpg",
  "suedehead": "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/56/0d/b9/560db9d0-dbad-d868-8685-c2f8d570f5c1/mzi.npznsatp.jpg/1000x1000bb.jpg",
  "vivahate": "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/56/0d/b9/560db9d0-dbad-d868-8685-c2f8d570f5c1/mzi.npznsatp.jpg/1000x1000bb.jpg",
  "dosprediosdeluxe": "https://cdn-images.dzcdn.net/images/cover/b300e05a1b78466f15c81677e4ba33d9/1000x1000-000000-80-0-0.jpg",
  "odonodolugar": "https://cdn-images.dzcdn.net/images/cover/5c415f9e2f05ad4d3d5781ad52f66aca/1000x1000-000000-80-0-0.jpg",
  "inocentedemotape": "https://cdn-images.dzcdn.net/images/cover/e768aeb719303899f8143d055b374896/1000x1000-000000-80-0-0.jpg",
  "quantomaiseucomomaisfomedanomeuprato": "https://cdn-images.dzcdn.net/images/cover/dd262384105ac39d04c7d5a18ce287de/1000x1000-000000-80-0-0.jpg",
  "quantomaiseucomomaisfomeeusinto": "https://cdn-images.dzcdn.net/images/cover/dd262384105ac39d04c7d5a18ce287de/1000x1000-000000-80-0-0.jpg"
};

function resolveSafeCover(t) {
  if (!t) return 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png';
  const cleanTitle = cleanSimple(t.title);
  const cleanAlbum = cleanSimple(t.album);
  if (cleanTitle && CANONICAL_COVERS_MAP[cleanTitle]) return CANONICAL_COVERS_MAP[cleanTitle];
  if (cleanAlbum && CANONICAL_COVERS_MAP[cleanAlbum]) return CANONICAL_COVERS_MAP[cleanAlbum];

  const rawUrl = t.cover_url || t.cover || '';
  const isBad = !rawUrl ||
    rawUrl.includes('42078a6ff6071ef28ba866bbf30fe357') ||
    rawUrl.includes('f9f60f6064f20ec719c83fa1091b5c4f') ||
    rawUrl.includes('d41d8cd98f00b204e9800998ecf8427e') ||
    rawUrl.includes('50cent.jpg');

  if (!isBad) return rawUrl;

  for (const [k, c] of Object.entries(CANONICAL_COVERS_MAP)) {
    if (cleanTitle.includes(k) || k.includes(cleanTitle) || cleanAlbum.includes(k) || k.includes(cleanAlbum)) {
      return c;
    }
  }

  return 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png';
}

  const addTrackIfUnique = (t) => {
    if (!t) return false;
    const cleanTitle = cleanSimple(t.title);
    if (!chosenTitles.has(cleanTitle) && chosenTracks.length < 12) {
      chosenTitles.add(cleanTitle);
      const durSec = t.duration_sec || t.durationSec || 210;
      chosenTracks.push({
        id: t.id ? `rec-${t.id}` : `rec-${chosenTracks.length + 1}`,
        trackId: t.id || null,
        title: t.title,
        artist: t.artist,
        album: t.album || 'Single',
        genre: t.genre || 'Variado',
        cover: resolveSafeCover(t),
        durationSec: durSec,
        duration: `${Math.floor(durSec / 60)}:${String(durSec % 60).padStart(2, '0')}`,
        plays: t.plays || `${Math.floor(Math.random() * 80 + 15)} mi vezes`
      });
      return true;
    }
    return false;
  };

  // Grupo 1: Músicas dos artistas favoritos/seguidos do usuário (5-6 faixas)
  for (const favArtist of sortedUserArtists) {
    const favClean = cleanSimple(favArtist);
    const matches = pool.filter(t => {
      const tClean = cleanSimple(t.artist);
      return tClean === favClean || tClean.includes(favClean) || favClean.includes(tClean);
    });
    for (const m of matches) {
      addTrackIfUnique(m);
      if (chosenTracks.length >= 6) break;
    }
    if (chosenTracks.length >= 6) break;
  }

  // Grupo 2: Músicas de artistas semelhantes (descobertas no mesmo estilo - 3-4 faixas)
  for (const relArtist of relatedArtistsList) {
    const relClean = cleanSimple(relArtist);
    const matches = pool.filter(t => {
      const tClean = cleanSimple(t.artist);
      return tClean === relClean || tClean.includes(relClean) || relClean.includes(tClean);
    });
    for (const m of matches) {
      addTrackIfUnique(m);
      if (chosenTracks.length >= 10) break;
    }
    if (chosenTracks.length >= 10) break;
  }

  // Grupo 3: Preenchimento diversificado com faixas populares do catálogo
  for (const fallbackTrack of NEW_USER_SHOWCASE_TRACKS) {
    addTrackIfUnique(fallbackTrack);
    if (chosenTracks.length >= 12) break;
  }

  // 5. Montar "Álbuns para você" personalizado (6-8 álbuns)
  const allAlbums = readJsonFile(ALBUMS_FILE, []);
  const ownedAlbumTitles = new Set(libraryAlbums.map(a => cleanSimple(a.title)));
  const ownedAlbumIds = new Set(libraryAlbums.map(a => String(a.id)));

  const chosenAlbums = [];
  const chosenAlbumTitles = new Set();

  const addAlbumIfUnique = (alb) => {
    if (!alb) return false;
    const cleanTitle = cleanSimple(alb.title);
    if (!chosenAlbumTitles.has(cleanTitle) && chosenAlbums.length < 8) {
      chosenAlbumTitles.add(cleanTitle);
      chosenAlbums.push({
        id: alb.id,
        albumId: alb.id,
        title: alb.title,
        artist: alb.artist_name || alb.artist || 'Artista',
        year: alb.release_date ? String(alb.release_date).slice(0, 4) : (alb.year || '2024'),
        cover: resolveSafeCover(alb),
        genre: alb.genre || 'Variado'
      });
      return true;
    }
    return false;
  };

  // Prioridade 1: Álbuns de artistas que o usuário segue ou escuta frequentemente (e ainda não comprou)
  for (const favArtist of sortedUserArtists) {
    const favClean = cleanSimple(favArtist);
    const artistAlbums = allAlbums.filter(a => {
      const aArtClean = cleanSimple(a.artist_name || a.artist);
      const isMatch = aArtClean === favClean || aArtClean.includes(favClean) || favClean.includes(aArtClean);
      const alreadyOwned = ownedAlbumIds.has(String(a.id)) || ownedAlbumTitles.has(cleanSimple(a.title));
      return isMatch && !alreadyOwned;
    });
    for (const alb of artistAlbums) {
      addAlbumIfUnique(alb);
      if (chosenAlbums.length >= 4) break;
    }
    if (chosenAlbums.length >= 4) break;
  }

  // Prioridade 2: Álbuns de artistas afins/semelhantes
  for (const relArtist of relatedArtistsList) {
    const relClean = cleanSimple(relArtist);
    const relatedAlb = allAlbums.filter(a => {
      const aArtClean = cleanSimple(a.artist_name || a.artist);
      const isMatch = aArtClean === relClean || aArtClean.includes(relClean) || relClean.includes(aArtClean);
      const alreadyOwned = ownedAlbumIds.has(String(a.id)) || ownedAlbumTitles.has(cleanSimple(a.title));
      return isMatch && !alreadyOwned;
    });
    for (const alb of relatedAlb) {
      addAlbumIfUnique(alb);
      if (chosenAlbums.length >= 7) break;
    }
    if (chosenAlbums.length >= 7) break;
  }

  // Prioridade 3: Vitrine para completar 8 álbuns
  for (const showcaseAlb of NEW_USER_SHOWCASE_ALBUMS) {
    if (!ownedAlbumTitles.has(cleanSimple(showcaseAlb.title))) {
      addAlbumIfUnique(showcaseAlb);
    }
    if (chosenAlbums.length >= 8) break;
  }

  return {
    isPersonalized: true,
    userTopArtists: sortedUserArtists.slice(0, 5),
    escolhaADedo: chosenTracks,
    albunsParaVoce: chosenAlbums
  };
}

module.exports = {
  getUserHomeRecommendations,
  NEW_USER_SHOWCASE_TRACKS,
  NEW_USER_SHOWCASE_ALBUMS,
  MUSIC_CLUSTERS
};

