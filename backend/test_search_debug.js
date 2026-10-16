async function test() {
  const queries = ['lil suzy', 'samba enredo'];
  for (const q of queries) {
    console.log('=== Testing query:', q, '===');
    const cleanSimple = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['"`.,\s]/g, '');
    const qClean = cleanSimple(q);

    const tracksRes = await fetch('https://api.deezer.com/search?q=' + encodeURIComponent(q) + '&limit=20').then(r => r.json()).catch(e => ({ error: e.message }));
    const artistRes = await fetch('https://api.deezer.com/search/artist?q=' + encodeURIComponent(q) + '&limit=6').then(r => r.json()).catch(e => ({ error: e.message }));

    console.log('Tracks count:', tracksRes.data?.length);
    console.log('Artists:', artistRes.data?.map(a => ({ name: a.name, fans: a.nb_fan })));

    let artistObj = null;
    if (artistRes.data && artistRes.data.length > 0) {
      const candidates = artistRes.data.filter(a => {
        const n = cleanSimple(a.name);
        const isCollab = !qClean.includes(',') && !qClean.includes('&') && (n.includes('feat') || n.includes('featuring') || (n.includes(',') && n.includes('&')));
        const matchesName = n === qClean || n.startsWith(qClean) || qClean.startsWith(n);
        const isPopular = (a.nb_fan || 0) >= 10000 || (n === qClean && (a.nb_fan || 0) >= 3000);
        return matchesName && !isCollab && isPopular;
      });
      console.log('Candidates for artistObj:', candidates.map(c => c.name));
    }
  }
}
test();
