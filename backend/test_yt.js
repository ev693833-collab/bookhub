const https = require('https');

function searchYT(query) {
  return new Promise((resolve) => {
    const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query + ' audio official');
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const matches = [...data.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)];
        if (matches && matches.length > 0) {
          resolve(matches[0][1]);
        } else {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function run() {
  const id1 = await searchYT('Justin Bieber Company');
  const id2 = await searchYT('The Weeknd Blinding Lights');
  const id3 = await searchYT('Cold Water Justin Bieber');
  console.log('Result IDs:', { id1, id2, id3 });
}
run();
