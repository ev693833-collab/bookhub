const express = require('express');
const https = require('https');
const router = express.Router();

// Cache em memória para buscas rápidas instantâneas (0ms)
const ytCache = new Map();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || 'AIzaSyAaarHsdvH2lcJu2tPQPQmGkrrkHGpIbAU';

function parseIsoDuration(iso) {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || 0, 10);
  const minutes = parseInt(match[2] || 0, 10);
  const seconds = parseInt(match[3] || 0, 10);
  return hours * 3600 + minutes * 60 + seconds;
}

async function fetchFromOfficialYouTubeApi(query) {
  if (!YOUTUBE_API_KEY) return null;
  return new Promise((resolve) => {
    const url = "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=8&q=" + encodeURIComponent(query) + "&key=" + YOUTUBE_API_KEY;
    https.get(url, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.items && json.items.length > 0) {
            const vids = json.items.map(it => ({
              videoId: it.id?.videoId,
              title: it.snippet?.title || "",
              channel: it.snippet?.channelTitle || "",
              durationSec: 0
            })).filter(it => it.videoId);

            const ids = vids.map(v => v.videoId).join(",");
            const detailsUrl = "https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=" + ids + "&key=" + YOUTUBE_API_KEY;
            https.get(detailsUrl, (res2) => {
              let d2 = "";
              res2.on("data", chunk => d2 += chunk);
              res2.on("end", () => {
                try {
                  const j2 = JSON.parse(d2);
                  const durMap = {};
                  j2.items?.forEach(item => {
                    durMap[item.id] = parseIsoDuration(item.contentDetails?.duration);
                  });
                  vids.forEach(v => {
                    v.durationSec = durMap[v.videoId] || 0;
                  });
                  resolve(vids);
                } catch (_) {
                  resolve(vids);
                }
              });
            }).on("error", () => resolve(vids));
            return;
          }
          resolve(null);
        } catch (_) {
          resolve(null);
        }
      });
    }).on("error", () => resolve(null));
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
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\.(wav\d*|mp3|m4a|flac|ogg)/gi, '')
    .trim();
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
  const cOwner = cleanStr(cand.owner || cand.channel);
  const tTitle = cleanStr(target.title);
  const tArtist = cleanStr(target.artist);
  const tAlbum = cleanStr(target.album);

  // 1. DESQUALIFICAÇÃO ABSOLUTA
  if (/álbum completo|album completo|full album|disco completo|discografia|todas as faixas|todas as musicas/i.test(cTitle)) {
    return -999;
  }
  // Vídeos excessivamente longos (>12min) quando a faixa é normal (<10min)
  if (cand.durationSec > 720 && target.durationSec < 600) {
    return -999;
  }
  // Desqualifica shorts e vídeos muito curtos (<50s) quando a música dura mais de 1min
  if (/shorts|#shorts/i.test(cTitle) || (cand.durationSec > 0 && cand.durationSec < 50 && target.durationSec >= 60)) {
    return -999;
  }

  // Título da música
  const mainTitle = tTitle.replace(/\([^)]*\)/g, "").replace(/\[[^\]]*\]/g, "").trim();
  const titleWords = mainTitle.split(/\s+/).filter(w => w.length >= 3 && !["ao", "vivo", "live"].includes(w));
  if (titleWords.length > 0 && !titleWords.some(w => cTitle.includes(w))) {
    return -999;
  }

  // Artista presente
  const hasArtistInTitle = cTitle.includes(tArtist) || (tArtist.split(/\s+/).filter(w => w.length >= 3).some(w => cTitle.includes(w)));
  const hasArtistInOwner = cOwner.includes(tArtist) || tArtist.includes(cOwner) || (tArtist.split(/\s+/).filter(w => w.length >= 3).some(w => cOwner.includes(w)));
  if (!hasArtistInTitle && !hasArtistInOwner) {
    return -999;
  }

  if (/tribute|karaoke|guitar cover|drum cover|parodia|parody/i.test(cTitle)) {
    return -999;
  }

  let score = 0;

  if (cTitle.includes(mainTitle)) {
    score += 60;
  }

  // Detecção e Alinhamento Rigoroso de AO VIVO vs ESTÚDIO:
  const targetIsLive = /ao vivo|\[live\]|\(live\)|live in|live at|live show|en vivo|canec[aã]o/i.test(`${tTitle} ${tAlbum}`);
  const candIsLive = /ao vivo|\[live\]|\(live\)|live in|live at|live show|en vivo|especial|show|turn[eê]|canec[aã]o/i.test(cTitle);
  const candIsExplicitStudio = /vers[aã]o (de )?est[uú]dio|studio version|original studio/i.test(cTitle);

  if (!targetIsLive && candIsLive) {
    score -= 300; // Queremos estúdio, mas o vídeo é ao vivo
  } else if (targetIsLive && candIsExplicitStudio) {
    score -= 300; // Queremos ao vivo, mas o vídeo é explicitamente de estúdio
  } else if (targetIsLive && candIsLive) {
    score += 80;
  }

  // Se álbum mencionar Canecão, ano (ex: 1988), etc.
  if (targetIsLive) {
    if (tAlbum && cTitle.includes(cleanStr(tAlbum))) score += 70;
    if (/1988/.test(tTitle + " " + tAlbum) && /1988/.test(cTitle)) score += 60;
    if (/canec[aã]o/.test(tTitle + " " + tAlbum) && /canec[aã]o/.test(cTitle)) score += 60;
  }

  // Autoridade do canal
  if (cOwner.includes("- topic") && hasArtistInOwner) {
    score += 60;
  } else if (hasArtistInOwner) {
    score += 40;
  }
  if (hasArtistInTitle) {
    score += 25;
  }

  if (/official music video|official video|clipe oficial|video oficial|official audio|[aá]udio oficial/i.test(cTitle)) {
    score += 35;
  }

  // COMPARAÇÃO RIGOROSA DE DURAÇÃO
  if (target.durationSec > 0 && cand.durationSec > 0) {
    const diff = Math.abs(cand.durationSec - target.durationSec);
    if (diff <= 3) score += 80;
    else if (diff <= 8) score += 50;
    else if (diff <= 15) score += 30;
    else if (diff <= 25) score += 10;
    else if (diff <= 40) score -= 40;
    else if (diff <= 60) score -= 150;
    else if (diff <= 90) score -= 300;
    else score -= 999; // Mais de 90s de diferença desqualifica (versão diferente/especial com fala)
  }

  return score;
}

