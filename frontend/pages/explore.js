import HomeView from './home';

export default function ExplorePage(props) {
  return <HomeView {...props} forcedTab="comunidade" forcedViewMode="home" pageRoute="/community" />;
}


