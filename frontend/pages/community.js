import HomeView from './home';

export default function CommunityPage(props) {
  return <HomeView {...props} forcedTab="comunidade" forcedViewMode="home" pageRoute="/community" />;
}

