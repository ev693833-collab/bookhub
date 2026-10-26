import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import {
  Heart, Sparkles, Search, Headphones, X, Loader,
  Disc, Calendar, User, BookOpen, Info, ChevronLeft, ChevronRight
} from 'lucide-react';
import styles from '../styles/index.module.css';
import BackgroundVideo from '../components/BackgroundVideo';

// ─── Curated song lists per genre ──────────────────────────────────────────
const GENRE_SECTIONS = [
  {
    id: 'popular', label: '🔥 Mais Populares',
    songs: [
      { title: 'Blinding Lights', artist: 'The Weeknd' },
      { title: 'Shape of You', artist: 'Ed Sheeran' },
      { title: 'Uptown Funk', artist: 'Bruno Mars' },
      { title: 'Rolling in the Deep', artist: 'Adele' },
      { title: 'Despacito', artist: 'Luis Fonsi' },
      { title: 'Happy', artist: 'Pharrell Williams' },
      { title: 'Someone Like You', artist: 'Adele' },
      { title: 'Bad Guy', artist: 'Billie Eilish' },
      { title: 'Closer', artist: 'The Chainsmokers' },
      { title: 'Thinking Out Loud', artist: 'Ed Sheeran' },
    ],
  },
  {
    id: 'pop', label: '🎵 Pop',
    songs: [
      { title: 'Sugar', artist: 'Maroon 5' },
      { title: 'Company', artist: 'Justin Bieber' },
      { title: 'Love Story', artist: 'Taylor Swift' },
      { title: 'Roar', artist: 'Katy Perry' },
      { title: 'Sorry', artist: 'Justin Bieber' },
      { title: 'Levitating', artist: 'Dua Lipa' },
      { title: 'Watermelon Sugar', artist: 'Harry Styles' },
      { title: 'Shake It Off', artist: 'Taylor Swift' },
      { title: 'Señorita', artist: 'Shawn Mendes' },
      { title: 'New Rules', artist: 'Dua Lipa' },
    ],
  },
  {
    id: 'rock', label: '🎸 Rock',
    songs: [
      { title: 'Bohemian Rhapsody', artist: 'Queen' },
      { title: 'Hotel California', artist: 'Eagles' },
      { title: 'Smells Like Teen Spirit', artist: 'Nirvana' },
      { title: 'Back in Black', artist: 'ACDC' },
      { title: 'Welcome to the Jungle', artist: 'Guns N Roses' },
      { title: 'November Rain', artist: 'Guns N Roses' },
      { title: 'Eye of the Tiger', artist: 'Survivor' },
      { title: "Don't Stop Believin", artist: 'Journey' },
      { title: 'Africa', artist: 'Toto' },
      { title: 'Sweet Home Alabama', artist: 'Lynyrd Skynyrd' },
    ],
  },
  {
    id: 'eletronica', label: '⚡ Eletrônica',
    songs: [
      { title: 'Levels', artist: 'Avicii' },
      { title: 'Wake Me Up', artist: 'Avicii' },
      { title: 'Faded', artist: 'Alan Walker' },
      { title: 'Animals', artist: 'Martin Garrix' },
      { title: 'Titanium', artist: 'David Guetta' },
      { title: 'Lean On', artist: 'Major Lazer' },
      { title: 'Clarity', artist: 'Zedd' },
      { title: 'Turn Down for What', artist: 'DJ Snake' },
      { title: 'Scary Monsters and Nice Sprites', artist: 'Skrillex' },
      { title: 'Beautiful Now', artist: 'Zedd' },
    ],
  },
  {
    id: 'lofi', label: '☕ Lo-Fi',
    songs: [
      { title: 'Snowfall', artist: 'Øneheart' },
      { title: 'Evening Walk', artist: 'Kupla' },
      { title: 'Lazy Sunday', artist: 'Pandrezz' },
      { title: 'Daydream', artist: 'Idealism' },
      { title: 'Midsummer', artist: 'Sleepy Fish' },
      { title: 'Morning Routine', artist: 'Bassti' },
      { title: 'Somewhere Else', artist: 'Tenno' },
      { title: 'Warm Nights', artist: 'Philanthrope' },
      { title: 'Tokyo', artist: 'Lofi Geek' },
      { title: 'Coffee Shop', artist: 'Chillhop Music' },
    ],
  },
  {
    id: 'synthwave', label: '🌆 Synthwave',
    songs: [
      { title: 'Nightcall', artist: 'Kavinsky' },
      { title: 'A Real Hero', artist: 'College' },
      { title: 'Turbo Killer', artist: 'Carpenter Brut' },
      { title: 'Running in the Night', artist: 'FM-84' },
      { title: 'Dark All Day', artist: 'Gunship' },
      { title: 'Los Angeles', artist: 'The Midnight' },
      { title: 'On the Run', artist: 'Timecop1983' },
      { title: 'Sunset', artist: 'The Midnight' },
      { title: 'Bad Blood', artist: 'Chromatics' },
      { title: 'Future Club', artist: 'Perturbator' },
    ],
  },
  {
    id: 'jazz', label: '🎷 Jazz',
    songs: [
      { title: 'So What', artist: 'Miles Davis' },
      { title: 'Take Five', artist: 'Dave Brubeck' },
      { title: 'What a Wonderful World', artist: 'Louis Armstrong' },
      { title: 'Feeling Good', artist: 'Nina Simone' },
      { title: 'Round Midnight', artist: 'Thelonious Monk' },
      { title: 'Almost Blue', artist: 'Chet Baker' },
      { title: 'Waltz for Debby', artist: 'Bill Evans' },
      { title: 'Giant Steps', artist: 'John Coltrane' },
      { title: 'Come Away With Me', artist: 'Norah Jones' },
      { title: 'All Blues', artist: 'Miles Davis' },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────
function formatDuration(ms) {
  if (!ms) return '—';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

async function fetchItunesData(title, artist) {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(`${title} ${artist}`)}&media=music&limit=5&entity=song`
    );
    const data = await res.json();
    const items = data.results || [];
    const match = items.find(i =>
      i.artistName?.toLowerCase().includes(artist.toLowerCase().split(' ')[0])
    ) || items[0];
    if (!match) return null;
    return {
      cover: match.artworkUrl100?.replace('100x100bb', '500x500bb') || '',
      album: match.collectionName || '',
      genre: match.primaryGenreName || '',
      duration: formatDuration(match.trackTimeMillis),
    };
  } catch (_) { return null; }
}

async function searchSongs(query, maxResults = 12) {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=${maxResults}&entity=song`
    );
    const data = await res.json();
    if (!data.results) return [];
    return data.results.map((item, idx) => ({
      id: `search-${item.trackId || idx}`,
      title: item.trackName,
      artist: item.artistName,
      album: item.collectionName || '',
      cover: item.artworkUrl100?.replace('100x100bb', '500x500bb') || '',
      genre: item.primaryGenreName || '',
      duration: formatDuration(item.trackTimeMillis),
    }));
  } catch (_) {
    return [];
  }
}

function SkeletonRow() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={styles.skeletonCard}>
          <div className={styles.skeletonCover} />
          <div className={styles.skeletonLine} />
          <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
        </div>
      ))}
    </>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function Home() {
  // Genre sections
  const [genreSections, setGenreSections] = useState(
    GENRE_SECTIONS.map(s => ({
      ...s,
      loading: false,
      tracks: s.songs.map((song, idx) => ({
        id: `${s.id}-${idx}`,
        title: song.title,
        artist: song.artist,
        cover: '',
        album: '',
        genre: s.label,
        duration: '—',
      })),
    }))
  );

  // Featured track for Hero
  const [featuredTrack, setFeaturedTrack] = useState({
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    genre: '🔥 Mais Populares',
    cover: '',
  });

  const [likedTracks, setLikedTracks] = useState({});

  // Song Detail Modal (Mini Resumo, Álbum, Data, Fotinha do Artista)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [songDetail, setSongDetail] = useState(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);

  // Fechar modal ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsDetailModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Carregar dados ricos e biografia da obra
  const loadSongDetail = useCallback(async (track) => {
    if (!track) return;
    setFeaturedTrack(track);
    setSongDetail({
      title: track.title,
      artist: track.artist,
      album: track.album || '',
      releaseDate: '',
      genre: track.genre || '',
      cover: track.cover || '',
      artistPhoto: track.artistPhoto || '',
      artistBio: '',
      summary: '',
      loading: true,
    });
    setIsDetailModalOpen(true);

    try {
      const res = await fetch(`/api/track-info?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}`);
      if (res.ok) {
        const data = await res.json();
        setSongDetail(prev => {
          if (!prev || prev.title !== track.title) return prev;
          return {
            ...prev,
            ...data,
            cover: data.cover || prev.cover || track.cover,
            artistPhoto: data.artistPhoto || prev.artistPhoto || track.artistPhoto,
            loading: false,
          };
        });
      } else {
        setSongDetail(prev => prev ? {
          ...prev,
          loading: false,
          summary: `Informações sobre a obra "${track.title}" por ${track.artist}.`,
        } : null);
      }
    } catch (_) {
      setSongDetail(prev => prev ? { ...prev, loading: false } : null);
    }
  }, []);

  // Carregar rankings e músicas mais tocadas em tempo real da API
  useEffect(() => {
    let isMounted = true;
    fetch('/api/charts')
      .then(res => res.ok ? res.json() : null)
      .then(liveSections => {
        if (!isMounted || !liveSections || !Array.isArray(liveSections) || liveSections.length === 0) return;
        setGenreSections(liveSections);
      })
      .catch(() => {
        // Fallback para enriquecer capas com iTunes se /api/charts falhar
        GENRE_SECTIONS.forEach((section, sIdx) => {
          section.songs.forEach((song, tIdx) => {
            fetchItunesData(song.title, song.artist).then(data => {
              if (!data || !isMounted) return;
              setGenreSections(prev => {
                const updated = [...prev];
                const sec = { ...updated[sIdx], tracks: [...updated[sIdx].tracks] };
                sec.tracks[tIdx] = { ...sec.tracks[tIdx], ...data };
                updated[sIdx] = sec;
                return updated;
              });
            });
          });
        });
      });

    return () => { isMounted = false; };
  }, []);

  const toggleLike = id => setLikedTracks(prev => ({ ...prev, [id]: !prev[id] }));

  // Busca de obras e músicas
  const handleSearchSubmit = async e => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchSongs(searchQuery, 12);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchResults(null);
    setSearchQuery('');
  };

  const scrollRow = (id, direction) => {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(`scroll-row-${id}`);
    if (el) {
      const scrollAmount = direction === 'left' ? -550 : 550;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div>
      <Head>
        <title>DevSongs</title>
        <meta name="description" content="Explore suas músicas favoritas, lançamentos, álbuns e artistas no DevSongs." />
        <link rel="icon" href="https://res.cloudinary.com/z7j0hqnl/image/upload/v1793025191/bookhub/favicon.png" type="image/png" />
      </Head>

      <div className={styles.app}>
        <BackgroundVideo />

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.container}>
            <div className={styles.nav}>
              <div className={styles.logo}>
                <Image src="https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png" alt="DevSongs" width={36} height={36} className={styles.logoImg} />
                <span className={styles.brandTitle}>Dev<span className={styles.logoHighlight}>Songs</span></span>
              </div>
              <div className={styles.navActions}>
                <Link href="/login"><button className={styles.secondaryButton}>Entrar</button></Link>
                <Link href="/register"><button className={styles.primaryButton}>Experimentar Grátis</button></Link>
              </div>
            </div>
          </div>
        </header>

        <main>
          {/* Hero */}
          <section className={styles.hero}>
            <div className={styles.container}>
              <div className={styles.heroContent}>
                <div className={styles.heroText}>
                  <div className={styles.badge}>
                    <span className={styles.badgeDot} />
                    <Sparkles size={15} className={styles.badgeIcon} />
                    <span className={styles.badgeText}>Plataforma de Streaming &amp; Descoberta Musical</span>
                    <span className={styles.badgeTag}>DevSongs</span>
                  </div>
                  <h1 className={styles.heroTitle}>
                    Explore milhões de músicas e sinta cada<span className={styles.gradientText}> Batida &amp; Ritmo</span>
                  </h1>
                  <p className={styles.heroDescription}>
                    Descubra os maiores lançamentos, ouça seus artistas favoritos, explore álbuns e mergulhe em playlists feitas para acompanhar seu ritmo.
                  </p>
                  <div className={styles.heroButtons}>
                    <a href="#descobrir" className={styles.primaryButtonLarge}>
                      <Headphones size={18} /> Explorar Músicas
                    </a>
                  </div>
                  <div className={styles.heroStats}>
                    <div className={styles.stat}>
                      <div className={`${styles.statIconBox} ${styles.statIconBlue}`}>
                        <Headphones size={20} />
                      </div>
                      <div className={styles.statInfo}>
                        <span className={styles.statNumber}>∞</span>
                        <span className={styles.statLabel}>Músicas &amp; Faixas</span>
                      </div>
                    </div>

                    <div className={styles.statDivider} />

                    <div className={styles.stat}>
                      <div className={`${styles.statIconBox} ${styles.statIconPurple}`}>
                        <Disc size={20} />
                      </div>
                      <div className={styles.statInfo}>
                        <span className={styles.statNumber}>15+</span>
                        <span className={styles.statLabel}>Gêneros Musicais</span>
                      </div>
                    </div>

                    <div className={styles.statDivider} />

                    <div className={styles.stat}>
                      <div className={`${styles.statIconBox} ${styles.statIconGreen}`}>
                        <Sparkles size={20} />
                      </div>
                      <div className={styles.statInfo}>
                        <span className={styles.statNumber}>100%</span>
                        <span className={styles.statLabel}>Acesso Gratuito</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Genre Sections */}
          <section id="descobrir" className={styles.showcaseSection}>
            <div className={styles.container}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionBadge}>
                  <Sparkles size={14} />
                  <span>Catálogo &amp; Coleções</span>
                </div>
                <h2 className={styles.sectionTitle}>Explore por Gênero &amp; Estilo</h2>
                <p className={styles.sectionDescription}>
                  Navegue pelas melhores seleções e clique em qualquer música para ver álbum, lançamento e perfil do artista!
                </p>

                {/* Genre Filter Pills */}
                <div className={styles.genreFilterBar}>
                  {genreSections.map(sec => (
                    <button
                      key={sec.id}
                      onClick={() => {
                        const el = document.getElementById(`genre-section-${sec.id}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className={styles.genreFilterChip}
                    >
                      {sec.label}
                    </button>
                  ))}
                </div>
              </div>

              {searchResults && (
                <div className={styles.searchBanner}>
                  <span className={styles.searchBannerText}>
                    🔍 {searchResults.length} resultado(s) para &quot;{searchQuery}&quot;
                  </span>
                  <button className={styles.searchBannerClear} onClick={clearSearch}>
                    <X size={14} style={{ display: 'inline', marginRight: 4 }} />Limpar
                  </button>
                </div>
              )}

              {searchResults && (
                <div className={styles.genreRow}>
                  <div className={styles.genreRowHeader}>
                    <div className={styles.genreRowLeft}>
                      <div className={styles.genreRowPill}>
                        <span className={styles.genreRowDot} />
                        <h3 className={styles.genreRowTitle}>🔍 Resultados da Busca</h3>
                      </div>
                    </div>
                  </div>
                  <div className={styles.horizontalScroll}>
                    {searchResults.map((track) => (
                      <div
                        key={track.id}
                        className={styles.trackCardH}
                        onClick={() => loadSongDetail(track)}
                      >
                        <div className={styles.trackCardHCover}>
                          {track.cover ? (
                            <img src={track.cover} alt={track.title} className={styles.trackCardHImg} />
                          ) : (
                            <div className={styles.placeholderCover}>
                              <Headphones size={32} color="#3b82f6" />
                            </div>
                          )}
                          <div className={styles.trackCardOverlay}>
                            <button className={styles.trackCardHActionBtn} title="Ver detalhes da música">
                              <Info size={18} />
                            </button>
                          </div>
                        </div>
                        <div className={styles.trackCardMeta}>
                          <p className={styles.trackCardHTitle} title={track.title}>{track.title}</p>
                          <p className={styles.trackCardHArtist} title={track.artist}>{track.artist}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {genreSections.map(section => (
                <div key={section.id} id={`genre-section-${section.id}`} className={styles.genreRow}>
                  <div className={styles.genreRowHeader}>
                    <div className={styles.genreRowLeft}>
                      <div className={styles.genreRowPill}>
                        <span className={styles.genreRowDot} />
                        <h3 className={styles.genreRowTitle}>{section.label}</h3>
                      </div>
                      <span className={styles.genreTrackCount}>
                        {section.tracks?.length || 10} faixas
                      </span>
                    </div>

                    {/* Controles de Navegação do Carrossel */}
                    <div className={styles.carouselNavBtns}>
                      <button
                        className={styles.carouselNavBtn}
                        onClick={() => scrollRow(section.id, 'left')}
                        aria-label="Anterior"
                        title="Rolar para esquerda"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        className={styles.carouselNavBtn}
                        onClick={() => scrollRow(section.id, 'right')}
                        aria-label="Próximo"
                        title="Rolar para direita"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>

                  <div id={`scroll-row-${section.id}`} className={styles.horizontalScroll}>
                    {section.loading ? <SkeletonRow /> : section.tracks.map((track, trackIdx) => (
                      <div
                        key={track.id}
                        className={styles.trackCardH}
                        onClick={() => loadSongDetail(track)}
                      >
                        <div className={styles.trackCardHCover}>
                          {section.id === 'popular' && (
                            <div className={styles.rankBadge}>#{trackIdx + 1}</div>
                          )}
                          {track.cover ? (
                            <img src={track.cover} alt={track.title} className={styles.trackCardHImg} />
                          ) : (
                            <div className={styles.placeholderCover}>
                              <Headphones size={32} color="#3b82f6" />
                            </div>
                          )}
                          <div className={styles.trackCardOverlay}>
                            <button className={styles.trackCardHActionBtn} title="Ver detalhes da música">
                              <Info size={18} />
                            </button>
                          </div>
                        </div>
                        <div className={styles.trackCardMeta}>
                          <p className={styles.trackCardHTitle} title={track.title}>{track.title}</p>
                          <p className={styles.trackCardHArtist} title={track.artist}>{track.artist}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Modal: Detalhes sobre a Música, Álbum, Data e Perfil do Artista */}
        {isDetailModalOpen && songDetail && (
          <div className={styles.modalBackdrop} onClick={() => setIsDetailModalOpen(false)}>
            <div className={styles.modalContainer} onClick={e => e.stopPropagation()}>
              <div className={styles.modalAura} />

              {/* Header */}
              <div className={styles.modalHeader}>
                <div className={styles.modalBadge}>
                  <Sparkles size={13} />
                  <span>Detalhes da Faixa</span>
                </div>
                <button
                  className={styles.modalCloseBtn}
                  onClick={() => setIsDetailModalOpen(false)}
                  aria-label="Fechar"
                >
                  <X size={18} />
                </button>
              </div>

              <div className={styles.modalBody}>
                {/* Hero Showcase Card: Capa + Disco Vinyl + Artista + Metadados */}
                <div className={styles.modalHeroCard}>
                  <div className={styles.modalCoverWrapper}>
                    <div className={styles.vinylDisc}>
                      <div className={styles.vinylCenterHole} />
                    </div>
                    {songDetail.cover ? (
                      <img
                        src={songDetail.cover}
                        alt={songDetail.title}
                        className={styles.modalCoverImg}
                      />
                    ) : (
                      <div
                        className={styles.modalCoverImg}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#1e293b',
                        }}
                      >
                        <Headphones size={36} color="#60a5fa" />
                      </div>
                    )}
                  </div>

                  <div className={styles.modalHeroDetails}>
                    <h2 className={styles.modalSongTitle}>{songDetail.title}</h2>

                    {/* Linha do Artista com Avatar e Nome */}
                    <div className={styles.artistInlineRow}>
                      <img
                        src={
                          songDetail.artistPhoto ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(songDetail.artist)}&background=2563eb&color=fff`
                        }
                        alt={songDetail.artist}
                        className={styles.artistAvatarMini}
                        onError={e => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(songDetail.artist)}&background=2563eb&color=fff`;
                        }}
                      />
                      <div className={styles.artistInfoMini}>
                        <span className={styles.artistNameMini}>
                          {songDetail.artist}
                          <span className={styles.verifiedBadge} title="Artista Verificado">✓</span>
                        </span>
                        {songDetail.artistBio && (
                          <span className={styles.artistBioMini}>{songDetail.artistBio}</span>
                        )}
                      </div>
                    </div>

                    {/* Chips de Informações da Obra */}
                    <div className={styles.modalChipsRow}>
                      {songDetail.album && (
                        <div className={styles.metaChip} title={`Álbum: ${songDetail.album}`}>
                          <Disc size={15} className={styles.chipIcon} />
                          <span className={styles.chipText}>{songDetail.album}</span>
                        </div>
                      )}
                      {songDetail.releaseDate && (
                        <div className={styles.metaChip} title={`Lançamento: ${songDetail.releaseDate}`}>
                          <Calendar size={15} className={styles.chipIcon} />
                          <span className={styles.chipText}>{songDetail.releaseDate}</span>
                        </div>
                      )}
                      {songDetail.genre && (
                        <div className={styles.metaChip} title={`Gênero: ${songDetail.genre}`}>
                          <Sparkles size={15} className={styles.chipIcon} />
                          <span className={styles.chipText}>{songDetail.genre}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Seção Editorial: Sobre a Faixa & Artista */}
                <div className={styles.modalBioSection}>
                  <span className={styles.bioQuoteWatermark}>“</span>
                  <div className={styles.modalBioTitle}>
                    <BookOpen size={16} />
                    <span>Sobre a Faixa &amp; Artista</span>
                  </div>
                  {songDetail.loading ? (
                    <div className={styles.summaryLoading}>
                      <div className={styles.skeletonLine} style={{ width: '96%' }} />
                      <div className={styles.skeletonLine} style={{ width: '88%' }} />
                      <div className={styles.skeletonLine} style={{ width: '74%' }} />
                    </div>
                  ) : (
                    <p className={styles.modalBioText}>{songDetail.summary}</p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className={styles.modalFooter}>
                <button
                  className={styles.modalDismissBtn}
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  Fechar Detalhes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.container}>
            <div className={styles.footerBrand}>
              <div className={styles.logo}>
                <Image src="https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png" alt="DevSongs" width={32} height={32} className={styles.logoImg} />
                <span className={styles.brandTitle} style={{ color: 'white' }}>Dev<span className={styles.logoHighlight}>Songs</span></span>
              </div>
              <p className={styles.footerTagline}>A plataforma musical pensada para desenvolvedores e mentes criativas.</p>
            </div>
            <div className={styles.footerBottom}>
              <p>&copy; {new Date().getFullYear()} DevSongs. Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
