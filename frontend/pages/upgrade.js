import HomeView from './home';

export default function UpgradePage(props) {
  return <HomeView {...props} forcedTab="upgrade" forcedViewMode="home" pageRoute="/upgrade" />;
}

