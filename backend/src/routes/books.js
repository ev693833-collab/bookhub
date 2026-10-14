const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// 1. Listar livros com informações de estoque
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = `
      SELECT 
        b.id,
        b.title,
        b.author,
        b.isbn,
        b.category,
        b.description,
        b.cover_url,
        b.publisher,
        b.publication_year,
        b.pages,
        b.sale_price,
        b.rent_price_daily,
        b.rent_price_monthly,
        b.availability,
        b.status,
        COALESCE(i.quantity_total, 0) AS quantity_total,
        COALESCE(i.quantity_available_sale, 0) AS quantity_available_sale,
        COALESCE(i.quantity_available_rent, 0) AS quantity_available_rent,
        COALESCE(i.quantity_rented, 0) AS quantity_rented,
        COALESCE(i.storage_location, 'Estante A') AS storage_location,
        COALESCE(i.min_alert_threshold, 2) AS min_alert_threshold
      FROM books b
      LEFT JOIN inventory i ON b.id = i.book_id
      WHERE b.status = 'active'
    `;
    const params = [];

    if (category && category !== 'Todos') {
      query += ' AND b.category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (b.title LIKE ? OR b.author LIKE ? OR b.category LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY b.id DESC';

    const [books] = await pool.query(query, params);
    return res.json({ books });
  } catch (error) {
    console.error('Erro ao listar livros:', error);
    return res.status(500).json({ error: 'Erro ao buscar livros do catálogo.' });
  }
});

// 2. Estatísticas do Dashboard (Painel do Administrador & Visão Geral)
router.get('/stats', async (req, res) => {
  try {
    const [booksCount] = await pool.query('SELECT COUNT(*) as total FROM books WHERE status = "active"');
    const [stockSum] = await pool.query(`
      SELECT 
        COALESCE(SUM(quantity_total), 0) AS total_items,
        COALESCE(SUM(quantity_available_sale), 0) AS total_sale,
        COALESCE(SUM(quantity_available_rent), 0) AS total_rent_available,
        COALESCE(SUM(quantity_rented), 0) AS total_rented
      FROM inventory
    `);
    const [usersCount] = await pool.query('SELECT COUNT(*) as total FROM users');
    const [activeRentals] = await pool.query('SELECT COUNT(*) as total FROM rentals WHERE status = "active"');
    const [lowStock] = await pool.query(`
      SELECT COUNT(*) as total FROM inventory 
      WHERE (quantity_available_sale + quantity_available_rent) <= min_alert_threshold
    `);

    return res.json({
      totalBooks: booksCount[0]?.total || 0,
      totalStock: stockSum[0]?.total_items || 0,
      availableForSale: stockSum[0]?.total_sale || 0,
      availableForRent: stockSum[0]?.total_rent_available || 0,
      activeRentals: activeRentals[0]?.total || stockSum[0]?.total_rented || 0,
      totalUsers: usersCount[0]?.total || 0,
      lowStockAlerts: lowStock[0]?.total || 0
    });
  } catch (error) {
    console.error('Erro nas estatísticas:', error);
    return res.status(500).json({ error: 'Erro ao buscar métricas.' });
  }
});

