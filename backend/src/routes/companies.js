const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const mailService = require('../services/mailService');
const verifyToken = require('../middlewares/auth');

/**
 * GET /api/companies
 * Lista todas as bases/empresas cadastradas com total de faixas e estoque
 */
router.get('/', async (req, res) => {
  try {
    const [companies] = await db.query(`
      SELECT 
        c.*,
        COUNT(ct.id) AS total_tracks,
        COALESCE(SUM(ct.stock_quantity), 0) AS total_stock
      FROM companies c
      LEFT JOIN company_tracks ct ON c.id = ct.company_id AND ct.status = 'active'
      WHERE c.status = 'active'
      GROUP BY c.id
      ORDER BY c.id ASC
    `);
    res.json(companies);
  } catch (err) {
    console.error('Erro ao listar empresas:', err);
    res.status(500).json({ error: 'Erro ao carregar bases/empresas' });
  }
});

// Helper de formatação de faixas com suporte ao status de compra/aluguel
function mapTrackRecord(t, userPurchasesMap = new Map()) {
  const min = Math.floor((t.duration_sec || 210) / 60);
  const sec = (t.duration_sec || 210) % 60;
  const p = userPurchasesMap.get(Number(t.id));
  const isPurchased = p?.type === 'buy';
  const isRented = p?.type === 'rent';
  const rentalExpired = isRented ? (new Date(p.expires_at) < new Date()) : false;
  const rentalExpiresAt = isRented ? p.expires_at : null;

  return {
    id: `ct-${t.id}`,
    dbTrackId: t.id,
    companyId: t.company_id,
    companyName: t.company_name || 'DevSongs Gravadora',
    title: t.title,
    artist: t.artist,
    album: t.album || 'Single',
    genre: t.genre || 'Variado',
    cover: t.cover_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png',
    preview: t.preview_url,
    durationSec: t.duration_sec || 210,
    duration: `${min}:${String(sec).padStart(2, '0')}`,
    plays: `Estoque: ${t.stock_quantity} un`,
    stockQuantity: t.stock_quantity,
    salePrice: Number(t.sale_price || 1.90).toFixed(2),
    rentPrice: Number(t.rent_price || 0.50).toFixed(2),
    priceSale: `R$ ${Number(t.sale_price || 1.90).toFixed(2).replace('.', ',')}`,
    priceRent: `R$ ${Number(t.rent_price || 0.50).toFixed(2).replace('.', ',')}`,
    availableForSale: t.stock_quantity > 0,
    availableForRent: t.stock_quantity > 0,
    availableForStream: Boolean(t.available_for_stream),
    isExclusive: Boolean(t.is_exclusive),
    youtubeVideoId: t.youtube_video_id || null,
    // Status para usuário autenticado
    isPurchased,
    isRented: isRented && !rentalExpired,
    rentalExpired,
    rentalExpiresAt
  };
}

/**
 * Helper: Carrega e formata a lista de compras/aluguéis de um usuário
 */
