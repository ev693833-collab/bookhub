const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth');
const optionalAuth = verifyToken.optional;
const libraryStorage = require('../services/libraryStorage');

// =========================================================================
// 1. PLAYLISTS ROUTES
// =========================================================================

// GET /api/library/playlists - Listar playlists do usuário logado (+ públicas se solicitado)
router.get('/playlists', verifyToken, async (req, res) => {
  try {
    const includePublic = req.query.includePublic === 'true';
    const playlists = await libraryStorage.getPlaylists(req.user.id, includePublic);
    res.json({ success: true, count: playlists.length, playlists });
  } catch (err) {
    console.error('Erro ao listar playlists:', err);
    res.status(500).json({ error: 'Erro ao carregar playlists da biblioteca.' });
  }
});

// POST /api/library/playlists - Criar uma nova playlist
router.post('/playlists', verifyToken, async (req, res) => {
  try {
    const { name, description, cover_url, privacy } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'O nome da playlist é obrigatório.' });
    }

    const playlist = await libraryStorage.createPlaylist(req.user.id, {
      name,
      description,
      cover_url,
      privacy
    });

    res.status(201).json({ success: true, message: 'Playlist criada com sucesso!', playlist });
  } catch (err) {
    console.error('Erro ao criar playlist:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao criar playlist.' });
  }
});

// GET /api/library/playlists/:id - Detalhes da playlist (com checagem de privacidade: particular, não listada, pública)
router.get('/playlists/:id', optionalAuth, async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const playlist = await libraryStorage.getPlaylistById(req.params.id, userId);

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist não encontrada.' });
    }

    res.json({ success: true, playlist });
  } catch (err) {
    if (err.statusCode === 403) {
      return res.status(403).json({ error: err.message });
    }
    console.error('Erro ao obter detalhes da playlist:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao carregar detalhes da playlist.' });
  }
});

// PUT /api/library/playlists/:id - Editar nome, descrição, capa e privacidade
router.put('/playlists/:id', verifyToken, async (req, res) => {
  try {
    const { name, description, cover_url, privacy } = req.body;
    const playlist = await libraryStorage.updatePlaylist(req.params.id, req.user.id, {
      name,
      description,
      cover_url,
      privacy
    });

    res.json({ success: true, message: 'Playlist atualizada com sucesso!', playlist });
  } catch (err) {
    console.error('Erro ao atualizar playlist:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao atualizar playlist.' });
  }
});

// DELETE /api/library/playlists/:id - Excluir playlist (somente proprietário)
router.delete('/playlists/:id', verifyToken, async (req, res) => {
  try {
    const result = await libraryStorage.deletePlaylist(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    console.error('Erro ao excluir playlist:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao excluir playlist.' });
  }
});

// POST /api/library/playlists/:id/tracks - Adicionar música à playlist
router.post('/playlists/:id/tracks', verifyToken, async (req, res) => {
  try {
    const { track_id } = req.body;
    if (!track_id) {
      return res.status(400).json({ error: 'O ID da música é obrigatório.' });
    }

    const cleanTrackId = typeof track_id === 'string' ? track_id.replace('ct-', '') : track_id;
    const playlist = await libraryStorage.addTrackToPlaylist(req.params.id, req.user.id, cleanTrackId);
    res.status(201).json({ success: true, message: 'Música adicionada à playlist!', playlist });
  } catch (err) {
    console.error('Erro ao adicionar música na playlist:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao adicionar música à playlist.' });
  }
});

// DELETE /api/library/playlists/:id/tracks/:trackId - Remover música da playlist
router.delete('/playlists/:id/tracks/:trackId', verifyToken, async (req, res) => {
  try {
    const cleanTrackId = typeof req.params.trackId === 'string' ? req.params.trackId.replace('ct-', '') : req.params.trackId;
    const playlist = await libraryStorage.removeTrackFromPlaylist(req.params.id, req.user.id, cleanTrackId);
    res.json({ success: true, message: 'Música removida da playlist!', playlist });
  } catch (err) {
    console.error('Erro ao remover música da playlist:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao remover música da playlist.' });
  }
});

