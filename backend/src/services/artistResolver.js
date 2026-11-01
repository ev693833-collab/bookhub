/**
 * artistResolver.js
 * Serviço centralizado de identificação e associação de perfis de artistas no DevSongs.
 * Utilizado de forma consistente entre acervo, busca, playlists e biblioteca.
 */

const cleanStr = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

// Normalização segura: minúsculas, sem acentos, sem pontuação
const cleanSimple = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['"`.,\s-]/g, '');

// Normalização para variações fonéticas comuns conhecidas (ex: Priscila / Pricila)
const phoneticNorm = (s) => cleanSimple(s).replace(/sc/g, 'c');

/**
 * Normaliza prefixo de MC para comparação segura
 */
const stripMC = (s) => cleanSimple(s).replace(/^mc/, '');

/**
 * Mapeamento estático de aliases / variações conhecidas de artistas
 */
const KNOWN_ALIASES = {
  'bk': ['bk', "bk'", 'abebe bikila', 'abebe'],
  'pricila areba': ['pricila areba', 'priscila areba', 'priscila', 'pricila'],
  'priscila areba': ['pricila areba', 'priscila areba', 'priscila', 'pricila'],
  'jovem dex': ['jovem dex', 'joven dex', 'dex'],
  'mc gp': ['mc gp', 'mcgp', 'gp'],
  'mc cabelinho': ['mc cabelinho', 'mccabelinho', 'cabelinho'],
  'brandao85': ['brandao85', 'brandao 85', 'brandão85', 'brandão 85', 'brandao', 'brandão'],
  'forrozao tropykalia': ['forrozao tropykalia', 'forrozão tropykália', 'forrozao tropikalia', 'tropykalia', 'tropykália', 'tropikalia'],
  'justin bieber': ['justin bieber', 'justin', 'bieber'],
  'baco exu do blues': ['baco exu do blues', 'baco exu', 'baco'],
  'teto': ['teto'],
  'matue': ['matue', 'matuê'],
  'djonga': ['djonga'],
  'veigh': ['veigh'],
  'leviano': ['leviano'],
  'wiu': ['wiu'],
  'vmz': ['vmz'],
  'alee': ['alee'],
  'qualy': ['qualy'],
  'leall': ['leall'],
  'scalene': ['scalene']
};

/**
 * Verifica se dois nomes de artistas correspondem com segurança
 */
function isSafeArtistMatch(target, candidate) {
  if (!target || !candidate) return false;
  const tClean = cleanSimple(target);
  const cClean = cleanSimple(candidate);
  if (!tClean || !cClean) return false;

  // 1. Igualdade estrita normalizada
  if (tClean === cClean) return true;

  // 2. Variação fonética (ex: Pricila vs Priscila)
  if (phoneticNorm(target) === phoneticNorm(candidate)) return true;

  // 3. Variação de prefixo MC (ex: MC GP vs GP, MC Cabelinho vs Cabelinho)
  if (stripMC(target) === stripMC(candidate) && stripMC(target).length >= 2) return true;

  // 4. Aliases conhecidos
  for (const [key, aliases] of Object.entries(KNOWN_ALIASES)) {
    const keyClean = cleanSimple(key);
    const inAliasesTarget = tClean === keyClean || aliases.some(a => cleanSimple(a) === tClean);
    const inAliasesCandidate = cClean === keyClean || aliases.some(a => cleanSimple(a) === cClean);
    if (inAliasesTarget && inAliasesCandidate) return true;
  }

  return false;
}

/**
 * Divide uma string de artista em seus participantes individuais
 */
function splitArtistParticipants(artistString) {
  if (!artistString || typeof artistString !== 'string') return [];

  // Divisão por vírgula, &, barra, ' e ', ' feat. ', ' ft. ', ' part. ', '+'
  const parts = artistString
    .split(/[,&/+]|(?:\s+e\s+)|\s+feat\.?\s+|\s+ft\.?\s+|\s+part\.?\s+/i)
    .map(p => p.trim())
    .filter(Boolean);

  // Evita duplicatas na lista dividida
  const unique = [];
  const seen = new Set();
  parts.forEach(p => {
    const normKey = cleanSimple(p);
    if (normKey && !seen.has(normKey)) {
      seen.add(normKey);
      unique.push(p);
    }
  });

  return unique;
}

/**
 * Encontra o artista cadastrado correspondente a um nome ou objeto
 */
function findMatchingArtist(nameOrCandidate, artistCatalog) {
  if (!nameOrCandidate || !artistCatalog || artistCatalog.length === 0) return null;

  // Se já for um ID direto
  if (typeof nameOrCandidate === 'number') {
    return artistCatalog.find(a => Number(a.id) === nameOrCandidate) || null;
  }

  const queryName = typeof nameOrCandidate === 'string' ? nameOrCandidate : nameOrCandidate.name;
  if (!queryName) return null;

  // 1. Busca por ID se existir
  if (nameOrCandidate.artist_id || nameOrCandidate.id) {
    const targetId = Number(nameOrCandidate.artist_id || nameOrCandidate.id);
    const byId = artistCatalog.find(a => Number(a.id) === targetId);
    if (byId) return byId;
  }

  // 2. Busca direta por nome exato / aliases seguros
  for (const art of artistCatalog) {
    if (isSafeArtistMatch(queryName, art.name)) {
      return art;
    }
    // Checa aliases do artista no banco
    if (Array.isArray(art.aliases)) {
      if (art.aliases.some(alias => isSafeArtistMatch(queryName, alias))) {
        return art;
      }
    }
  }

  return null;
}

/**
 * Resolve todos os participantes de uma faixa relacionando com o acervo de artistas.
 * Retorna array de objetos:
 * [
 *   {
 *     name: "Brandão85",
 *     artistId: 3,
 *     hasProfile: true,
 *     avatarUrl: "...",
 *     bio: "...",
 *     role: "primary"
 *   }, ...
 * ]
 */
function resolveTrackParticipants(track, artistCatalog) {
  if (!track) return [];
  const catalog = artistCatalog || [];

  // Se a faixa já tiver participantes estruturados no banco
  if (Array.isArray(track.participants) && track.participants.length > 0) {
    return track.participants.map(p => {
      const matched = findMatchingArtist(p.artist_id || p.id || p.name, catalog);
      return {
        name: p.name || (matched ? matched.name : 'Artista'),
        artistId: matched ? matched.id : (p.artist_id || null),
        hasProfile: Boolean(matched && matched.id),
        avatarUrl: matched ? matched.avatar_url : null,
        bio: matched ? matched.bio : null,
        role: p.role || 'primary'
      };
    });
  }

  // Se a faixa tiver artist_ids array
  if (Array.isArray(track.artist_ids) && track.artist_ids.length > 0) {
    const fromIds = track.artist_ids.map((aId, idx) => {
      const matched = catalog.find(a => Number(a.id) === Number(aId));
      if (matched) {
        return {
          name: matched.name,
          artistId: matched.id,
          hasProfile: true,
          avatarUrl: matched.avatar_url,
          bio: matched.bio,
          role: idx === 0 ? 'primary' : 'feat'
        };
      }
      return null;
    }).filter(Boolean);

    if (fromIds.length > 0) return fromIds;
  }

  // Divisão textual de track.artist
  const artistStr = track.artist || '';
  const rawParts = splitArtistParticipants(artistStr);

  if (rawParts.length === 0) {
    if (track.artist_id) {
      const matched = catalog.find(a => Number(a.id) === Number(track.artist_id));
      if (matched) {
        return [{
          name: matched.name,
          artistId: matched.id,
          hasProfile: true,
          avatarUrl: matched.avatar_url,
          bio: matched.bio,
          role: 'primary'
        }];
      }
    }
    return [];
  }

  const results = [];
  const seenIds = new Set();

  rawParts.forEach((partName, idx) => {
    const matched = findMatchingArtist(partName, catalog);
    if (matched) {
      if (!seenIds.has(matched.id)) {
        seenIds.add(matched.id);
        results.push({
          name: matched.name,
          artistId: matched.id,
          hasProfile: true,
          avatarUrl: matched.avatar_url,
          bio: matched.bio,
          role: idx === 0 ? 'primary' : 'feat'
        });
      }
    } else {
      results.push({
        name: partName,
        artistId: null,
        hasProfile: false,
        avatarUrl: null,
        bio: null,
        role: idx === 0 ? 'primary' : 'feat'
      });
    }
  });

  return results;
}

module.exports = {
  cleanStr,
  cleanSimple,
  phoneticNorm,
  stripMC,
  KNOWN_ALIASES,
  isSafeArtistMatch,
  splitArtistParticipants,
  findMatchingArtist,
  resolveTrackParticipants
};