async function getUserPurchasesList(targetUserId) {
  try {
    const [rows] = await db.query(`
      SELECT 
        cp.id AS purchase_id,
        cp.type,
        cp.price,
        cp.expires_at,
        cp.created_at,
        ct.id AS db_track_id,
        ct.title,
        ct.artist,
        ct.album,
        ct.genre,
        ct.cover_url,
        ct.preview_url,
        ct.duration_sec,
        ct.youtube_video_id,
        c.id AS company_id,
        c.name AS company_name,
        c.logo_url AS company_logo
      FROM company_purchases cp
      JOIN company_tracks ct ON cp.track_id = ct.id
      JOIN companies c ON cp.company_id = c.id
      WHERE cp.user_id = ?
      ORDER BY cp.created_at DESC
    `, [targetUserId]);

    const now = new Date();
    return rows.map(r => {
      const min = Math.floor((r.duration_sec || 210) / 60);
      const sec = (r.duration_sec || 210) % 60;
      const isRent = r.type === 'rent';
      const isExpired = isRent ? (new Date(r.expires_at) < now) : false;
      const remainingDays = isRent && !isExpired
        ? Math.max(0, Math.ceil((new Date(r.expires_at) - now) / (1000 * 60 * 60 * 24)))
        : null;

      return {
        purchaseId: r.purchase_id,
        type: r.type,
        price: r.price,
        purchasedAt: r.created_at,
        expiresAt: r.expires_at,
        isExpired,
        remainingDays,
        canPlay: !isExpired,
        id: `ct-${r.db_track_id}`,
        dbTrackId: r.db_track_id,
        title: r.title,
        artist: r.artist,
        album: r.album || 'Single',
        genre: r.genre,
        cover: r.cover_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png',
        cover_url: r.cover_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png',
        preview: r.preview_url,
        preview_url: r.preview_url,
        youtubeVideoId: r.youtube_video_id || null,
        durationSec: r.duration_sec || 210,
        duration_sec: r.duration_sec || 210,
        duration: `${min}:${String(sec).padStart(2, '0')}`,
        plays: isRent
          ? (isExpired ? 'Aluguel Expirado' : `Aluguel válido: ${remainingDays} dias`)
          : 'Comprado (Permanente)',
        licenseLabel: isRent
          ? (isExpired ? 'Aluguel Expirado' : `Aluguel (${remainingDays} dias restantes)`)
          : 'Comprada (Permanente)',
        companyId: r.company_id,
        companyName: r.company_name
      };
    });
  } catch (err) {
    console.warn('MySQL não disponível em getUserPurchasesList, usando fallback de biblioteca:', err.message);
    const libraryStorage = require('../services/libraryStorage');
    return libraryStorage.getUserPurchasedTracks(targetUserId);
  }
}

/**
 * Helper: Verifica se o usuário autenticado possui role 'admin' no banco
 */
async function checkIsAdmin(userId) {
  try {
    const [rows] = await db.query('SELECT role FROM users WHERE id = ? LIMIT 1', [userId]);
    return rows.length > 0 && rows[0].role === 'admin';
  } catch (_) {
    return false;
  }
}

/**
 * GET /api/companies/multibase/tracks
 * Lista acervo multibase com suporte a filtros por modalidade.
 * O catálogo público é mantido aberto. O status de compra/aluguel de faixas
 * só é personalizado caso haja um token JWT válido e autenticado (req.user).
 * Não confia em userId vindo de query string.
 */
router.get('/multibase/tracks', verifyToken.optional, async (req, res) => {
  const { mode = 'all', companyId } = req.query;
  const authenticatedUserId = req.user?.id || null;

  try {
    let sql = `
      SELECT 
        ct.*,
        c.name AS company_name,
        c.logo_url AS company_logo,
        c.slug AS company_slug
      FROM company_tracks ct
      JOIN companies c ON ct.company_id = c.id
      WHERE ct.status = 'active' AND c.status = 'active'
    `;
    const params = [];

    if (companyId && companyId !== 'all') {
      sql += ' AND (ct.company_id = ? OR c.slug = ?)';
      params.push(companyId, companyId);
    }

    if (mode === 'streaming') {
      sql += ' AND ct.available_for_stream = 1';
    } else if (mode === 'buy') {
      sql += ' AND ct.stock_quantity > 0 AND ct.sale_price > 0';
    } else if (mode === 'rent') {
      sql += ' AND ct.stock_quantity > 0 AND ct.rent_price > 0';
    }

    sql += ' ORDER BY ct.id ASC';

    const [tracks] = await db.query(sql, params);

    // Mapeia compras EXCLUSIVAMENTE se houver usuário autenticado comprovado pelo JWT
    const userPurchasesMap = new Map();
    if (authenticatedUserId) {
      const [purchases] = await db.query(`
        SELECT track_id, type, expires_at 
        FROM company_purchases 
        WHERE user_id = ?
        ORDER BY id DESC
      `, [authenticatedUserId]);

      for (const p of purchases) {
        if (!userPurchasesMap.has(p.track_id)) {
          userPurchasesMap.set(p.track_id, p);
        }
      }
    }

    const mapped = tracks.map(t => mapTrackRecord(t, userPurchasesMap));

    res.json({
      success: true,
      mode,
      total: mapped.length,
      tracks: mapped
    });
  } catch (err) {
    console.error('Erro ao consultar faixas multibase:', err);
    res.status(500).json({ error: 'Erro ao carregar acervo multibase' });
  }
});

