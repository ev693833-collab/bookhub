const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth');
const communityStorage = require('../services/communityStorage');

// =========================================================================
// 1. PERFIL E CONFIGURAÇÕES
// =========================================================================

// GET /api/community/me - Perfil do usuário autenticado
router.get('/me', verifyToken, async (req, res) => {
  try {
    const profile = communityStorage.getFullUserProfile(req.user.id, req.user.id);
    res.json({ success: true, profile });
  } catch (err) {
    console.error('Erro ao buscar perfil próprio:', err);
    res.status(500).json({ error: 'Erro ao carregar seu perfil da comunidade.' });
  }
});

// PUT /api/community/profile - Atualizar dados do perfil próprio
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const updated = communityStorage.updateProfile(req.user.id, req.body);
    const full = communityStorage.getFullUserProfile(req.user.id, req.user.id);
    res.json({ success: true, message: 'Perfil atualizado com sucesso!', profile: full });
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    res.status(500).json({ error: err.message || 'Erro ao atualizar perfil.' });
  }
});

// GET /api/community/profile/:userId - Perfil público de qualquer usuário
router.get('/profile/:userId', verifyToken, async (req, res) => {
  try {
    const targetId = Number(req.params.userId);
    const profile = communityStorage.getFullUserProfile(targetId, req.user.id);
    if (profile.blocked) {
      return res.status(403).json({ error: profile.message });
    }
    res.json({ success: true, profile });
  } catch (err) {
    console.error('Erro ao buscar perfil de usuário:', err);
    res.status(500).json({ error: 'Erro ao carregar perfil do usuário.' });
  }
});

// GET /api/community/stats/:userId - Estatísticas musicais detalhadas
router.get('/stats/:userId', verifyToken, async (req, res) => {
  try {
    const targetId = Number(req.params.userId);
    const stats = communityStorage.getUserStats(targetId);
    res.json({ success: true, stats });
  } catch (err) {
    console.error('Erro ao buscar estatísticas musicais:', err);
    res.status(500).json({ error: 'Erro ao carregar estatísticas.' });
  }
});

// =========================================================================
// 2. SISTEMA DE AMIZADES
// =========================================================================

// GET /api/community/friends - Listar amigos do usuário
router.get('/friends', verifyToken, async (req, res) => {
  try {
    const friends = communityStorage.getFriends(req.user.id);
    res.json({ success: true, count: friends.length, friends });
  } catch (err) {
    console.error('Erro ao listar amigos:', err);
    res.status(500).json({ error: 'Erro ao carregar amigos.' });
  }
});

// GET /api/community/friend-requests - Listar solicitações pendentes (recebidas e enviadas)
router.get('/friend-requests', verifyToken, async (req, res) => {
  try {
    const requests = communityStorage.getFriendRequests(req.user.id);
    res.json({ success: true, ...requests });
  } catch (err) {
    console.error('Erro ao listar solicitações de amizade:', err);
    res.status(500).json({ error: 'Erro ao carregar solicitações.' });
  }
});

// POST /api/community/friend-requests - Enviar solicitação de amizade
router.post('/friend-requests', verifyToken, async (req, res) => {
  try {
    const { receiverId } = req.body;
    if (!receiverId) {
      return res.status(400).json({ error: 'Identificador do usuário destinatário é obrigatório.' });
    }
    const result = communityStorage.sendFriendRequest(req.user.id, receiverId);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Erro ao enviar solicitação de amizade:', err);
    res.status(400).json({ error: err.message || 'Erro ao enviar solicitação de amizade.' });
  }
});

// PUT /api/community/friend-requests/:id - Aceitar ou recusar solicitação
router.put('/friend-requests/:id', verifyToken, async (req, res) => {
  try {
    const { action } = req.body; // 'accept' | 'reject'
    const result = communityStorage.respondFriendRequest(req.params.id, req.user.id, action);
    res.json(result);
  } catch (err) {
    console.error('Erro ao responder solicitação de amizade:', err);
    res.status(400).json({ error: err.message || 'Erro ao responder solicitação.' });
  }
});

