const express = require('express');
const https = require('https');
const router = express.Router();

// Cache em memória para buscas rápidas instantâneas (0ms)
const ytCache = new Map();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || 'AIzaSyAaarHsdvH2lcJu2tPQPQmGkrrkHGpIbAU';

async function fetchFromOfficialYouTubeApi(query) {
  if (!YOUTUBE_API_KEY) return null;
  return new Promise((resolve) => {
    const url = 'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=5&q=' + encodeURIComponent(query) + '&key=' + YOUTUBE_API_KEY;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.items && json.items.length > 0) {
            const vids = json.items.map(it => ({
              videoId: it.id?.videoId,
              title: it.snippet?.title || '',
              channel: it.snippet?.channelTitle || ''
            })).filter(it => it.videoId);
            return resolve(vids);
          }
          resolve(null);
        } catch (_) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

function parseTime(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function cleanStr(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

/**
 * Busca candidatos no YouTube fazendo parse robusto do ytInitialData
 */
function fetchYoutubeCandidates(searchUrl) {
  return new Promise((resolve) => {
    const req = https.get(
      searchUrl,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        }
      },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const jsonMatch = data.match(/ytInitialData\s*=\s*({.+?});/s);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[1]);
              const candidates = [];
              function findVR(obj) {
                if (!obj || typeof obj !== 'object') return;
                if (obj.videoRenderer) {
                  const vr = obj.videoRenderer;
                  const length = vr.lengthText?.simpleText || '';
                  const url = vr.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url || '';
                  const isShort = url.includes('/shorts/') ||
                    (length && !length.includes(':')) ||
                    (length.startsWith('0:0') || length.startsWith('0:1'));

                  if (vr.videoId && !isShort) {
                    candidates.push({
                      videoId: vr.videoId,
                      title: vr.title?.runs?.map(r => r.text).join('') || '',
                      owner: vr.ownerText?.runs?.map(r => r.text).join('') || '',
                      lengthStr: length,
                      durationSec: parseTime(length)
                    });
                  }
                  return;
                }
                for (const k of Object.keys(obj)) {
                  findVR(obj[k]);
                }
              }
              findVR(parsed);
              if (candidates.length > 0) return resolve(candidates);
            }
          } catch (_) {}

          // Fallback via regex de videoId
          const matches = [...data.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map(m => m[1]);
          if (matches && matches.length > 0) {
            return resolve(matches.slice(0, 5).map(id => ({
              videoId: id,
              title: '',
              owner: '',
              lengthStr: '',
              durationSec: 0
            })));
          }
          resolve([]);
        });
      }
    );
    req.on('error', () => resolve([]));
    req.setTimeout(4500, () => {
      req.destroy();
      resolve([]);
    });
  });
}

/**
 * Sistema de pontuação e fidelidade acústica:
 * Garante que a versão de estúdio original seja escolhida para faixas de estúdio,
 * e versões ao vivo somente quando a faixa for explicitamente ao vivo.
 * Elimina: compilações de álbum completo, covers, paródias, karaokês e visualizers de turnê.
 */