/**
 * GET /api/companies/my-purchases
 * Rota canônica protegida: retorna as compras do usuário autenticado no JWT
 */
router.get('/my-purchases', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const mapped = await getUserPurchasesList(userId);

    res.json({
      success: true,
      userId: Number(userId),
      total: mapped.length,
      purchases: mapped
    });
  } catch (err) {
    console.error('Erro ao buscar biblioteca do usuário autenticado:', err);
    res.status(500).json({ error: 'Erro ao carregar faixas adquiridas do usuário' });
  }
});

/**
 * GET /api/companies/user/:userId/purchases
 * Rota protegida com verificação estrita de autorização IDOR:
 * O usuário autenticado só pode consultar as suas próprias compras,
 * a menos que possua permissão administrativa explícita verificada no backend.
 */
router.get('/user/:userId/purchases', verifyToken, async (req, res) => {
  const { userId } = req.params;
  const authUserId = req.user.id;

  try {
    if (Number(authUserId) !== Number(userId)) {
      const isAdmin = await checkIsAdmin(authUserId);
      if (!isAdmin) {
        return res.status(403).json({
          error: 'Acesso negado. Você só tem permissão para visualizar as suas próprias compras.'
        });
      }
    }

    const mapped = await getUserPurchasesList(userId);

    res.json({
      success: true,
      userId: Number(userId),
      total: mapped.length,
      purchases: mapped
    });
  } catch (err) {
    console.error('Erro ao buscar biblioteca do usuário:', err);
    res.status(500).json({ error: 'Erro ao carregar faixas adquiridas do usuário' });
  }
});

/**
 * POST /api/companies/vendor/tracks
 * Permite que vendedores autorizados ou administradores cadastrem/atualizem faixas
 */