async function searchYouTubeVideoId(input) {
  let query = "";
  let title = "";
  let artist = "";
  let album = "";
  let durationSec = 0;
  let explicitVideoId = null;

  if (typeof input === "object" && input !== null) {
    title = (input.title || "").trim();
    artist = (input.artist || "").trim();
    album = (input.album || "").trim();
    durationSec = Number(input.durationSec || input.duration) || 0;
    explicitVideoId = (input.youtubeVideoId || input.youtube_video_id || "").trim();
    query = (input.q || `${artist} ${title}`).trim();
  } else {
    query = (input || "").trim();
  }

  // Se já veio com ID pré-vinculado verificado no banco de dados, retorna diretamente com 0ms de latência
  if (explicitVideoId && /^[a-zA-Z0-9_-]{11}$/.test(explicitVideoId)) {
    return {
      videoId: explicitVideoId,
      altVideoId: null
    };
  }

  if (!query && !title) return null;

  // Remove extensões de arquivos de áudio do artista (ex: .wav1, .mp3, etc.)
  artist = artist.replace(/\.(wav\d*|mp3|m4a|flac|ogg)/gi, "").trim();

  // Curadoria oficial prioritária: LUZ, CAMA E AÇÃO (Alee & MC Cabelinho - CAOS DLX)
  if (/luz[, ]+cama e a[cç][aã]o/i.test(title) && (/alee|cabelinho/i.test(artist) || !artist)) {
    return {
      videoId: "LC_y6kEJ69g",
      altVideoId: "3u9yVQElPks"
    };
  }

  // Normaliza título removendo ruídos de reedição e tags genéricas
  const cleanTitle = title
    .replace(/\[remastered\]/gi, "")
    .replace(/\(remastered[^)]*\)/gi, "")
    .replace(/\(bonus[^)]*\)/gi, "")
    .replace(/\[explicit\]/gi, "")
    .replace(/\(explicit\)/gi, "")
    .trim();

  const isLive = /ao vivo|live|show|concerto|apoteose|canec[aã]o/i.test(`${title} ${album}`);
  const isAcoustic = /ac[uú]stico|acoustic|unplugged/i.test(`${title} ${album}`);
  const isRemix = /remix|mix|edit/i.test(`${title} ${album}`);

  const cacheKey = `v4__${cleanStr(artist)}__${cleanStr(cleanTitle)}__${isLive ? "live" : isAcoustic ? "acoustic" : "studio"}__${durationSec}`;
  if (ytCache.has(cacheKey)) {
    return ytCache.get(cacheKey);
  }

  const target = {
    title: cleanTitle,
    artist,
    album,
    durationSec
  };

  // 1. Prioridade Máxima: API Oficial do YouTube com videoEmbeddable=true e durações reais
  try {
    const apiQuery = isLive
      ? (album && /ao vivo|live/i.test(album) ? `${artist} ${cleanTitle} ${album}` : `${artist} ${cleanTitle} ao vivo`)
      : isAcoustic
        ? `${artist} ${cleanTitle} acustico`
        : isRemix
          ? `${artist} ${cleanTitle} remix`
          : `${artist} ${cleanTitle}`;

    const apiResults = await fetchFromOfficialYouTubeApi(apiQuery);
    if (apiResults && apiResults.length > 0) {
      const scoredApi = apiResults.map(it => ({
        ...it,
        score: scoreCandidate({
          videoId: it.videoId,
          title: it.title,
          owner: it.channel,
          durationSec: it.durationSec,
          lengthStr: ""
        }, target)
      })).filter(c => c.score > 0).sort((a, b) => b.score - a.score);

      if (scoredApi.length > 0) {
        const best = scoredApi[0].videoId;
        const alt = scoredApi[1]?.videoId || null;
        const resObj = { videoId: best, altVideoId: alt };
        if (ytCache.size > 2000) ytCache.clear();
        ytCache.set(cacheKey, resObj);
        return resObj;
      }
    }
  } catch (_) {}

  // 2. Fallback via busca tradicional com parser HTML ytInitialData
  const searchQueries = [];
  if (isLive) {
    if (album && /ao vivo|live/i.test(album)) {
      searchQueries.push(`${artist} ${cleanTitle} ${album}`);
    }
    searchQueries.push(`${artist} ${cleanTitle} ao vivo`);
    searchQueries.push(`${artist} ${cleanTitle} live`);
    if (/1988/.test(`${title} ${album}`)) {
      searchQueries.push(`${artist} ${cleanTitle} ao vivo 1988`);
    }
  } else if (isAcoustic) {
    searchQueries.push(`${artist} ${cleanTitle} acustico`);
    searchQueries.push(`${artist} ${cleanTitle} acoustic`);
  } else if (isRemix) {
    searchQueries.push(`${artist} ${cleanTitle} remix`);
  } else {
    searchQueries.push(`${artist} ${cleanTitle} official audio`);
    searchQueries.push(`${artist} ${cleanTitle}`);
    searchQueries.push(`${artist} ${cleanTitle} clipe oficial`);
    searchQueries.push(`${artist} ${cleanTitle} musica`);
  }

  const seenIds = new Set();
  const allCandidates = [];

  for (const q of searchQueries) {
    const cands = await fetchYoutubeCandidates("https://www.youtube.com/results?search_query=" + encodeURIComponent(q));
    for (const c of cands) {
      if (!seenIds.has(c.videoId)) {
        seenIds.add(c.videoId);
        allCandidates.push(c);
      }
    }
    if (allCandidates.length >= 8) break;
  }

  let bestVideoId = null;
  let altVideoId = null;

  if (allCandidates.length > 0) {
    const scored = allCandidates.map(c => ({
      ...c,
      score: scoreCandidate(c, target)
    })).filter(c => c.score > 0).sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      bestVideoId = scored[0].videoId;
      altVideoId = scored.length > 1 ? scored[1].videoId : null;
    } else {
      const notDisqualified = allCandidates.filter(c => scoreCandidate(c, target) > -500);
      if (notDisqualified.length > 0) {
        bestVideoId = notDisqualified[0].videoId;
        altVideoId = notDisqualified.length > 1 ? notDisqualified[1].videoId : null;
      }
    }
  }

  if (!bestVideoId) {
    const notDisqualified = allCandidates.filter(c => scoreCandidate(c, target) >= 0);
    if (notDisqualified.length > 0) {
      bestVideoId = notDisqualified[0].videoId;
      altVideoId = notDisqualified.length > 1 ? notDisqualified[1].videoId : null;
    }
  }

  if (bestVideoId) {
    const resObj = { videoId: bestVideoId, altVideoId: altVideoId || null };
    if (ytCache.size > 2000) ytCache.clear();
    ytCache.set(cacheKey, resObj);
    return resObj;
  }

  return { videoId: null, altVideoId: null };
}

/**
 * Retorna o videoId do YouTube da versão exata e oficial (estúdio, clipe original, sem visualizers indesejados)
 */
router.get('/search', async (req, res) => {
  const { q, title, artist, album, durationSec, duration, youtubeVideoId, youtube_video_id } = req.query;
  if (!q && !title) {
    return res.status(400).json({ error: 'Parâmetro "q" ou "title" é obrigatório' });
  }

  try {
    const searchRes = await searchYouTubeVideoId({
      q,
      title,
      artist,
      album,
      durationSec: durationSec || duration,
      youtubeVideoId: youtubeVideoId || youtube_video_id
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