// DELETE /api/community/friend-requests/:id - Cancelar solicitação enviada
router.delete('/friend-requests/:id', verifyToken, async (req, res) => {
  try {
    const result = communityStorage.cancelFriendRequest(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    console.error('Erro ao cancelar solicitação de amizade:', err);
    res.status(400).json({ error: err.message || 'Erro ao cancelar solicitação.' });
  }
});

// DELETE /api/community/friends/:friendId - Desfazer amizade
router.delete('/friends/:friendId', verifyToken, async (req, res) => {
  try {
    const result = communityStorage.removeFriend(req.user.id, req.params.friendId);
    res.json(result);
  } catch (err) {
    console.error('Erro ao remover amigo:', err);
    res.status(400).json({ error: err.message || 'Erro ao remover amizade.' });
  }
});

// GET /api/community/discover - Descoberta de pessoas com afinidade musical
router.get('/discover', verifyToken, async (req, res) => {
  try {
    const query = req.query.q || '';
    const people = communityStorage.discoverUsers(req.user.id, query);
    res.json({ success: true, count: people.length, people });
  } catch (err) {
    console.error('Erro ao buscar pessoas:', err);
    res.status(500).json({ error: 'Erro ao buscar pessoas na comunidade.' });
  }
});

// =========================================================================
// 3. FEED E PUBLICAÇÕES
// =========================================================================

// GET /api/community/feed - Feed principal de postagens
router.get('/feed', verifyToken, async (req, res) => {
  try {
    const posts = communityStorage.getFeed(req.user.id);
    res.json({ success: true, count: posts.length, posts });
  } catch (err) {
    console.error('Erro ao listar feed:', err);
    res.status(500).json({ error: 'Erro ao carregar feed da comunidade.' });
  }
});

// POST /api/community/posts - Criar nova publicação
router.post('/posts', verifyToken, async (req, res) => {
  try {
    const { type, text, mediaItem } = req.body;
    const post = communityStorage.createPost(req.user.id, { type, text, mediaItem });
    res.status(201).json({ success: true, message: 'Publicação criada com sucesso!', post });
  } catch (err) {
    console.error('Erro ao criar publicação:', err);
    res.status(400).json({ error: err.message || 'Erro ao criar publicação.' });
  }
});

// POST /api/community/posts/:id/like - Curtir ou descurtir post
router.post('/posts/:id/like', verifyToken, async (req, res) => {
  try {
    const result = communityStorage.toggleLikePost(req.params.id, req.user.id);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Erro ao curtir publicação:', err);
    res.status(400).json({ error: err.message || 'Erro ao atualizar curtida.' });
  }
});

// POST /api/community/posts/:id/react - Reagir com Emoji no estilo Airbuds (🔥, ❤️, 🎧, ⚡, 🤯)
router.post('/posts/:id/react', verifyToken, async (req, res) => {
  try {
    const { emoji } = req.body;
    const result = communityStorage.togglePostReaction(req.params.id, req.user.id, emoji);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Erro ao reagir com emoji:', err);
    res.status(400).json({ error: err.message || 'Erro ao reagir.' });
  }
});

// GET /api/community/compare/:targetUserId - Comparativo musical estilo Airbuds entre 2 usuários
router.get('/compare/:targetUserId', verifyToken, async (req, res) => {
  try {
    const targetUserId = Number(req.params.targetUserId);
    const comparison = communityStorage.compareUsers(req.user.id, targetUserId);
    res.json({ success: true, comparison });
  } catch (err) {
    console.error('Erro ao comparar usuários:', err);
    res.status(500).json({ error: 'Erro ao gerar comparativo musical.' });
  }
});

// POST /api/community/posts/:id/comment - Comentar em um post
router.post('/posts/:id/comment', verifyToken, async (req, res) => {
  try {
    const { text, replyToCommentId } = req.body;
    const result = communityStorage.addComment(req.params.id, req.user.id, text, replyToCommentId);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    console.error('Erro ao comentar:', err);
    res.status(400).json({ error: err.message || 'Erro ao adicionar comentário.' });
  }
});

// DELETE /api/community/posts/:id - Excluir post
router.delete('/posts/:id', verifyToken, async (req, res) => {
  try {
    const result = communityStorage.deletePost(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    console.error('Erro ao excluir post:', err);
    res.status(403).json({ error: err.message || 'Erro ao excluir publicação.' });
  }
});

// =========================================================================
// 4. ATIVIDADE MUSICAL EM TEMPO REAL ("OUVINDO AGORA")
// =========================================================================

// POST /api/community/activity/now-playing - Reportar faixa atual
router.post('/activity/now-playing', verifyToken, async (req, res) => {
  try {
    const { track, isPlaying } = req.body;
    const act = communityStorage.updateNowPlaying(req.user.id, track, isPlaying);
    res.json({ success: true, activity: act });
  } catch (err) {
    console.error('Erro ao atualizar atividade musical:', err);
    res.status(500).json({ error: 'Erro ao atualizar atividade musical.' });
  }
});

// GET /api/community/activity/friends - Atividades em tempo real dos amigos
router.get('/activity/friends', verifyToken, async (req, res) => {
  try {
    const activities = communityStorage.getFriendsActivities(req.user.id);
    res.json({ success: true, count: activities.length, activities });
  } catch (err) {
    console.error('Erro ao listar atividades dos amigos:', err);
    res.status(500).json({ error: 'Erro ao carregar atividades dos amigos.' });
  }
});

// =========================================================================
// 5. MENSAGENS PRIVADAS
// =========================================================================

// GET /api/community/messages/conversations - Listar conversas ativas
router.get('/messages/conversations', verifyToken, async (req, res) => {
  try {
    const conversations = communityStorage.getConversations(req.user.id);
    res.json({ success: true, conversations });
  } catch (err) {
    console.error('Erro ao listar conversas:', err);
    res.status(500).json({ error: 'Erro ao carregar conversas.' });
  }
});

// GET /api/community/messages/:partnerId - Histórico de mensagens com usuário
router.get('/messages/:partnerId', verifyToken, async (req, res) => {
  try {
    const partnerId = Number(req.params.partnerId);
    const messages = communityStorage.getMessagesThread(req.user.id, partnerId);
    const partner = communityStorage.getUserBasic(partnerId);
    res.json({ success: true, partner, messages });
  } catch (err) {
    console.error('Erro ao carregar mensagens:', err);
    res.status(500).json({ error: 'Erro ao carregar mensagens.' });
  }
});

// POST /api/community/messages - Enviar mensagem privada
router.post('/messages', verifyToken, async (req, res) => {
  try {
    const { receiverId, text, sharedMedia } = req.body;
    if (!receiverId) {
      return res.status(400).json({ error: 'Destinatário obrigatório.' });
    }
    const message = communityStorage.sendMessage(req.user.id, receiverId, { text, sharedMedia });
    res.status(201).json({ success: true, message });
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
    res.status(400).json({ error: err.message || 'Erro ao enviar mensagem.' });
  }
});

// =========================================================================
// 6. NOTIFICAÇÕES
// =========================================================================

// GET /api/community/notifications - Notificações do usuário
router.get('/notifications', verifyToken, async (req, res) => {
  try {
    const data = communityStorage.getNotifications(req.user.id);
    res.json({ success: true, ...data });
  } catch (err) {
    console.error('Erro ao carregar notificações:', err);
    res.status(500).json({ error: 'Erro ao carregar notificações.' });
  }
});

// PUT /api/community/notifications/:id/read - Marcar notificação como lida
router.put('/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    const result = communityStorage.markNotificationAsRead(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    console.error('Erro ao atualizar notificação:', err);
    res.status(500).json({ error: 'Erro ao marcar notificação como lida.' });
  }
});