router.post('/vendor/tracks', verifyToken, async (req, res) => {
  const authUserId = req.user.id;
  const {
    companyId,
    title,
    artist,
    album = 'Single',
    genre = 'Variado',
    coverUrl,
    previewUrl,
    durationSec = 210,
    stockQuantity = 50,
    salePrice = 4.90,
    rentPrice = 1.90,
    availableForStream = true,
    isExclusive = false
  } = req.body;

  if (!title || !artist || !companyId) {
    return res.status(400).json({ error: 'title, artist e companyId são obrigatórios' });
  }

  try {
    // Validação de autorização da identidade autenticada no banco de dados
    const [uRows] = await db.query('SELECT id, role FROM users WHERE id = ?', [authUserId]);
    if (uRows.length === 0) {
      return res.status(403).json({ error: 'Usuário não encontrado' });
    }
    const role = uRows[0].role;
    if (role !== 'admin' && role !== 'seller') {
      return res.status(403).json({ error: 'Apenas vendedores autorizados e administradores podem cadastrar faixas' });
    }

    const [result] = await db.query(`
      INSERT INTO company_tracks 
        (company_id, title, artist, album, genre, cover_url, preview_url, duration_sec, stock_quantity, sale_price, rent_price, available_for_stream, is_exclusive)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      companyId,
      title,
      artist,
      album,
      genre,
      coverUrl || null,
      previewUrl || null,
      durationSec,
      stockQuantity,
      salePrice,
      rentPrice,
      availableForStream ? 1 : 0,
      isExclusive ? 1 : 0
    ]);

    res.status(201).json({
      success: true,
      message: `Faixa "${title}" cadastrada com sucesso!`,
      trackId: result.insertId
    });
  } catch (err) {
    console.error('Erro ao cadastrar faixa por vendedor:', err);
    res.status(500).json({ error: 'Erro ao registrar faixa no acervo' });
  }
});

/**
 * POST /api/companies/purchase-any
 * Permite comprar ou alugar qualquer faixa da plataforma (busca externa, deezer, youtube ou bases).
 * Registra a transação, atualiza a biblioteca, gera notificação no sistema e envia e-mail de confirmação.
 */
router.post('/purchase-any', verifyToken, async (req, res) => {
  const userId = req.user.id; // Identidade autenticada e validada via JWT
  const {
    title,
    artist,
    album = 'Single',
    genre = 'Variado',
    companyId: reqCompanyId,
    coverUrl,
    previewUrl,
    durationSec = 210,
    type = 'buy', // 'buy' | 'rent'
    price = 1.90,
    paymentMethod = 'pix'
  } = req.body;

  if (!title || !artist) {
    return res.status(400).json({ error: 'Título e artista são obrigatórios.' });
  }

  try {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

    // 1. Verifica se a música já existe em company_tracks
    const [existing] = await conn.query(
      'SELECT id, company_id, sale_price, rent_price FROM company_tracks WHERE title = ? AND artist = ? LIMIT 1',
      [title, artist]
    );

    let trackId;
    let companyId = reqCompanyId ? Number(reqCompanyId) : null;

    if (existing.length > 0) {
      trackId = existing[0].id;
      companyId = existing[0].company_id || companyId || 1;
      if (coverUrl) {
        await conn.query('UPDATE company_tracks SET cover_url = COALESCE(cover_url, ?) WHERE id = ?', [coverUrl, trackId]);
      }
    } else {
      // Se companyId não foi informado, tenta associar por gênero musical ou artista
      if (!companyId) {
        const [allCompanies] = await conn.query('SELECT id, genre, name FROM companies WHERE status = "active"');
        const cleanG = (genre || '').toLowerCase();
        const cleanA = (artist || '').toLowerCase();
        for (const c of allCompanies) {
          const cG = (c.genre || '').toLowerCase();
          const cN = (c.name || '').toLowerCase();
          if (
            (cleanG && cleanG !== 'variado' && cG.includes(cleanG)) ||
            (cleanG.includes('forro') && cG.includes('forr')) ||
            (cleanG.includes('piseiro') && cG.includes('piseiro')) ||
            (cleanG.includes('trap') && cG.includes('trap')) ||
            (cleanG.includes('funk') && cG.includes('funk')) ||
            (cleanG.includes('pop') && cG.includes('pop'))
          ) {
            companyId = c.id;
            break;
          }
        }
        if (!companyId) companyId = 1; // Fallback para primeira base cadastrada
      }

      // Cadastra no acervo da gravadora definida
      const [insertRes] = await conn.query(`
        INSERT INTO company_tracks 
          (company_id, title, artist, album, genre, cover_url, preview_url, duration_sec, stock_quantity, sale_price, rent_price, available_for_stream)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 99, ?, ?, 1)
      `, [companyId, title, artist, album, genre, coverUrl || null, previewUrl || null, durationSec, price, type === 'rent' ? price : 0.50]);
      trackId = insertRes.insertId;
    }

    // 2. Verifica se o usuário já possui comprado
    const [userBought] = await conn.query(
      'SELECT id FROM company_purchases WHERE user_id = ? AND track_id = ? AND type = "buy" LIMIT 1',
      [userId, trackId]
    );

    if (userBought.length > 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Você já possui esta faixa comprada definitivamente em sua biblioteca!' });
    }

    // 3. Registra a compra ou aluguel
    const expiresClause = type === 'rent' ? 'DATE_ADD(NOW(), INTERVAL 30 DAY)' : 'NULL';
    const [purchaseRes] = await conn.query(`
      INSERT INTO company_purchases (company_id, user_id, track_id, type, price, expires_at)
      VALUES (?, ?, ?, ?, ?, ${expiresClause})
    `, [companyId, userId, trackId, type, price]);

    // 4. Busca os dados oficiais da conta do usuário autenticado no banco de dados
    const accountUserId = userId;
    const [userRows] = await conn.query(
      'SELECT id, full_name, email FROM users WHERE id = ? LIMIT 1',
      [accountUserId]
    );
    const accountUser = userRows.length > 0 ? userRows[0] : null;
    const userAccountEmail = accountUser?.email || null;

    // 5. Cria notificação no sistema
    const subject = type === 'buy' ? 'Compra de Música Confirmada' : 'Aluguel de Música Confirmado';
    const emailNoticeText = userAccountEmail ? `Comprovante e licença emitidos para ${userAccountEmail}. ` : '';
    const msg = `Seu pagamento via ${paymentMethod.toUpperCase()} de R$ ${Number(price).toFixed(2).replace('.', ',')} para a faixa "${title} - ${artist}" foi aprovado com sucesso! ${emailNoticeText}A faixa já está disponível na sua Biblioteca.`;
    
    await conn.query(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, 'purchase_success')
    `, [userId, subject, msg]);

    // 6. Confirma a transação bancária/estoque no banco de dados ANTES do envio complementar de e-mail
    await conn.commit();

    // 7. Envio complementar de e-mail (falhas de SMTP ou ausência de e-mail não desfazem a compra)
    let emailResult = { success: false, reason: 'unprocessed' };
    if (accountUser && accountUser.email) {
      try {
        emailResult = await mailService.sendPaymentConfirmationEmail({
          user: accountUser,
          track: {
            title,
            artist,
            album,
            cover: coverUrl
          },
          purchase: {
            id: purchaseRes.insertId,
            type,
            price,
            created_at: new Date(),
            expires_at: type === 'rent' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null
          },
          paymentMethod
        });
      } catch (mailErr) {
        console.error('[DevSongs Mail] Erro não tratado durante chamada de e-mail:', mailErr?.message || mailErr);
        emailResult = { success: false, reason: 'unexpected_error', error: mailErr?.message };
      }
    } else {
      console.warn(`[DevSongs Mail] Usuário #${accountUserId} não possui endereço de e-mail cadastrado na conta. Envio não executado.`);
      emailResult = { success: false, reason: 'no_email_on_account' };
    }

    res.json({
      success: true,
      message: `Pagamento aprovado! "${title}" liberada e adicionada à sua Biblioteca.`,
      emailSent: Boolean(emailResult.success),
      emailRecipient: userAccountEmail,
      emailStatus: emailResult.reason || (emailResult.success ? 'sent' : 'failed'),
      purchaseId: purchaseRes.insertId,
      trackId: `ct-${trackId}`,
      dbTrackId: trackId,
      title,
      artist,
      type,
      price
    });
  } catch (err) {
    if (conn) await conn.rollback();
    throw err;
  } finally {
    if (conn) conn.release();
  }
} catch (err) {
  if (err.statusCode || err.message?.includes('já possui') || err.message?.includes('esgotado') || err.message?.includes('não encontrada')) {
    return res.status(err.statusCode || 400).json({ error: err.message });
  }
  console.warn('Fallback para compra local sem MySQL em /purchase-any:', err.message);
  try {
    const libraryStorage = require('../services/libraryStorage');
    let cleanTrackId = null;
    const allTracks = await libraryStorage.getLibraryTracks();
    const cleanTitle = (title || '').trim().toLowerCase();
    const cleanArtist = (artist || '').trim().toLowerCase();
    const existing = allTracks.find(t => (t.title || '').trim().toLowerCase() === cleanTitle && (t.artist || '').trim().toLowerCase() === cleanArtist);
    if (existing) {
      cleanTrackId = existing.id;
    } else {
      const newTrack = await libraryStorage.createTrack({
        title,
        artist,
        album: album || 'Single',
        genre: genre || 'Variado',
        cover_url: coverUrl || null,
        preview_url: previewUrl || null,
        duration_sec: durationSec || 210,
        sale_price: price || 1.90,
        rent_price: type === 'rent' ? price : 0.50,
        company_id: reqCompanyId ? Number(reqCompanyId) : 1
      });
      cleanTrackId = newTrack.id;
    }

    const purchaseResult = await libraryStorage.recordPurchase(userId, {
      trackId: cleanTrackId,
      companyId: reqCompanyId ? Number(reqCompanyId) : 1,
      type,
      price
    });

    return res.json({
      success: true,
      message: `Pagamento aprovado! "${title}" liberada e adicionada à sua Biblioteca.`,
      emailSent: false,
      purchaseId: purchaseResult.purchaseId,
      trackId: `ct-${cleanTrackId}`,
      dbTrackId: cleanTrackId,
      title,
      artist,
      type,
      price
    });
  } catch (fallbackErr) {
    console.error('Erro no fallback de purchase-any:', fallbackErr);
    return res.status(fallbackErr.statusCode || 500).json({ error: fallbackErr.message || 'Erro ao processar pagamento.' });
  }
}
});