// PUT /api/library/playlists/:id/reorder - Reordenar músicas da playlist
router.put('/playlists/:id/reorder', verifyToken, async (req, res) => {
  try {
    const { track_ids } = req.body;
    if (!Array.isArray(track_ids)) {
      return res.status(400).json({ error: 'Lista de IDs de músicas (track_ids) inválida.' });
    }

    const cleanTrackIds = track_ids.map(id => typeof id === 'string' ? id.replace('ct-', '') : id);
    const playlist = await libraryStorage.reorderPlaylistTracks(req.params.id, req.user.id, cleanTrackIds);
    res.json({ success: true, message: 'Ordem das músicas atualizada com sucesso!', playlist });
  } catch (err) {
    console.error('Erro ao reordenar playlist:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao reordenar músicas da playlist.' });
  }
});

// =========================================================================
// 2. ARTISTS ROUTES
// =========================================================================

// GET /api/library/artists - Listar artistas
router.get('/artists', async (req, res) => {
  try {
    const artists = await libraryStorage.getArtists();
    res.json({ success: true, count: artists.length, artists });
  } catch (err) {
    console.error('Erro ao listar artistas:', err);
    res.status(500).json({ error: 'Erro ao carregar artistas.' });
  }
});

// GET /api/library/artists/:id - Detalhes do artista, seus álbuns e músicas
router.get('/artists/:id', async (req, res) => {
  try {
    const artist = await libraryStorage.getArtistById(req.params.id);
    if (!artist) {
      return res.status(404).json({ error: 'Artista não encontrado.' });
    }
    res.json({ success: true, artist });
  } catch (err) {
    console.error('Erro ao consultar artista:', err);
    res.status(500).json({ error: 'Erro ao consultar detalhes do artista.' });
  }
});

// POST /api/library/artists - Criar artista
router.post('/artists', verifyToken, async (req, res) => {
  try {
    const { name, bio, avatar_url, genre } = req.body;
    const artist = await libraryStorage.createArtist({ name, bio, avatar_url, genre });
    res.status(201).json({ success: true, message: 'Artista criado com sucesso!', artist });
  } catch (err) {
    console.error('Erro ao criar artista:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao cadastrar artista.' });
  }
});

// PUT /api/library/artists/:id - Editar artista
router.put('/artists/:id', verifyToken, async (req, res) => {
  try {
    const { name, bio, avatar_url, genre } = req.body;
    const artist = await libraryStorage.updateArtist(req.params.id, { name, bio, avatar_url, genre });
    res.json({ success: true, message: 'Artista atualizado com sucesso!', artist });
  } catch (err) {
    console.error('Erro ao atualizar artista:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao atualizar artista.' });
  }
});

// DELETE /api/library/artists/:id - Excluir artista (respeitando integridade de faixas e álbuns)
router.delete('/artists/:id', verifyToken, async (req, res) => {
  try {
    const result = await libraryStorage.deleteArtist(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Erro ao excluir artista:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao excluir artista.' });
  }
});

// =========================================================================
// 3. ALBUMS ROUTES
// =========================================================================

// GET /api/library/albums - Listar álbuns
router.get('/albums', async (req, res) => {
  try {
    const albums = await libraryStorage.getAlbums();
    res.json({ success: true, count: albums.length, albums });
  } catch (err) {
    console.error('Erro ao listar álbuns:', err);
    res.status(500).json({ error: 'Erro ao carregar álbuns.' });
  }
});

// GET /api/library/albums/:id - Detalhes do álbum e suas faixas
router.get('/albums/:id', async (req, res) => {
  try {
    const album = await libraryStorage.getAlbumById(req.params.id);
    if (!album) {
      return res.status(404).json({ error: 'Álbum não encontrado.' });
    }
    res.json({ success: true, album });
  } catch (err) {
    console.error('Erro ao consultar álbum:', err);
    res.status(500).json({ error: 'Erro ao consultar detalhes do álbum.' });
  }
});

// POST /api/library/albums - Criar álbum
router.post('/albums', verifyToken, async (req, res) => {
  try {
    const { title, artist_name, artist_id, cover_url, release_date, genre } = req.body;
    const album = await libraryStorage.createAlbum({ title, artist_name, artist_id, cover_url, release_date, genre });
    res.status(201).json({ success: true, message: 'Álbum criado com sucesso!', album });
  } catch (err) {
    console.error('Erro ao criar álbum:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao criar álbum.' });
  }
});

