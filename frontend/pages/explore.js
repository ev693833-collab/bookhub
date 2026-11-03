import HomeView from './home';

export default function ExplorePage(props) {
  return <HomeView {...props} forcedTab="explorar" forcedViewMode="home" pageRoute="/explore" />;
}