function scoreCandidate(cand, target) {
  const cTitle = cleanStr(cand.title);
  const cOwner = cleanStr(cand.owner);
  const tTitle = cleanStr(target.title);
  const tArtist = cleanStr(target.artist);

  // 1. DESQUALIFICAÇÃO ABSOLUTA
  // Compilações de álbum inteiro
  if (/álbum completo|album completo|full album|disco completo|discografia|todas as faixas|todas as musicas/i.test(cTitle)) {
    return -999;
  }
  // Vídeos excessivamente longos (>12min) quando a música é normal (<10min)
  if (cand.durationSec > 720 && target.durationSec < 600) {
    return -999;
  }
  // Vídeos muito curtos (<45s) quando a música dura mais de 1min
  if (cand.durationSec > 0 && cand.durationSec < 45 && target.durationSec >= 60) {
    return -999;
  }

  // O vídeo precisa conter pelo menos o nome da música ou termos principais
  const titleWords = tTitle.replace(/[()[\]{}]/g, ' ').split(/\s+/).filter(w => w.length >= 3);
  if (titleWords.length > 0 && !titleWords.some(w => cTitle.includes(w))) {
    return -999;
  }

  // REQUISITO FUNDAMENTAL: O artista PRECISA estar presente no canal ou no título do vídeo!
  // Se nem o título nem o canal mencionam o artista, trata-se de cover por outra banda (ex: 'The Classic Soul Choir')
  const hasArtistInTitle = cTitle.includes(tArtist) || (tArtist.split(/\s+/).filter(w => w.length >= 3).some(w => cTitle.includes(w)));
  const hasArtistInOwner = cOwner.includes(tArtist) || tArtist.includes(cOwner) || (tArtist.split(/\s+/).filter(w => w.length >= 3).some(w => cOwner.includes(w)));

  if (!hasArtistInTitle && !hasArtistInOwner) {
    return -999; // Rejeição imediata de tributos/covers gravados por outros artistas
  }

  // Se for canal auto-gerado '- Topic', o canal TEM que pertencer ao próprio artista!
  if (cOwner.includes('- topic') && !hasArtistInOwner) {
    return -999;
  }

  // Rejeita versões cover temáticas (ex: 'Soul Version', 'Choir Version', 'Lofi Version', etc.)
  if (/soul version|piano version|tribute|cover|choir version|lofi version|guitar version|8-bit version|orchestra version|samba version|pagode version|forro version/i.test(cTitle)) {
    return -999;
  }

  let score = 0;

  // 2. Fidelidade ao título
  if (cTitle.includes(tTitle)) {
    score += 50;
  }

  // 3. Detecção e proteção contra versões 'Ao Vivo' / 'Live' indesejadas (ex: Numb em São Paulo)
  const targetIsLive = /ao vivo|\[live\]|\(live\)|live in|live at|live show|en vivo/i.test(tTitle);
  const candIsLive = /ao vivo|\[live\]|\(live\)|live in|live at|live show|en vivo|visualizador oficial|visualizer/i.test(cTitle);
  if (!targetIsLive && candIsLive) {
    score -= 300;
  } else if (targetIsLive && candIsLive) {
    score += 70;
  }

  // 4. Detecção e proteção contra versões acústicas
  const targetIsAcoustic = /ac[uú]stico|acoustic|unplugged/i.test(tTitle);
  const candIsAcoustic = /ac[uú]stico|acoustic|unplugged/i.test(cTitle);
  if (!targetIsAcoustic && candIsAcoustic) {
    score -= 200;
  } else if (targetIsAcoustic && candIsAcoustic) {
    score += 60;
  }

  // 5. Proteção contra remixes, mashups, covers e paródias
  const targetIsRemix = /remix|mix/i.test(tTitle);
  const candIsMashupOrCover = /mashup|\bvs\b|\bcover\b|karaoke|instrumental|react|reaction|guitar cover|drum cover|tutorial|par[oó]dia|parody|speed up|slowed|bass boosted|nightcore|remake/i.test(cTitle);
  if (candIsMashupOrCover) {
    score -= 350;
  }
  const candIsRemix = /\bremix\b|\bmix\b|\bedit\b/i.test(cTitle);
  if (!targetIsRemix && candIsRemix) {
    score -= 150;
  }

  // 6. Autoridade do Canal / Artista
  // Canal '- Topic' do próprio artista tem o áudio de estúdio oficial licenciado pelas gravadoras!
  if (cOwner.includes('- topic') && hasArtistInOwner) {
    score += 70;
  } else if (hasArtistInOwner) {
    score += 50;
  }
  if (hasArtistInTitle) {
    score += 25;
  }

  // 7. Selo de faixa oficial
  if (/official music video|official video|clipe oficial|video oficial|official audio|[aá]udio oficial/i.test(cTitle)) {
    score += 35;
  }

  // 8. Comparação com a duração esperada da faixa
  if (target.durationSec > 0 && cand.durationSec > 0) {
    const diff = Math.abs(cand.durationSec - target.durationSec);
    if (diff <= 5) score += 40;
    else if (diff <= 15) score += 25;
    else if (diff <= 35) score += 15;
    else if (diff > 60) score -= 30;
    else if (diff > 120) score -= 80;
  }

  return score;
}