// PUT /api/library/albums/:id - Editar álbum
router.put('/albums/:id', verifyToken, async (req, res) => {
  try {
    const { title, artist_name, artist_id, cover_url, release_date, genre } = req.body;
    const album = await libraryStorage.updateAlbum(req.params.id, { title, artist_name, artist_id, cover_url, release_date, genre });
    res.json({ success: true, message: 'Álbum atualizado com sucesso!', album });
  } catch (err) {
    console.error('Erro ao atualizar álbum:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao atualizar álbum.' });
  }
});

// DELETE /api/library/albums/:id - Excluir álbum (respeitando integridade de faixas)
router.delete('/albums/:id', verifyToken, async (req, res) => {
  try {
    const result = await libraryStorage.deleteAlbum(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Erro ao excluir álbum:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao excluir álbum.' });
  }
});

// =========================================================================
// 4. TRACKS (COMPANY_TRACKS & USER ACQUIRED) ROUTES
// =========================================================================

// GET /api/library/my-tracks - Listar músicas adquiridas (compradas e alugadas) pelo usuário logado
router.get('/my-tracks', verifyToken, async (req, res) => {
  try {
    const tracks = await libraryStorage.getUserPurchasedTracks(req.user.id);
    res.json({ success: true, count: tracks.length, tracks });
  } catch (err) {
    console.error('Erro ao listar músicas adquiridas do usuário:', err);
    res.status(500).json({ error: 'Erro ao carregar faixas adquiridas do usuário.' });
  }
});

// GET /api/library/tracks - Listar faixas disponíveis para a biblioteca (catálogo geral)
router.get('/tracks', async (req, res) => {
  try {
    const tracks = await libraryStorage.getLibraryTracks();
    res.json({ success: true, count: tracks.length, tracks });
  } catch (err) {
    console.error('Erro ao listar músicas da biblioteca:', err);
    res.status(500).json({ error: 'Erro ao carregar catálogo de faixas.' });
  }
});

// GET /api/library/tracks/:id - Detalhes da música
router.get('/tracks/:id', async (req, res) => {
  try {
    const track = await libraryStorage.getTrackById(req.params.id);
    if (!track) {
      return res.status(404).json({ error: 'Música não encontrada.' });
    }
    res.json({ success: true, track });
  } catch (err) {
    console.error('Erro ao consultar música:', err);
    res.status(500).json({ error: 'Erro ao carregar dados da faixa.' });
  }
});

// POST /api/library/tracks - Cadastrar faixa no acervo real
router.post('/tracks', verifyToken, async (req, res) => {
  try {
    const track = await libraryStorage.createTrack(req.body);
    res.status(201).json({ success: true, message: 'Faixa cadastrada com sucesso no acervo!', track });
  } catch (err) {
    console.error('Erro ao cadastrar faixa:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao cadastrar faixa.' });
  }
});

// PUT /api/library/tracks/:id - Editar metadados permitidos da faixa
router.put('/tracks/:id', verifyToken, async (req, res) => {
  try {
    const track = await libraryStorage.updateTrack(req.params.id, req.body);
    res.json({ success: true, message: 'Metadados da música atualizados com sucesso!', track });
  } catch (err) {
    console.error('Erro ao atualizar faixa:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao atualizar dados da música.' });
  }
});

// DELETE /api/library/tracks/:id - Excluir / Arquivar faixa com integridade comercial
router.delete('/tracks/:id', verifyToken, async (req, res) => {
  try {
    const result = await libraryStorage.deleteTrack(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('Erro ao remover faixa:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao excluir música.' });
  }
});

// =========================================================================
// 5. PLAYBACK AUTH, AUDIO SECURITY & RENTAL EXPIRATION (REQUIREMENTS 1, 3, 4, 5)
// =========================================================================

// GET /api/library/tracks/:id/playback-auth - Verifica direito de reprodução no backend
router.get('/tracks/:id/playback-auth', verifyToken, async (req, res) => {
  try {
    const access = await libraryStorage.checkPlaybackAccess(req.user.id, req.params.id);
    res.json({ success: true, access });
  } catch (err) {
    res.status(err.statusCode || 403).json({
      error: err.message || 'Acesso negado para esta faixa.',
      status: err.status || 'forbidden',
      expired: Boolean(err.expired),
      track: err.track ? {
        id: err.track.id,
        dbTrackId: err.track.dbTrackId || err.track.id,
        title: err.track.title,
        artist: err.track.artist,
        album: err.track.album,
        cover_url: err.track.cover_url || err.track.cover,
        sale_price: err.track.sale_price || err.track.salePrice || 4.90,
        rent_price: err.track.rent_price || err.track.rentPrice || 1.90
      } : null
    });
  }
});