// PUT /api/community/notifications/read-all - Marcar todas notificações como lidas
router.put('/notifications/read-all', verifyToken, async (req, res) => {
  try {
    const result = communityStorage.markAllNotificationsAsRead(req.user.id);
    res.json(result);
  } catch (err) {
    console.error('Erro ao marcar todas notificações:', err);
    res.status(500).json({ error: 'Erro ao marcar notificações como lidas.' });
  }
});

// =========================================================================
// 7. BLOQUEIO DE USUÁRIOS
// =========================================================================

// POST /api/community/block - Bloquear usuário
router.post('/block', verifyToken, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const result = communityStorage.blockUser(req.user.id, targetUserId);
    res.json(result);
  } catch (err) {
    console.error('Erro ao bloquear usuário:', err);
    res.status(400).json({ error: err.message || 'Erro ao bloquear usuário.' });
  }
});

// DELETE /api/community/block/:targetUserId - Desbloquear usuário
router.delete('/block/:targetUserId', verifyToken, async (req, res) => {
  try {
    const result = communityStorage.unblockUser(req.user.id, req.params.targetUserId);
    res.json(result);
  } catch (err) {
    console.error('Erro ao desbloquear usuário:', err);
    res.status(400).json({ error: err.message || 'Erro ao desbloquear usuário.' });
  }
});

module.exports = router;

