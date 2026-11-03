import { useRouter } from 'next/router';
import HomeView from '../home';

export default function ArtistPage(props) {
  const router = useRouter();
  const { id } = router.query;

  return <HomeView {...props} forcedArtist={id} forcedViewMode="artist" pageRoute="/artist" />;
}