// GET /api/library/tracks/:id/audio - Endpoint seguro de áudio (impede contorno direto do bloqueio)
router.get('/tracks/:id/audio', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const access = await libraryStorage.checkPlaybackAccess(userId, req.params.id);
    const track = access.track;

    if (track.preview_url) {
      return res.redirect(track.preview_url);
    }
    return res.json({
      success: true,
      authorized: true,
      preview_url: track.preview_url,
      youtubeVideoId: track.youtube_video_id || track.youtubeVideoId
    });
  } catch (err) {
    return res.status(err.statusCode || 403).json({
      error: err.message || 'Acesso negado para reprodução desta faixa.',
      status: err.status || 'forbidden',
      expired: Boolean(err.expired),
      trackId: req.params.id
    });
  }
});

// POST /api/library/tracks/:id/renew-rent - Renovar período de aluguel por 30 dias
router.post('/tracks/:id/renew-rent', verifyToken, async (req, res) => {
  try {
    const { transaction_id, confirmed_at, price } = req.body || {};
    const result = await libraryStorage.renewRent(req.user.id, req.params.id, {
      transactionId: transaction_id,
      confirmedAt: confirmed_at,
      price
    });
    res.json(result);
  } catch (err) {
    console.error('Erro ao renovar aluguel:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao renovar aluguel da música.' });
  }
});

// POST /api/library/tracks/:id/buy-permanent - Comprar música definitivamente (upgrade permanente)
router.post('/tracks/:id/buy-permanent', verifyToken, async (req, res) => {
  try {
    const { transaction_id, confirmed_at, price } = req.body || {};
    const result = await libraryStorage.buyPermanent(req.user.id, req.params.id, {
      transactionId: transaction_id,
      confirmedAt: confirmed_at,
      price
    });
    res.json(result);
  } catch (err) {
    console.error('Erro ao comprar música definitivamente:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao processar compra definitiva.' });
  }
});

// =========================================================================
// 5. ORDERS & FINANCIAL PAYMENT CONFIRMATION ROUTES (VIGÊNCIA DE 30 DIAS)
// =========================================================================

// POST /api/library/orders - Criar pedido (checkout/carrinho) em estado 'pending'
// Regra: Não inicia a contagem do aluguel neste momento
router.post('/orders', verifyToken, async (req, res) => {
  try {
    const { track_id, type = 'rent', price, company_id } = req.body;
    if (!track_id) {
      return res.status(400).json({ error: 'O ID da música (track_id) é obrigatório para criar o pedido.' });
    }

    const result = await libraryStorage.createRentalOrder(req.user.id, track_id, {
      type,
      price,
      companyId: company_id
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('Erro ao criar pedido:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao criar pedido.' });
  }
});

// POST /api/library/orders/:id/confirm-payment - Confirmação do pagamento pelo gateway/financeiro
// Regra: Contagem de 30 dias começa EXCLUSIVAMENTE a partir deste momento
router.post('/orders/:id/confirm-payment', verifyToken, async (req, res) => {
  try {
    const { transaction_id, confirmed_at, track_id, type } = req.body || {};
    const result = await libraryStorage.confirmPayment({
      orderId: req.params.id,
      transactionId: transaction_id,
      userId: req.user.id,
      trackId: track_id,
      type: type || 'rent',
      confirmedAt: confirmed_at
    });

    res.json(result);
  } catch (err) {
    console.error('Erro ao confirmar pagamento do pedido:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Erro ao confirmar pagamento do pedido.' });
  }
});

// POST /api/library/payments/webhook - Webhook de pagamentos (idempotente)
router.post('/payments/webhook', async (req, res) => {
  try {
    const { order_id, transaction_id, user_id, track_id, type = 'rent', confirmed_at } = req.body || {};

    if (!user_id || !track_id) {
      return res.status(400).json({ error: 'Dados incompletos no webhook: user_id e track_id são obrigatórios.' });
    }

    const result = await libraryStorage.confirmPayment({
      orderId: order_id,
      transactionId: transaction_id,
      userId: user_id,
      trackId: track_id,
      type,
      confirmedAt: confirmed_at
    });

    res.json(result);
  } catch (err) {
    console.error('Erro no processamento do webhook de pagamento:', err);
    res.status(err.statusCode || 500).json({ error: err.message || 'Erro no processamento do webhook.' });
  }
});

module.exports = router;