/**
 * GET /api/companies/:id
 * Detalhes de uma empresa/base específica
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM companies WHERE id = ? OR slug = ?', [id, id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Base/Empresa não encontrada' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao buscar empresa:', err);
    res.status(500).json({ error: 'Erro ao buscar empresa' });
  }
});

/**
 * GET /api/companies/:id/tracks
 * Lista o estoque e músicas exclusivas de uma empresa/base
 */
router.get('/:id/tracks', async (req, res) => {
  const { id } = req.params;
  try {
    const [companyRows] = await db.query('SELECT * FROM companies WHERE id = ? OR slug = ?', [id, id]);
    if (companyRows.length === 0) {
      return res.status(404).json({ error: 'Base/Empresa não encontrada' });
    }
    const company = companyRows[0];

    const [tracks] = await db.query(
      'SELECT * FROM company_tracks WHERE company_id = ? AND status = "active" ORDER BY id ASC',
      [company.id]
    );

    // Mapeia para o formato padrão do player DevSongs
    const mappedTracks = tracks.map((t, idx) => {
      const min = Math.floor((t.duration_sec || 210) / 60);
      const sec = (t.duration_sec || 210) % 60;
      return {
        id: `ct-${t.id}`,
        dbTrackId: t.id,
        companyId: company.id,
        companyName: company.name,
        title: t.title,
        artist: t.artist,
        album: t.album || 'Single',
        genre: t.genre,
        cover: t.cover_url || company.logo_url || 'https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png',
        preview: t.preview_url,
        durationSec: t.duration_sec || 210,
        duration: `${min}:${String(sec).padStart(2, '0')}`,
        plays: `Estoque: ${t.stock_quantity} un`,
        stockQuantity: t.stock_quantity,
        salePrice: Number(t.sale_price || 1.90).toFixed(2),
        rentPrice: Number(t.rent_price || 0.50).toFixed(2),
        priceSale: `R$ ${Number(t.sale_price || 1.90).toFixed(2).replace('.', ',')}`,
        priceRent: `R$ ${Number(t.rent_price || 0.50).toFixed(2).replace('.', ',')}`,
        availableForSale: t.stock_quantity > 0,
        availableForRent: t.stock_quantity > 0,
        isExclusive: Boolean(t.is_exclusive)
      };
    });

    res.json({
      company,
      tracks: mappedTracks
    });
  } catch (err) {
    console.error('Erro ao buscar músicas da empresa:', err);
    res.status(500).json({ error: 'Erro ao carregar acervo da empresa' });
  }
});

