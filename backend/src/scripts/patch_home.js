const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '../../../frontend/pages/home.js');
let content = fs.readFileSync(file, 'utf8');

// 1. Import LibraryView
if (!content.includes('LibraryView')) {
  content = content.replace(
    "import styles from '../styles/home.module.css';",
    "import styles from '../styles/home.module.css';\nimport LibraryView from '../components/library/LibraryView';"
  );
}

// 2. Export default function HomeView(props = {})
content = content.replace(
  'export default function HomeView() {',
  'export default function HomeView(props = {}) {'
);

// 3. activeTab initial state and forcedTab
content = content.replace(
  "const [activeTab, setActiveTab] = useState('inicio');",
  "const [activeTab, setActiveTab] = useState(props.forcedTab || 'inicio');"
);

// 4. Router query detection & library player helpers
const routerQuerySnippet = `
  useEffect(() => {
    if (!router.isReady) return;
    if (props.forcedTab) {
      setActiveTab(props.forcedTab);
      setViewMode('home');
    } else if (router.query.tab === 'biblioteca' || router.query.playlist) {
      setActiveTab('biblioteca');
      setViewMode('home');
    }
  }, [router.isReady, router.query, props.forcedTab]);

  const handlePlayLibraryTrack = (track) => {
    if (!track) return;
    const isStreamAllowed = track.available_for_stream !== false;
    const playObj = {
      id: track.id ? \`ct-\${track.id}\` : track.dbTrackId,
      dbTrackId: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album || 'Single',
      genre: track.genre || 'Variado',
      cover: track.cover_url || track.cover || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png',
      preview: track.preview_url || track.preview,
      youtubeVideoId: track.youtube_video_id || null,
      durationSec: track.duration_sec || 210,
      duration: \`\${Math.floor((track.duration_sec || 210)/60)}:\${String((track.duration_sec || 210)%60).padStart(2, '0')}\`,
      available_for_stream: isStreamAllowed,
      canPlay: isStreamAllowed
    };
    playTrack(playObj, isStreamAllowed);
  };

  const handlePlayLibraryQueue = (tracksList, startIndex = 0) => {
    if (!tracksList || tracksList.length === 0) return;
    const mapped = tracksList.map(t => ({
      id: t.id ? \`ct-\${t.id}\` : t.dbTrackId,
      dbTrackId: t.id,
      title: t.title,
      artist: t.artist,
      album: t.album || 'Single',
      genre: t.genre || 'Variado',
      cover: t.cover_url || t.cover || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png',
      preview: t.preview_url || t.preview,
      youtubeVideoId: t.youtube_video_id || null,
      durationSec: t.duration_sec || 210,
      duration: \`\${Math.floor((t.duration_sec || 210)/60)}:\${String((t.duration_sec || 210)%60).padStart(2, '0')}\`,
      available_for_stream: t.available_for_stream !== false,
      canPlay: t.available_for_stream !== false
    }));
    setUserPurchases(prev => {
      const existing = new Set(prev.map(p => p.dbTrackId || p.id));
      const newItems = mapped.filter(m => !existing.has(m.dbTrackId || m.id));
      return [...prev, ...newItems];
    });
    const startTrack = mapped[startIndex] || mapped[0];
    playTrack(startTrack, startTrack.available_for_stream);
  };
`;

if (!content.includes('handlePlayLibraryTrack')) {
  content = content.replace(
    'const [user, setUser] = useState(null);',
    'const [user, setUser] = useState(null);\n' + routerQuerySnippet
  );
}

// 5. Replace sidebar button alert('Criar nova playlist')
content = content.replace(
  "onClick={() => alert('Criar nova playlist')}",
  "onClick={() => { setActiveTab('biblioteca'); setViewMode('home'); router.push('/home?tab=biblioteca', undefined, { shallow: true }); }}"
);

// 6. Replace old activeTab === 'biblioteca' section
const startPattern = "{activeTab === 'biblioteca' ? (";
const endMarker = ": (selectedCompany || baseMode !== 'home') ? (";

const startIdx = content.indexOf(startPattern);
const endIdx = content.indexOf(endMarker, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `{activeTab === 'biblioteca' ? (
                <LibraryView
                  token={typeof window !== 'undefined' ? localStorage.getItem('token') : null}
                  user={user}
                  onPlayTrack={handlePlayLibraryTrack}
                  onPlayQueue={handlePlayLibraryQueue}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  initialPlaylistId={router.query.playlist || null}
                />
              `;
  content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
  console.log('Successfully replaced old biblioteca section with LibraryView component!');
} else {
  console.error('Could not find markers for old biblioteca section');
}

fs.writeFileSync(file, content, 'utf8');
console.log('home.js patched successfully!');

