import { useRouter } from 'next/router';
import HomeView from '../home';

export default function AlbumPage(props) {
  const router = useRouter();
  const { id } = router.query;

  return <HomeView {...props} forcedAlbumId={id} forcedViewMode="album" pageRoute="/album" />;
}