/**
 * POST /api/companies/:id/buy
 * Compra de música com baixa automática no estoque da empresa e validações
 */
router.post('/:id/buy', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { trackId } = req.body;

  if (!trackId) {
    return res.status(400).json({ error: 'trackId é obrigatório' });
  }

  const uId = req.user.id; // Identidade autenticada e validada via JWT
  const cleanId = String(trackId).replace('ct-', '');

  try {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Verifica se a música existe e se há estoque disponível
      const [trackRows] = await conn.query(
        'SELECT * FROM company_tracks WHERE id = ? FOR UPDATE',
        [cleanId]
      );

      if (trackRows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: 'Música não encontrada no catálogo desta empresa' });
      }

      const track = trackRows[0];
      if (track.stock_quantity <= 0) {
        await conn.rollback();
        return res.status(400).json({ error: 'Estoque esgotado para esta música nesta base!' });
      }

      // 2. Verifica se o usuário já possui a faixa comprada
      const [existing] = await conn.query(
        'SELECT id FROM company_purchases WHERE user_id = ? AND track_id = ? AND type = "buy" LIMIT 1',
        [uId, track.id]
      );

      if (existing.length > 0) {
        await conn.rollback();
        return res.status(400).json({ error: 'Você já possui esta faixa comprada na sua biblioteca!' });
      }

      // 3. Decrementa o estoque da empresa
      await conn.query(
        'UPDATE company_tracks SET stock_quantity = stock_quantity - 1 WHERE id = ?',
        [track.id]
      );

      // 4. Registra a compra
      const [result] = await conn.query(`
        INSERT INTO company_purchases (company_id, user_id, track_id, type, price)
        VALUES (?, ?, ?, 'buy', ?)
      `, [track.company_id, uId, track.id, track.sale_price]);

      // 5. Busca dados da conta do usuário no banco
      const [userRows] = await conn.query(
        'SELECT id, full_name, email FROM users WHERE id = ? LIMIT 1',
        [uId]
      );
      const accountUser = userRows.length > 0 ? userRows[0] : null;

      await conn.commit();

      // 6. Envio complementar de e-mail
      let emailResult = { success: false, reason: 'unprocessed' };
      if (accountUser && accountUser.email) {
        try {
          emailResult = await mailService.sendPaymentConfirmationEmail({
            user: accountUser,
            track: {
              title: track.title,
              artist: track.artist,
              album: track.album,
              cover: track.cover_url
            },
            purchase: {
              id: result.insertId,
              type: 'buy',
              price: track.sale_price,
              created_at: new Date()
            },
            paymentMethod: 'Plataforma DevSongs'
          });
        } catch (mailErr) {
          console.error('[DevSongs Mail] Erro ao disparar e-mail em /:id/buy:', mailErr?.message || mailErr);
        }
      }

      const remainingStock = track.stock_quantity - 1;

      return res.json({
        success: true,
        message: `Compra de "${track.title}" realizada com sucesso!`,
        emailSent: Boolean(emailResult.success),
        emailRecipient: accountUser?.email || null,
        purchaseId: result.insertId,
        remainingStock,
        trackTitle: track.title,
        price: track.sale_price
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    if (err.statusCode || err.message?.includes('já possui') || err.message?.includes('esgotado') || err.message?.includes('não encontrada')) {
      return res.status(err.statusCode || 400).json({ error: err.message });
    }
    console.warn('Fallback para compra local sem MySQL:', err.message);
    try {
      const libraryStorage = require('../services/libraryStorage');
      const purchaseResult = await libraryStorage.recordPurchase(uId, {
        trackId: cleanId,
        companyId: Number(id) || 1,
        type: 'buy'
      });
      return res.json({
        success: true,
        message: `Compra de "${purchaseResult.trackTitle}" realizada com sucesso!`,
        purchaseId: purchaseResult.purchaseId,
        remainingStock: purchaseResult.remainingStock,
        trackTitle: purchaseResult.trackTitle,
        price: purchaseResult.price
      });
    } catch (fallbackErr) {
      return res.status(fallbackErr.statusCode || 400).json({ error: fallbackErr.message || 'Erro ao processar compra de música' });
    }
  }
});