// 3. Cadastrar novo livro + estoque (Admin)
router.post('/', async (req, res) => {
  try {
    const {
      title, author, isbn, category, description, cover_url,
      sale_price, rent_price_monthly, rent_price_daily,
      quantity_available_sale, quantity_available_rent, storage_location
    } = req.body;

    if (!title || !author) {
      return res.status(400).json({ error: 'Título e Autor são obrigatórios.' });
    }

    const [bookResult] = await pool.query(`
      INSERT INTO books (title, author, isbn, category, description, cover_url, sale_price, rent_price_daily, rent_price_monthly)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title,
      author,
      isbn || null,
      category || 'Geral',
      description || '',
      cover_url || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
      Number(sale_price) || 0,
      Number(rent_price_daily) || 0,
      Number(rent_price_monthly) || 0
    ]);

    const bookId = bookResult.insertId;
    const qtySale = Number(quantity_available_sale) || 0;
    const qtyRent = Number(quantity_available_rent) || 0;
    const qtyTotal = qtySale + qtyRent;

    await pool.query(`
      INSERT INTO inventory (book_id, quantity_total, quantity_available_sale, quantity_available_rent, quantity_rented, storage_location)
      VALUES (?, ?, ?, ?, 0, ?)
    `, [bookId, qtyTotal, qtySale, qtyRent, storage_location || 'Estante Geral']);

    return res.status(201).json({ message: 'Livro cadastrado com sucesso!', bookId });
  } catch (error) {
    console.error('Erro ao cadastrar livro:', error);
    return res.status(500).json({ error: 'Erro ao cadastrar livro no estoque.' });
  }
});

// 4. Ação de Alugar um Livro
router.post('/:id/rent', async (req, res) => {
  const bookId = req.params.id;
  const { userId, days = 30 } = req.body;

  try {
    // Checar estoque disponível para aluguel
    const [inv] = await pool.query('SELECT * FROM inventory WHERE book_id = ?', [bookId]);
    if (!inv || inv.length === 0 || inv[0].quantity_available_rent <= 0) {
      return res.status(400).json({ error: 'Este livro não possui exemplares disponíveis para aluguel no momento.' });
    }

    const [book] = await pool.query('SELECT * FROM books WHERE id = ?', [bookId]);
    const fee = book[0]?.rent_price_monthly || 25.00;

    // Atualizar estoque: diminui disponível aluguel, aumenta alugados
    await pool.query(`
      UPDATE inventory 
      SET quantity_available_rent = quantity_available_rent - 1,
          quantity_rented = quantity_rented + 1
      WHERE book_id = ?
    `, [bookId]);

    // Registrar no histórico de movimentações
    await pool.query(`
      INSERT INTO stock_movements (book_id, user_id, type, quantity, notes)
      VALUES (?, ?, 'rent_out', 1, 'Aluguel aprovado para usuário')
    `, [bookId, userId || null]);

    // Criar locação
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + Number(days));

    await pool.query(`
      INSERT INTO rentals (user_id, book_id, rental_date, expected_return_date, rental_fee, status)
      VALUES (?, ?, NOW(), ?, ?, 'active')
    `, [userId || 2, bookId, expectedDate, fee]);

    return res.json({ message: 'Aluguel registrado com sucesso! O livro já está liberado.', expectedDate });
  } catch (error) {
    console.error('Erro ao alugar livro:', error);
    return res.status(500).json({ error: 'Erro ao processar o aluguel.' });
  }
});

// 5. Ação de Comprar um Livro
router.post('/:id/buy', async (req, res) => {
  const bookId = req.params.id;
  const { userId, quantity = 1 } = req.body;

  try {
    const qty = Number(quantity) || 1;
    const [inv] = await pool.query('SELECT * FROM inventory WHERE book_id = ?', [bookId]);
    if (!inv || inv.length === 0 || inv[0].quantity_available_sale < qty) {
      return res.status(400).json({ error: 'Estoque insuficiente para venda imediata.' });
    }

    const [book] = await pool.query('SELECT * FROM books WHERE id = ?', [bookId]);
    const price = book[0]?.sale_price || 0;
    const totalAmount = price * qty;

    // Baixa no estoque
    await pool.query(`
      UPDATE inventory 
      SET quantity_available_sale = quantity_available_sale - ?,
          quantity_total = quantity_total - ?
      WHERE book_id = ?
    `, [qty, qty, bookId]);

    // Movimentação
    await pool.query(`
      INSERT INTO stock_movements (book_id, user_id, type, quantity, notes)
      VALUES (?, ?, 'sale', ?, 'Venda direta realizada')
    `, [bookId, userId || null, qty]);

    // Criar pedido
    const [orderRes] = await pool.query(`
      INSERT INTO orders (user_id, total_amount, payment_method, payment_status)
      VALUES (?, ?, 'pix', 'approved')
    `, [userId || 2, totalAmount]);

    await pool.query(`
      INSERT INTO order_items (order_id, book_id, quantity, unit_price)
      VALUES (?, ?, ?, ?)
    `, [orderRes.insertId, bookId, qty, price]);

    return res.json({ message: 'Compra realizada com sucesso! Pedido aprovado.', orderId: orderRes.insertId });
  } catch (error) {
    console.error('Erro ao comprar livro:', error);
    return res.status(500).json({ error: 'Erro ao processar compra.' });
  }
});

module.exports = router;
