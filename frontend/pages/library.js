import HomeView from './home';

export default function LibraryPage(props) {
  return <HomeView {...props} forcedTab="biblioteca" />;
}