async function searchYouTubeVideoId(input) {
  let query = '';
  let title = '';
  let artist = '';
  let album = '';
  let durationSec = 0;

  if (typeof input === 'object' && input !== null) {
    title = (input.title || '').trim();
    artist = (input.artist || '').trim();
    album = (input.album || '').trim();
    durationSec = Number(input.durationSec || input.duration) || 0;
    query = (input.q || `${artist} ${title}`).trim();
  } else {
    query = (input || '').trim();
  }

  if (!query && !title) return null;

  // Normaliza título removendo ruídos de reedição e tags genéricas
  const cleanTitle = title
    .replace(/\[remastered\]/gi, '')
    .replace(/\(remastered[^)]*\)/gi, '')
    .replace(/\(bonus[^)]*\)/gi, '')
    .replace(/\[explicit\]/gi, '')
    .replace(/\(explicit\)/gi, '')
    .trim();

  const isLive = /ao vivo|live|show|concerto|apoteose/i.test(`${title} ${album}`);
  const isAcoustic = /ac[uú]stico|acoustic|unplugged/i.test(`${title} ${album}`);
  const isRemix = /remix|mix|edit/i.test(`${title} ${album}`);

  const cacheKey = `v3__${cleanStr(artist)}__${cleanStr(cleanTitle)}__${isLive ? 'live' : isAcoustic ? 'acoustic' : 'studio'}`;
  if (ytCache.has(cacheKey)) {
    return ytCache.get(cacheKey);
  }

  // 1. Prioridade Máxima: API Oficial do YouTube com videoEmbeddable=true (0ms de bloqueio, vídeos 100% incorporáveis)
  try {
    const apiQuery = isLive
      ? `${artist} ${cleanTitle} ao vivo`
      : isAcoustic
        ? `${artist} ${cleanTitle} acustico`
        : isRemix
          ? `${artist} ${cleanTitle} remix`
          : `${artist} ${cleanTitle}`;

    const apiResults = await fetchFromOfficialYouTubeApi(apiQuery);
    if (apiResults && apiResults.length > 0) {
      const best = apiResults[0].videoId;
      const alt = apiResults[1]?.videoId || null;
      const resObj = { videoId: best, altVideoId: alt };
      if (ytCache.size > 2000) ytCache.clear();
      ytCache.set(cacheKey, resObj);
      return resObj;
    }
  } catch (_) {}

  // 2. Fallback via busca tradicional com parser HTML ytInitialData
  const searchQueries = [];
  if (isLive) {
    searchQueries.push(`${artist} ${cleanTitle} ao vivo`);
    searchQueries.push(`${artist} ${cleanTitle} live`);
  } else if (isAcoustic) {
    searchQueries.push(`${artist} ${cleanTitle} acustico`);
    searchQueries.push(`${artist} ${cleanTitle} acoustic`);
  } else if (isRemix) {
    searchQueries.push(`${artist} ${cleanTitle} remix`);
  } else {
    // Versão de estúdio original
    searchQueries.push(`${artist} ${cleanTitle} official audio`);
    searchQueries.push(`${artist} ${cleanTitle}`);
    searchQueries.push(`${artist} ${cleanTitle} clipe oficial`);
    searchQueries.push(`${artist} ${cleanTitle} musica`);
  }

  const target = {
    title: cleanTitle,
    artist,
    album,
    durationSec
  };

  const seenIds = new Set();
  const allCandidates = [];

  for (const q of searchQueries) {
    const cands = await fetchYoutubeCandidates('https://www.youtube.com/results?search_query=' + encodeURIComponent(q));
    for (const c of cands) {
      if (!seenIds.has(c.videoId)) {
        seenIds.add(c.videoId);
        allCandidates.push(c);
      }
    }
    // Para assim que acumular candidatos suficientes de qualidade
    if (allCandidates.length >= 6) break;
  }

  let bestVideoId = null;

  if (allCandidates.length > 0) {
    const scored = allCandidates.map(c => ({
      ...c,
      score: scoreCandidate(c, target)
    })).filter(c => c.score > 0).sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      bestVideoId = scored[0].videoId;
    } else {
      // Fallback: se nenhum atingiu score positivo, pega o primeiro não desqualificado
      const notDisqualified = allCandidates.filter(c => scoreCandidate(c, target) > -500);
      if (notDisqualified.length > 0) {
        bestVideoId = notDisqualified[0].videoId;
      }
    }
  }

  // Fallback final
  if (!bestVideoId && allCandidates[0]) {
    bestVideoId = allCandidates[0].videoId;
  }

  if (bestVideoId) {
    const resObj = { videoId: bestVideoId, altVideoId: allCandidates[1]?.videoId || null };
    if (ytCache.size > 2000) ytCache.clear();
    ytCache.set(cacheKey, resObj);
    return resObj;
  }

  return { videoId: null, altVideoId: null };
}

/**
 * GET /api/youtube/search?q=Linkin+Park+Numb&title=Numb&artist=Linkin+Park&durationSec=187
 * Retorna o videoId do YouTube da versão exata e oficial (estúdio, clipe original, sem visualizers indesejados)
 */
router.get('/search', async (req, res) => {
  const { q, title, artist, album, durationSec, duration } = req.query;
  if (!q && !title) {
    return res.status(400).json({ error: 'Parâmetro "q" ou "title" é obrigatório' });
  }

  try {
    const searchRes = await searchYouTubeVideoId({
      q,
      title,
      artist,
      album,
      durationSec: durationSec || duration
    });

    const videoId = typeof searchRes === 'object' && searchRes !== null ? searchRes.videoId : searchRes;
    const altVideoId = typeof searchRes === 'object' && searchRes !== null ? searchRes.altVideoId : null;

    return res.json({
      query: q || `${artist || ''} ${title || ''}`.trim(),
      videoId: videoId || null,
      altVideoId: altVideoId || null,
      embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1` : null
    });
  } catch (err) {
    console.error('Erro na busca do YouTube:', err);
    return res.status(500).json({ error: 'Erro ao buscar no YouTube' });
  }
});

const suggestCache = new Map();

/**
 * GET /api/youtube/suggest?q=djonga
 * Retorna sugestões reais do YouTube Music em tempo real
 */
router.get('/suggest', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ queries: [] });

  const qClean = (q || '').toLowerCase().trim();
  if (suggestCache.has(qClean)) {
    return res.json({ queries: suggestCache.get(qClean) });
  }

  try {
    const url = 'https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=' + encodeURIComponent(q);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    const data = await response.json();
    const queries = data[1] || [];
    if (suggestCache.size > 500) suggestCache.clear();
    suggestCache.set(qClean, queries);
    return res.json({ queries });
  } catch (err) {
    return res.json({ queries: [] });
  }
});

module.exports = router;
