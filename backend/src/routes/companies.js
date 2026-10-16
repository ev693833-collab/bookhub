const express = require('express');
const router = express.Router();
const db = require('../config/database');

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
        cover: t.cover_url || company.logo_url || '/img/logo-devsongs.png',
        preview: t.preview_url,
        durationSec: t.duration_sec || 210,
        duration: `${min}:${String(sec).padStart(2, '0')}`,
        plays: `Estoque: ${t.stock_quantity} un`,
        stockQuantity: t.stock_quantity,
        salePrice: Number(t.sale_price || 4.90).toFixed(2),
        rentPrice: Number(t.rent_price || 1.90).toFixed(2),
        priceSale: `R$ ${Number(t.sale_price || 4.90).toFixed(2).replace('.', ',')}`,
        priceRent: `R$ ${Number(t.rent_price || 1.90).toFixed(2).replace('.', ',')}`,
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
 * Compra de música com baixa automática no estoque da empresa
 */
router.post('/:id/buy', async (req, res) => {
  const { id } = req.params;
  const { trackId, userId } = req.body;

  if (!trackId) {
    return res.status(400).json({ error: 'trackId é obrigatório' });
  }

  const uId = userId || 1; // Fallback para usuário logado

  try {
    // 1. Verifica se a música existe e se há estoque disponível
    const cleanId = String(trackId).replace('ct-', '');
    const [trackRows] = await db.query(
      'SELECT * FROM company_tracks WHERE id = ? FOR UPDATE',
      [cleanId]
    );

    if (trackRows.length === 0) {
      return res.status(404).json({ error: 'Música não encontrada no catálogo desta empresa' });
    }

    const track = trackRows[0];
    if (track.stock_quantity <= 0) {
      return res.status(400).json({ error: 'Estoque esgotado para esta música nesta base!' });
    }

    // 2. Decrementa o estoque da empresa
    await db.query(
      'UPDATE company_tracks SET stock_quantity = stock_quantity - 1 WHERE id = ?',
      [track.id]
    );

    // 3. Registra a compra
    const [result] = await db.query(`
      INSERT INTO company_purchases (company_id, user_id, track_id, type, price)
      VALUES (?, ?, ?, 'buy', ?)
    `, [track.company_id, uId, track.id, track.sale_price]);

    const remainingStock = track.stock_quantity - 1;

    res.json({
      success: true,
      message: `Compra de "${track.title}" realizada com sucesso!`,
      purchaseId: result.insertId,
      remainingStock,
      trackTitle: track.title,
      price: track.sale_price
    });
  } catch (err) {
    console.error('Erro ao comprar música:', err);
    res.status(500).json({ error: 'Erro ao processar compra de música' });
  }
});

/**
 * POST /api/companies/:id/rent
 * Aluguel de música por 30 dias com baixa no estoque
 */
router.post('/:id/rent', async (req, res) => {
  const { id } = req.params;
  const { trackId, userId } = req.body;

  if (!trackId) {
    return res.status(400).json({ error: 'trackId é obrigatório' });
  }

  const uId = userId || 1;

  try {
    const cleanId = String(trackId).replace('ct-', '');
    const [trackRows] = await db.query(
      'SELECT * FROM company_tracks WHERE id = ? FOR UPDATE',
      [cleanId]
    );

    if (trackRows.length === 0) {
      return res.status(404).json({ error: 'Música não encontrada no catálogo' });
    }

    const track = trackRows[0];
    if (track.stock_quantity <= 0) {
      return res.status(400).json({ error: 'Estoque esgotado para aluguel desta música nesta base!' });
    }

    // Baixa de 1 unidade do estoque de aluguel
    await db.query(
      'UPDATE company_tracks SET stock_quantity = stock_quantity - 1 WHERE id = ?',
      [track.id]
    );

    // Expira em 30 dias
    const [result] = await db.query(`
      INSERT INTO company_purchases (company_id, user_id, track_id, type, price, expires_at)
      VALUES (?, ?, ?, 'rent', ?, DATE_ADD(NOW(), INTERVAL 30 DAY))
    `, [track.company_id, uId, track.id, track.rent_price]);

    res.json({
      success: true,
      message: `Aluguel de "${track.title}" realizado com sucesso por 30 dias!`,
      rentalId: result.insertId,
      remainingStock: track.stock_quantity - 1,
      expiresInDays: 30
    });
  } catch (err) {
    console.error('Erro ao alugar música:', err);
    res.status(500).json({ error: 'Erro ao processar aluguel de música' });
  }
});

module.exports = router;
