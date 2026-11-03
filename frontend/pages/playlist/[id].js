import { useRouter } from 'next/router';
import HomeView from '../home';

export default function PlaylistPage(props) {
  const router = useRouter();
  const { id } = router.query;

  return <HomeView {...props} forcedPlaylistId={id} forcedTab="biblioteca" forcedViewMode="home" pageRoute="/playlist" />;
}