/**
 * POST /api/companies/:id/rent
 * Aluguel de música por 30 dias com baixa no estoque e validações
 */
router.post('/:id/rent', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { trackId } = req.body;

  if (!trackId) {
    return res.status(400).json({ error: 'trackId é obrigatório' });
  }

  const uId = req.user.id; // Identidade autenticada e validada via JWT
  const cleanId = String(trackId).replace('ct-', '');

  try {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [trackRows] = await conn.query(
        'SELECT * FROM company_tracks WHERE id = ? FOR UPDATE',
        [cleanId]
      );

      if (trackRows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: 'Música não encontrada no catálogo' });
      }

      const track = trackRows[0];
      if (track.stock_quantity <= 0) {
        await conn.rollback();
        return res.status(400).json({ error: 'Estoque esgotado para aluguel desta música nesta base!' });
      }

      // Verifica se já comprou definitivamente
      const [boughtCheck] = await conn.query(
        'SELECT id FROM company_purchases WHERE user_id = ? AND track_id = ? AND type = "buy" LIMIT 1',
        [uId, track.id]
      );
      if (boughtCheck.length > 0) {
        await conn.rollback();
        return res.status(400).json({ error: 'Você já possui esta faixa comprada definitivamente em sua biblioteca!' });
      }

      // Verifica se já possui aluguel ativo
      const [existingRent] = await conn.query(
        'SELECT id, expires_at FROM company_purchases WHERE user_id = ? AND track_id = ? AND type = "rent" AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
        [uId, track.id]
      );
      if (existingRent.length > 0) {
        const expDate = new Date(existingRent[0].expires_at).toLocaleDateString('pt-BR');
        await conn.rollback();
        return res.status(400).json({ error: `Você já possui um aluguel ativo para esta faixa até ${expDate}.` });
      }

      // Baixa de 1 unidade do estoque de aluguel
      await conn.query(
        'UPDATE company_tracks SET stock_quantity = stock_quantity - 1 WHERE id = ?',
        [track.id]
      );

      // 4. Registra o aluguel
      const [result] = await conn.query(`
        INSERT INTO company_purchases (company_id, user_id, track_id, type, price, expires_at)
        VALUES (?, ?, ?, 'rent', ?, DATE_ADD(NOW(), INTERVAL 30 DAY))
      `, [track.company_id, uId, track.id, track.rent_price]);

      // 5. Busca dados da conta do usuário no banco
      const [userRows] = await conn.query(
        'SELECT id, full_name, email FROM users WHERE id = ? LIMIT 1',
        [uId]
      );
      const accountUser = userRows.length > 0 ? userRows[0] : null;

      await conn.commit();

      // 6. Envio complementar de e-mail de aluguel
      let emailResult = { success: false, reason: 'unprocessed' };
      if (accountUser && accountUser.email) {
        try {
          emailResult = await mailService.sendPaymentConfirmationEmail({
            user: accountUser,
            track: {
              title: track.title,
              artist: track.artist,
              album: track.album,
              cover: track.cover_url
            },
            purchase: {
              id: result.insertId,
              type: 'rent',
              price: track.rent_price,
              created_at: new Date(),
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            },
            paymentMethod: 'Plataforma DevSongs'
          });
        } catch (mailErr) {
          console.error('[DevSongs Mail] Erro ao disparar e-mail em /:id/rent:', mailErr?.message || mailErr);
        }
      }

      return res.json({
        success: true,
        message: `Aluguel de "${track.title}" realizado com sucesso por 30 dias!`,
        emailSent: Boolean(emailResult.success),
        emailRecipient: accountUser?.email || null,
        rentalId: result.insertId,
        remainingStock: track.stock_quantity - 1,
        expiresInDays: 30
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    if (err.statusCode || err.message?.includes('já possui') || err.message?.includes('esgotado') || err.message?.includes('não encontrada')) {
      return res.status(err.statusCode || 400).json({ error: err.message });
    }
    console.warn('Fallback para aluguel local sem MySQL:', err.message);
    try {
      const libraryStorage = require('../services/libraryStorage');
      const rentResult = await libraryStorage.recordPurchase(uId, {
        trackId: cleanId,
        companyId: Number(id) || 1,
        type: 'rent'
      });
      return res.json({
        success: true,
        message: `Aluguel de 30 dias de "${rentResult.trackTitle}" realizado com sucesso!`,
        rentalId: rentResult.purchaseId,
        purchaseId: rentResult.purchaseId,
        remainingStock: rentResult.remainingStock,
        expiresInDays: 30
      });
    } catch (fallbackErr) {
      return res.status(fallbackErr.statusCode || 400).json({ error: fallbackErr.message || 'Erro ao processar aluguel de música' });
    }
  }
});

module.exports = router;
