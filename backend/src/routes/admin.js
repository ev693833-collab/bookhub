const express = require("express");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const pool = require("../config/database");
const verifyAdmin = require("../middlewares/admin");

const router = express.Router();
const saltRounds = 10;

const DATA_DIR = path.join(__dirname, "../../data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const COMPANIES_FILE = path.join(DATA_DIR, "companies.json");
const TRACKS_FILE = path.join(DATA_DIR, "company_tracks.json");
const PURCHASES_FILE = path.join(DATA_DIR, "company_purchases.json");

function readJsonFile(filePath, defaultVal = []) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8") || "[]");
    }
  } catch (_) {}
  return defaultVal;
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Erro ao salvar " + filePath + ":", err);
  }
}

// Todas as rotas deste arquivo exigem permissão de Superadmin
router.use(verifyAdmin);

/**
 * GET /api/admin/verify
 * Verifica se a sessão do Superadmin é válida.
 */
router.get("/verify", (req, res) => {
  return res.json({
    authorized: true,
    user: {
      id: req.user.id,
      full_name: req.user.full_name,
      email: req.user.email,
      role: req.user.role,
      status: req.user.status,
    },
  });
});

/**
 * GET /api/admin/metrics
 * Indicadores gerais do sistema calculados a partir de dados reais do MySQL.
 * Suporta filtro de período: 'today', '7d', '30d', 'all' ou intervalo customizado.
 */
router.get("/metrics", async (req, res) => {
  const { period = "all", startDate, endDate } = req.query;

  try {
    let dateFilter = "";
    const filterParams = [];

    if (period === "today") {
      dateFilter = "AND DATE(cp.created_at) = CURDATE()";
    } else if (period === "7d") {
      dateFilter = "AND cp.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    } else if (period === "30d") {
      dateFilter = "AND cp.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    } else if (startDate && endDate) {
      dateFilter = "AND cp.created_at BETWEEN ? AND ?";
      filterParams.push(startDate, endDate);
    }

    // 1. Métricas de Vendas (company_purchases)
    const [salesStats] = await pool.query(
      `
      SELECT 
        COUNT(cp.id) AS total_sales_count,
        COALESCE(SUM(cp.price), 0) AS total_revenue,
        COUNT(CASE WHEN cp.type = 'buy' THEN 1 END) AS buy_count,
        COALESCE(SUM(CASE WHEN cp.type = 'buy' THEN cp.price ELSE 0 END), 0) AS buy_revenue,
        COUNT(CASE WHEN cp.type = 'rent' THEN 1 END) AS rent_count,
        COALESCE(SUM(CASE WHEN cp.type = 'rent' THEN cp.price ELSE 0 END), 0) AS rent_revenue
      FROM company_purchases cp
      WHERE 1=1 ${dateFilter}
    `,
      filterParams
    );

    // 2. Valores Pendentes (itens no carrinho ou intenções não finalizadas)
    let pendingAmount = 0;
    try {
      const [pendingRows] = await pool.query(`
        SELECT COALESCE(SUM(
          CASE 
            WHEN ci.type = 'rent' THEN ct.rent_price 
            ELSE ct.sale_price 
          END
        ), 0) AS pending_total
        FROM cart_items ci
        JOIN company_tracks ct ON ci.track_id = ct.id
      `);
      pendingAmount = Number(pendingRows[0]?.pending_total || 0);
    } catch (_) {
      pendingAmount = 0;
    }

    // 3. Métricas de Usuários
    const [userStats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_users,
        COUNT(CASE WHEN status = 'active' OR status IS NULL THEN 1 END) AS active_users,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) AS inactive_users,
        COUNT(CASE WHEN status = 'blocked' THEN 1 END) AS blocked_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) AS admin_users
      FROM users
    `);

    // 4. Métricas de Estoque de Faixas e Licenças (company_tracks)
    const [stockStats] = await pool.query(`
      SELECT 
        COUNT(ct.id) AS total_tracks,
        COALESCE(SUM(ct.stock_quantity), 0) AS total_stock_licenses,
        COUNT(CASE WHEN ct.stock_quantity <= 15 AND ct.stock_quantity > 0 THEN 1 END) AS low_stock_count,
        COUNT(CASE WHEN ct.stock_quantity = 0 THEN 1 END) AS out_of_stock_count
      FROM company_tracks ct
      WHERE ct.status = 'active'
    `);

    // 5. Métricas de Gravadoras e Bases Parceiras (companies)
    const [compStats] = await pool.query(`
      SELECT 
        COUNT(id) AS total_companies,
        COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_companies
      FROM companies
    `);

    // 6. Movimentações Recentes (últimas 8 transações)
    const [recentMovements] = await pool.query(`
      SELECT 
        cp.id,
        cp.type,
        cp.price,
        cp.created_at,
        ct.title AS track_title,
        ct.artist AS track_artist,
        ct.cover_url AS track_cover,
        c.name AS company_name,
        COALESCE(u.full_name, CONCAT('Usuário #', cp.user_id)) AS buyer_name,
        COALESCE(u.email, 'cadastro.legado@devsongs.com') AS buyer_email
      FROM company_purchases cp
      LEFT JOIN company_tracks ct ON cp.track_id = ct.id
      LEFT JOIN companies c ON cp.company_id = c.id
      LEFT JOIN users u ON cp.user_id = u.id
      ORDER BY cp.created_at DESC
      LIMIT 8
    `);

    const stats = salesStats[0] || {};
    const totalRev = Number(stats.total_revenue || 0);

    return res.json({
      period,
      sales: {
        totalRevenue: totalRev,
        totalSalesCount: Number(stats.total_sales_count || 0),
        buyCount: Number(stats.buy_count || 0),
        buyRevenue: Number(stats.buy_revenue || 0),
        rentCount: Number(stats.rent_count || 0),
        rentRevenue: Number(stats.rent_revenue || 0),
        receivedRevenue: totalRev,
        pendingRevenue: pendingAmount,
      },
      financial: {
        totalRevenue: totalRev,
        receivedAmount: totalRev,
        pendingAmount: pendingAmount,
        registeredExpenses: 0.0,
        calculatedBalance: totalRev,
        hasExpenseModule: false,
      },
      users: {
        total: Number(userStats[0]?.total_users || 0),
        active: Number(userStats[0]?.active_users || 0),
        inactive: Number(userStats[0]?.inactive_users || 0),
        blocked: Number(userStats[0]?.blocked_users || 0),
        admins: Number(userStats[0]?.admin_users || 0),
      },
      stock: {
        totalTracks: Number(stockStats[0]?.total_tracks || 0),
        totalLicenses: Number(stockStats[0]?.total_stock_licenses || 0),
        lowStockTracks: Number(stockStats[0]?.low_stock_count || 0),
        outOfStockTracks: Number(stockStats[0]?.out_of_stock_count || 0),
      },
      companies: {
        total: Number(compStats[0]?.total_companies || 0),
        active: Number(compStats[0]?.active_companies || 0),
      },
      recentMovements,
    });
  } catch (err) {
    console.warn("[AdminMetrics] MySQL indisponível, usando fallback JSON:", err.message);
    try {
      const users = readJsonFile(USERS_FILE, []);
      const companies = readJsonFile(COMPANIES_FILE, []);
      const tracks = readJsonFile(TRACKS_FILE, []);
      const purchases = readJsonFile(PURCHASES_FILE, []);

      const totalRev = purchases.reduce((acc, p) => acc + (Number(p.price) || 0), 0);
      const buyP = purchases.filter(p => p.type === 'buy');
      const rentP = purchases.filter(p => p.type === 'rent');

      const recentMovements = purchases.slice().reverse().slice(0, 8).map(p => {
        const tr = tracks.find(t => t.id === p.track_id);
        const comp = companies.find(c => c.id === p.company_id);
        const u = users.find(x => x.id === p.user_id);
        return {
          id: p.id,
          type: p.type,
          price: Number(p.price) || 0,
          created_at: p.created_at,
          track_title: tr?.title || 'Faixa ' + p.track_id,
          track_artist: tr?.artist || 'Artista',
          track_cover: tr?.cover_url || null,
          company_name: comp?.name || 'Base',
          buyer_name: u?.full_name || u?.name || 'Usuário #' + p.user_id,
          buyer_email: u?.email || 'usuario@devsongs.com'
        };
      });

      return res.json({
        period,
        sales: {
          totalRevenue: totalRev,
          totalSalesCount: purchases.length,
          buyCount: buyP.length,
          buyRevenue: buyP.reduce((acc, p) => acc + (Number(p.price) || 0), 0),
          rentCount: rentP.length,
          rentRevenue: rentP.reduce((acc, p) => acc + (Number(p.price) || 0), 0),
          receivedRevenue: totalRev,
          pendingRevenue: 0,
        },
        financial: {
          totalRevenue: totalRev,
          receivedAmount: totalRev,
          pendingAmount: 0,
          registeredExpenses: 0.0,
          calculatedBalance: totalRev,
          hasExpenseModule: false,
        },
        users: {
          total: users.length,
          active: users.filter(u => (u.status || 'active') === 'active').length,
          inactive: users.filter(u => u.status === 'inactive').length,
          blocked: users.filter(u => u.status === 'blocked').length,
          admins: users.filter(u => u.role === 'admin').length,
        },
        stock: {
          totalTracks: tracks.length,
          totalLicenses: tracks.reduce((acc, t) => acc + (Number(t.stock_quantity) || 0), 0),
          lowStockTracks: tracks.filter(t => (Number(t.stock_quantity) || 0) <= 15 && (Number(t.stock_quantity) || 0) > 0).length,
          outOfStockTracks: tracks.filter(t => (Number(t.stock_quantity) || 0) === 0).length,
        },
        companies: {
          total: companies.length,
          active: companies.filter(c => (c.status || 'active') === 'active').length,
        },
        recentMovements,
      });
    } catch (fallbackErr) {
      console.error("[AdminMetrics] Erro no fallback:", fallbackErr);
      return res.status(500).json({ error: "Erro ao consolidar métricas administrativas." });
    }
  }
});

/**
 * GET /api/admin/sales
 * Consulta todas as vendas registradas com filtros e busca.
 */
router.get("/sales", async (req, res) => {
  const { search = "", type = "all", companyId, period = "all" } = req.query;

  try {
    let sql = `
      SELECT 
        cp.id,
        cp.type,
        cp.price,
        cp.created_at,
        cp.expires_at,
        ct.id AS track_id,
        ct.title AS track_title,
        ct.artist AS track_artist,
        ct.album AS track_album,
        ct.genre AS track_genre,
        ct.cover_url AS track_cover,
        c.id AS company_id,
        c.name AS company_name,
        c.logo_url AS company_logo,
        cp.user_id,
        COALESCE(u.full_name, CONCAT('Usuário #', cp.user_id)) AS buyer_name,
        COALESCE(u.email, 'cadastro.legado@devsongs.com') AS buyer_email
      FROM company_purchases cp
      LEFT JOIN company_tracks ct ON cp.track_id = ct.id
      LEFT JOIN companies c ON cp.company_id = c.id
      LEFT JOIN users u ON cp.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (type && type !== "all") {
      sql += " AND cp.type = ?";
      params.push(type);
    }

    if (companyId && companyId !== "all") {
      sql += " AND cp.company_id = ?";
      params.push(companyId);
    }

    if (period === "today") {
      sql += " AND DATE(cp.created_at) = CURDATE()";
    } else if (period === "7d") {
      sql += " AND cp.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    } else if (period === "30d") {
      sql += " AND cp.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    }

    if (search && search.trim() !== "") {
      const term = `%${search.trim()}%`;
      sql += " AND (ct.title LIKE ? OR ct.artist LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)";
      params.push(term, term, term, term);
    }

    sql += " ORDER BY cp.created_at DESC";

    const [sales] = await pool.query(sql, params);

    const formattedSales = sales.map((s) => ({
      ...s,
      price: Number(s.price),
      sale_status: "concluída",
      payment_status: "confirmado",
    }));

    return res.json({
      total: formattedSales.length,
      sales: formattedSales,
    });
  } catch (err) {
    console.error("[AdminSales] Erro ao listar vendas:", err);
    return res.status(500).json({ error: "Erro ao consultar vendas." });
  }
});

/**
 * GET /api/admin/financial
 * Relatório financeiro detalhado com faturamento por gravadora e tipo de receita.
 */
router.get("/financial", async (req, res) => {
  try {
    // 1. Receitas consolidadas por gravadora/base
    const [byCompany] = await pool.query(`
      SELECT 
        c.id AS company_id,
        c.name AS company_name,
        c.logo_url AS company_logo,
        COUNT(cp.id) AS total_transactions,
        COALESCE(SUM(cp.price), 0) AS total_revenue,
        COUNT(CASE WHEN cp.type = 'buy' THEN 1 END) AS buy_count,
        COALESCE(SUM(CASE WHEN cp.type = 'buy' THEN cp.price ELSE 0 END), 0) AS buy_revenue,
        COUNT(CASE WHEN cp.type = 'rent' THEN 1 END) AS rent_count,
        COALESCE(SUM(CASE WHEN cp.type = 'rent' THEN cp.price ELSE 0 END), 0) AS rent_revenue
      FROM companies c
      LEFT JOIN company_purchases cp ON c.id = cp.company_id
      GROUP BY c.id
      ORDER BY total_revenue DESC
    `);

    // 2. Histórico de faturamento diário
    const [timeline] = await pool.query(`
      SELECT 
        DATE(created_at) AS date,
        COUNT(id) AS transactions_count,
        COALESCE(SUM(price), 0) AS daily_revenue
      FROM company_purchases
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 15
    `);

    // 3. Totais gerais
    const [overall] = await pool.query(`
      SELECT 
        COUNT(id) AS total_sales,
        COALESCE(SUM(price), 0) AS total_revenue,
        COUNT(CASE WHEN type = 'buy' THEN 1 END) AS buy_sales,
        COALESCE(SUM(CASE WHEN type = 'buy' THEN price ELSE 0 END), 0) AS buy_amount,
        COUNT(CASE WHEN type = 'rent' THEN 1 END) AS rent_sales,
        COALESCE(SUM(CASE WHEN type = 'rent' THEN price ELSE 0 END), 0) AS rent_amount
      FROM company_purchases
    `);

    const stats = overall[0] || {};
    const totalRev = Number(stats.total_revenue || 0);

    return res.json({
      summary: {
        totalRevenue: totalRev,
        receivedRevenue: totalRev,
        pendingRevenue: 0.0,
        refundsCount: 0,
        refundsAmount: 0.0,
        registeredExpenses: 0.0,
        netBalance: totalRev,
        note: "O sistema DevSongs opera com faturamento direto via transações de compra e aluguel de licenças musicais. Não há registro de custos operacionais/despesas cadastrados no banco de dados.",
      },
      distribution: {
        buy: {
          count: Number(stats.buy_sales || 0),
          amount: Number(stats.buy_amount || 0),
        },
        rent: {
          count: Number(stats.rent_sales || 0),
          amount: Number(stats.rent_amount || 0),
        },
      },
      byCompany,
      timeline,
    });
  } catch (err) {
    console.error("[AdminFinancial] Erro ao carregar financeiro:", err);
    return res.status(500).json({ error: "Erro ao gerar relatório financeiro." });
  }
});

/**
 * GET /api/admin/stock
 * Consulta o catálogo de músicas e seus estoques de licença nas gravadoras.
 */
router.get("/stock", async (req, res) => {
  const { search = "", companyId, status = "all", lowStockOnly } = req.query;

  try {
    let sql = `
      SELECT 
        ct.id,
        ct.company_id,
        ct.title,
        ct.artist,
        ct.album,
        ct.genre,
        ct.cover_url,
        ct.duration_sec,
        ct.stock_quantity,
        ct.sale_price,
        ct.rent_price,
        ct.status,
        ct.available_for_stream,
        ct.is_exclusive,
        c.name AS company_name,
        c.logo_url AS company_logo
      FROM company_tracks ct
      JOIN companies c ON ct.company_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (companyId && companyId !== "all") {
      sql += " AND ct.company_id = ?";
      params.push(companyId);
    }

    if (status && status !== "all") {
      sql += " AND ct.status = ?";
      params.push(status);
    }

    if (lowStockOnly === "true" || lowStockOnly === true) {
      sql += " AND ct.stock_quantity <= 15";
    }

    if (search && search.trim() !== "") {
      const term = `%${search.trim()}%`;
      sql += " AND (ct.title LIKE ? OR ct.artist LIKE ? OR ct.album LIKE ?)";
      params.push(term, term, term);
    }

    sql += " ORDER BY ct.stock_quantity ASC, ct.title ASC";

    const [tracks] = await pool.query(sql, params);

    const formattedTracks = tracks.map((t) => ({
      ...t,
      stockStatus:
        t.stock_quantity === 0
          ? "esgotado"
          : t.stock_quantity <= 15
          ? "baixo"
          : "disponivel",
      sale_price: Number(t.sale_price),
      rent_price: Number(t.rent_price),
    }));

    return res.json({
      total: formattedTracks.length,
      tracks: formattedTracks,
    });
  } catch (err) {
    console.error("[AdminStock] Erro ao carregar estoque:", err);
    return res.status(500).json({ error: "Erro ao consultar estoque de faixas." });
  }
});

/**
 * PATCH /api/admin/stock/:id
 * Atualiza estoque ou preço de uma faixa.
 */
router.patch("/stock/:id", async (req, res) => {
  const { id } = req.params;
  const { stock_quantity, sale_price, rent_price, status, cover_url, title, artist, genre, company_id } = req.body;

  try {
    const updates = [];
    const params = [];

    const parsePrice = (val) => {
      if (val === undefined || val === null) return undefined;
      const num = parseFloat(String(val).replace(",", ".").trim());
      return isNaN(num) ? undefined : Math.max(0, num);
    };

    if (stock_quantity !== undefined) {
      const q = parseInt(String(stock_quantity).trim(), 10);
      if (!isNaN(q)) {
        updates.push("stock_quantity = ?");
        params.push(Math.max(0, q));
      }
    }

    const cleanSale = parsePrice(sale_price);
    if (cleanSale !== undefined) {
      updates.push("sale_price = ?");
      params.push(cleanSale);
    }

    const cleanRent = parsePrice(rent_price);
    if (cleanRent !== undefined) {
      updates.push("rent_price = ?");
      params.push(cleanRent);
    }

    if (cover_url !== undefined && typeof cover_url === 'string' && cover_url.trim() !== '') {
      updates.push("cover_url = ?");
      params.push(cover_url.trim());
    }

    if (title !== undefined && typeof title === 'string' && title.trim() !== '') {
      updates.push("title = ?");
      params.push(title.trim());
    }

    if (artist !== undefined && typeof artist === 'string' && artist.trim() !== '') {
      updates.push("artist = ?");
      params.push(artist.trim());
    }

    if (genre !== undefined && typeof genre === 'string' && genre.trim() !== '') {
      updates.push("genre = ?");
      params.push(genre.trim());
    }

    let cleanCompanyId;
    if (company_id !== undefined) {
      const cid = parseInt(String(company_id).trim(), 10);
      if (!isNaN(cid) && cid > 0) {
        const [compCheck] = await pool.query("SELECT id FROM companies WHERE id = ?", [cid]);
        if (compCheck.length === 0) {
          return res.status(400).json({ error: "Gravadora informada não existe." });
        }
        cleanCompanyId = cid;
        updates.push("company_id = ?");
        params.push(cleanCompanyId);
      }
    }

    if (status !== undefined && ["active", "inactive"].includes(status)) {
      updates.push("status = ?");
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "Nenhum campo fornecido para atualização." });
    }

    params.push(id);
    const [result] = await pool.query(
      `UPDATE company_tracks SET ${updates.join(", ")} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Faixa não encontrada." });
    }

    // Se a gravadora foi reatribuída, sincroniza as transações contábeis associadas a essa faixa
    if (cleanCompanyId !== undefined) {
      await pool.query(
        "UPDATE company_purchases SET company_id = ? WHERE track_id = ?",
        [cleanCompanyId, id]
      );
    }

    return res.json({ success: true, message: "Estoque/dados da faixa atualizados com sucesso!" });
  } catch (err) {
    console.error("[AdminStock] Erro ao atualizar faixa:", err);
    return res.status(500).json({ error: "Erro ao atualizar dados do estoque." });
  }
});

/**
 * ========================================================
 * ROTAS ADMINISTRATIVAS DE GRAVADORAS E BASES MUSICAIS
 * ========================================================
 */

/**
 * GET /api/admin/companies
 * Lista todas as gravadoras/bases com estatísticas de faixas, estoque e receita.
 */
router.get("/companies", async (req, res) => {
  try {
    const [companies] = await pool.query(`
      SELECT 
        c.*,
        COUNT(DISTINCT ct.id) AS total_tracks,
        COUNT(DISTINCT CASE WHEN ct.status = 'active' THEN ct.id END) AS active_tracks,
        COALESCE(SUM(ct.stock_quantity), 0) AS total_stock,
        COUNT(DISTINCT cp.id) AS total_sales_count,
        COALESCE(SUM(cp.price), 0) AS total_revenue
      FROM companies c
      LEFT JOIN company_tracks ct ON c.id = ct.company_id
      LEFT JOIN company_purchases cp ON c.id = cp.company_id
      GROUP BY c.id
      ORDER BY c.id ASC
    `);

    return res.json({
      total: companies.length,
      companies: companies.map((c) => ({
        ...c,
        total_tracks: Number(c.total_tracks || 0),
        active_tracks: Number(c.active_tracks || 0),
        total_stock: Number(c.total_stock || 0),
        total_revenue: Number(c.total_revenue || 0),
        total_sales_count: Number(c.total_sales_count || 0),
      })),
    });
  } catch (err) {
    console.warn("[AdminCompanies] MySQL indisponível, usando fallback JSON:", err.message);
    try {
      const companies = readJsonFile(COMPANIES_FILE, []);
      const tracks = readJsonFile(TRACKS_FILE, []);
      const purchases = readJsonFile(PURCHASES_FILE, []);

      const list = companies.map(c => {
        const cTracks = tracks.filter(t => t.company_id === c.id);
        const cPurchases = purchases.filter(p => p.company_id === c.id);
        return {
          ...c,
          total_tracks: cTracks.length,
          active_tracks: cTracks.filter(t => t.status === 'active').length,
          total_stock: cTracks.reduce((acc, t) => acc + (Number(t.stock_quantity) || 0), 0),
          total_revenue: cPurchases.reduce((acc, p) => acc + (Number(p.price) || 0), 0),
          total_sales_count: cPurchases.length,
        };
      });

      return res.json({
        total: list.length,
        companies: list,
      });
    } catch (fallbackErr) {
      console.error("[AdminCompanies] Erro no fallback:", fallbackErr);
      return res.status(500).json({ error: "Erro ao consultar gravadoras." });
    }
  }
});

/**
 * POST /api/admin/companies
 * Cadastra uma nova gravadora ou selo musical parceiro.
 */
router.post("/companies", async (req, res) => {
  const {
    name,
    slug,
    genre = "Variado",
    description = "",
    city = "São Paulo",
    state = "SP",
    logo_url = "",
    banner_url = "",
    status = "active",
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Nome da gravadora é obrigatório." });
  }

  // Gera slug automaticamente caso não fornecido
  let cleanSlug = slug && slug.trim() ? slug.trim().toLowerCase() : "";
  if (!cleanSlug) {
    cleanSlug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  try {
    const [existing] = await pool.query(
      "SELECT id FROM companies WHERE slug = ? LIMIT 1",
      [cleanSlug]
    );
    if (existing.length > 0) {
      return res.status(400).json({
        error: `O identificador (slug) "${cleanSlug}" já está em uso por outra gravadora.`,
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO companies (name, slug, genre, description, city, state, logo_url, banner_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        name.trim(),
        cleanSlug,
        genre.trim() || "Variado",
        description ? description.trim() : null,
        city ? city.trim() : "São Paulo",
        state ? state.trim().toUpperCase() : "SP",
        logo_url ? logo_url.trim() : "https://res.cloudinary.com/z7j0hqnl/image/upload/v1793030284/bookhub/img/logo-devsongs.png",
        banner_url ? banner_url.trim() : null,
        ["active", "inactive"].includes(status) ? status : "active",
      ]
    );

    return res.status(201).json({
      success: true,
      message: `Gravadora "${name}" cadastrada com sucesso!`,
      companyId: result.insertId,
    });
  } catch (err) {
    console.error("[AdminCompanies] Erro ao cadastrar gravadora:", err);
    return res.status(500).json({ error: "Erro ao cadastrar gravadora." });
  }
});

/**
 * PUT /api/admin/companies/:id
 * Atualiza os dados de uma gravadora existente.
 */
router.put("/companies/:id", async (req, res) => {
  const { id } = req.params;
  const {
    name,
    slug,
    genre,
    description,
    city,
    state,
    logo_url,
    banner_url,
    status,
  } = req.body;

  try {
    const [compRows] = await pool.query(
      "SELECT id, slug FROM companies WHERE id = ?",
      [id]
    );
    if (compRows.length === 0) {
      return res.status(404).json({ error: "Gravadora não encontrada." });
    }

    const updates = [];
    const params = [];

    if (name !== undefined && name.trim()) {
      updates.push("name = ?");
      params.push(name.trim());
    }

    if (slug !== undefined && slug.trim()) {
      const cleanSlug = slug.trim().toLowerCase();
      const [slugCheck] = await pool.query(
        "SELECT id FROM companies WHERE slug = ? AND id != ?",
        [cleanSlug, id]
      );
      if (slugCheck.length > 0) {
        return res.status(400).json({
          error: `O slug "${cleanSlug}" já pertence a outra gravadora.`,
        });
      }
      updates.push("slug = ?");
      params.push(cleanSlug);
    }

    if (genre !== undefined) {
      updates.push("genre = ?");
      params.push(genre.trim() || "Variado");
    }

    if (description !== undefined) {
      updates.push("description = ?");
      params.push(description.trim());
    }

    if (city !== undefined) {
      updates.push("city = ?");
      params.push(city.trim());
    }

    if (state !== undefined) {
      updates.push("state = ?");
      params.push(state.trim().toUpperCase());
    }

    if (logo_url !== undefined) {
      updates.push("logo_url = ?");
      params.push(logo_url.trim());
    }

    if (banner_url !== undefined) {
      updates.push("banner_url = ?");
      params.push(banner_url.trim());
    }

    if (status !== undefined && ["active", "inactive"].includes(status)) {
      updates.push("status = ?");
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "Nenhum dado fornecido para alteração." });
    }

    params.push(id);
    await pool.query(
      `UPDATE companies SET ${updates.join(", ")} WHERE id = ?`,
      params
    );

    return res.json({
      success: true,
      message: "Gravadora atualizada com sucesso!",
    });
  } catch (err) {
    console.error("[AdminCompanies] Erro ao atualizar gravadora:", err);
    return res.status(500).json({ error: "Erro ao atualizar dados da gravadora." });
  }
});

/**
 * GET /api/admin/companies/:id/tracks
 * Consulta todas as faixas associadas a uma gravadora específica.
 */
router.get("/companies/:id/tracks", async (req, res) => {
  const { id } = req.params;
  try {
    const [company] = await pool.query("SELECT * FROM companies WHERE id = ?", [id]);
    if (company.length === 0) {
      return res.status(404).json({ error: "Gravadora não encontrada." });
    }

    const [tracks] = await pool.query(
      `
      SELECT 
        ct.*,
        c.name AS company_name,
        c.logo_url AS company_logo
      FROM company_tracks ct
      JOIN companies c ON ct.company_id = c.id
      WHERE ct.company_id = ?
      ORDER BY ct.id ASC
    `,
      [id]
    );

    return res.json({
      company: company[0],
      total: tracks.length,
      tracks: tracks.map((t) => ({
        ...t,
        sale_price: Number(t.sale_price),
        rent_price: Number(t.rent_price),
      })),
    });
  } catch (err) {
    console.error("[AdminCompanies] Erro ao listar faixas da gravadora:", err);
    return res.status(500).json({ error: "Erro ao listar faixas da gravadora." });
  }
});

/**
 * GET /api/admin/users
 * Lista todos os usuários cadastrados com suas estatísticas de compras.
 * NUNCA retorna o hash de senha.
 */
router.get("/users", async (req, res) => {
  const { search = "", role = "all", status = "all" } = req.query;

  try {
    let sql = `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.role,
        COALESCE(u.status, 'active') AS status,
        u.avatar_url,
        u.phone,
        u.city,
        u.state,
        u.created_at,
        COUNT(cp.id) AS total_purchases,
        COALESCE(SUM(cp.price), 0) AS total_spent
      FROM users u
      LEFT JOIN company_purchases cp ON u.id = cp.user_id
      WHERE 1=1
    `;
    const params = [];

    if (role && role !== "all") {
      sql += " AND u.role = ?";
      params.push(role);
    }

    if (status && status !== "all") {
      sql += " AND u.status = ?";
      params.push(status);
    }

    if (search && search.trim() !== "") {
      const term = `%${search.trim()}%`;
      sql += " AND (u.full_name LIKE ? OR u.email LIKE ?)";
      params.push(term, term);
    }

    sql += " GROUP BY u.id ORDER BY u.id DESC";

    const [users] = await pool.query(sql, params);

    return res.json({
      total: users.length,
      users: users.map((u) => ({
        ...u,
        total_spent: Number(u.total_spent || 0),
        total_purchases: Number(u.total_purchases || 0),
      })),
    });
  } catch (err) {
    console.warn("[AdminUsers] MySQL indisponível, usando fallback users.json:", err.message);
    try {
      const users = readJsonFile(USERS_FILE, []);
      const purchases = readJsonFile(PURCHASES_FILE, []);

      let filtered = users;
      if (role && role !== "all") {
        filtered = filtered.filter(u => (u.role || 'user') === role);
      }
      if (status && status !== "all") {
        filtered = filtered.filter(u => (u.status || 'active') === status);
      }
      if (search && search.trim() !== "") {
        const term = search.toLowerCase().trim();
        filtered = filtered.filter(u =>
          (u.full_name || u.name || '').toLowerCase().includes(term) ||
          (u.email || '').toLowerCase().includes(term)
        );
      }

      const mapped = filtered.map(u => {
        const userPurchases = purchases.filter(p => p.user_id === u.id);
        const totalSpent = userPurchases.reduce((acc, p) => acc + (Number(p.price) || 0), 0);
        return {
          id: u.id,
          full_name: u.full_name || u.name,
          email: u.email,
          role: u.role || 'user',
          status: u.status || 'active',
          avatar_url: u.avatar_url || null,
          phone: u.phone || null,
          city: u.city || null,
          state: u.state || null,
          created_at: u.created_at || new Date().toISOString(),
          total_purchases: userPurchases.length,
          total_spent: totalSpent
        };
      });

      return res.json({
        total: mapped.length,
        users: mapped
      });
    } catch (fallbackErr) {
      console.error("[AdminUsers] Erro no fallback:", fallbackErr);
      return res.status(500).json({ error: "Erro ao consultar usuários." });
    }
  }
});

/**
 * POST /api/admin/users
 * Criação segura de novo usuário pelo Superadmin (com suporte a MySQL + Fallback JSON)
 */
router.post("/users", async (req, res) => {
  const { full_name, email, password, role = "user", status = "active" } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: "Nome completo, e-mail e senha são obrigatórios." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const validRole = role === "admin" ? "admin" : "user";
  const validStatus = ["active", "inactive", "blocked"].includes(status) ? status : "active";

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    let newUserId = null;

    // 1. Tenta persistir no MySQL
    try {
      const [existing] = await pool.query(
        "SELECT id FROM users WHERE LOWER(TRIM(email)) = ? LIMIT 1",
        [normalizedEmail]
      );
      if (existing && existing.length > 0) {
        return res.status(400).json({ error: "Este endereço de e-mail já está em uso por outro usuário." });
      }

      const [result] = await pool.query(
        "INSERT INTO users (full_name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)",
        [full_name.trim(), normalizedEmail, hashedPassword, validRole, validStatus]
      );
      newUserId = result.insertId;
    } catch (dbErr) {
      console.warn("[AdminUsers] MySQL indisponível, usando persistência local JSON:", dbErr.message);
    }

    // 2. Sempre sincroniza e garante persistência em users.json
    const users = readJsonFile(USERS_FILE, []);
    const localConflict = users.find(u => (u.email || '').toLowerCase().trim() === normalizedEmail);
    if (localConflict) {
      return res.status(400).json({ error: "Este endereço de e-mail já está em uso por outro usuário." });
    }

    if (!newUserId) {
      newUserId = Math.max(...users.map(u => Number(u.id) || 0), 0) + 1;
    }

    const newUserObj = {
      id: newUserId,
      name: full_name.trim(),
      full_name: full_name.trim(),
      email: normalizedEmail,
      password_hash: hashedPassword,
      role: validRole,
      status: validStatus,
      created_at: new Date().toISOString()
    };
    users.push(newUserObj);
    writeJsonFile(USERS_FILE, users);

    return res.status(201).json({
      success: true,
      message: `Usuário ${full_name} criado com sucesso!`,
      user: {
        id: newUserId,
        full_name: full_name.trim(),
        email: normalizedEmail,
        role: validRole,
        status: validStatus,
      },
    });
  } catch (err) {
    console.error("[AdminUsers] Erro ao cadastrar usuário:", err);
    return res.status(500).json({ error: "Erro ao criar usuário no banco de dados." });
  }
});

/**
 * PUT /api/admin/users/:id
 * Edição de dados do usuário (nome, e-mail, função, status).
 */
router.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const targetId = parseInt(id, 10);
  const { full_name, email, role, status, password } = req.body;

  // Se o admin logado estiver editando a si mesmo, não pode tirar sua própria role de admin
  if (req.user.id === targetId && role && role !== "admin") {
    return res.status(400).json({
      error: "Você não pode revogar seu próprio privilégio de Superadmin.",
    });
  }

  // Se o admin logado estiver editando a si mesmo, não pode desativar sua própria conta
  if (req.user.id === targetId && status && status !== "active") {
    return res.status(400).json({
      error: "Você não pode desativar ou bloquear sua própria conta de administrador.",
    });
  }

  try {
    let hashedPassword = null;
    if (password && password.trim().length >= 6) {
      hashedPassword = await bcrypt.hash(password.trim(), saltRounds);
    }

    // 1. Tenta atualizar no MySQL
    try {
      const [targetUsers] = await pool.query("SELECT * FROM users WHERE id = ?", [targetId]);
      if (targetUsers.length > 0) {
        const current = targetUsers[0];
        const updates = [];
        const params = [];

        if (full_name) {
          updates.push("full_name = ?");
          params.push(full_name.trim());
        }
        if (email) {
          const normalizedEmail = email.toLowerCase().trim();
          if (normalizedEmail !== current.email.toLowerCase().trim()) {
            const [conflict] = await pool.query(
              "SELECT id FROM users WHERE LOWER(TRIM(email)) = ? AND id != ? LIMIT 1",
              [normalizedEmail, targetId]
            );
            if (conflict && conflict.length > 0) {
              return res.status(400).json({ error: "Este e-mail já está sendo utilizado por outro usuário." });
            }
            updates.push("email = ?");
            params.push(normalizedEmail);
          }
        }
        if (role && ["user", "admin"].includes(role)) {
          updates.push("role = ?");
          params.push(role);
        }
        if (status && ["active", "inactive", "blocked"].includes(status)) {
          updates.push("status = ?");
          params.push(status);
        }
        if (hashedPassword) {
          updates.push("password_hash = ?");
          params.push(hashedPassword);
        }

        if (updates.length > 0) {
          params.push(targetId);
          await pool.query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, params);
        }
      }
    } catch (dbErr) {
      console.warn("[AdminUsers] MySQL indisponível, sincronizando no fallback JSON:", dbErr.message);
    }

    // 2. Atualiza no users.json
    const users = readJsonFile(USERS_FILE, []);
    const userIdx = users.findIndex(u => Number(u.id) === targetId);
    if (userIdx !== -1) {
      if (email) {
        const normEmail = email.toLowerCase().trim();
        const conf = users.find(u => Number(u.id) !== targetId && (u.email || '').toLowerCase().trim() === normEmail);
        if (conf) {
          return res.status(400).json({ error: "Este e-mail já está sendo utilizado por outro usuário." });
        }
        users[userIdx].email = normEmail;
      }
      if (full_name) {
        users[userIdx].full_name = full_name.trim();
        users[userIdx].name = full_name.trim();
      }
      if (role && ["user", "admin"].includes(role)) users[userIdx].role = role;
      if (status && ["active", "inactive", "blocked"].includes(status)) users[userIdx].status = status;
      if (hashedPassword) users[userIdx].password_hash = hashedPassword;
      writeJsonFile(USERS_FILE, users);
    }

    return res.json({
      success: true,
      message: "Dados do usuário atualizados com sucesso!",
    });
  } catch (err) {
    console.error("[AdminUsers] Erro ao atualizar usuário:", err);
    return res.status(500).json({ error: "Erro ao atualizar dados do usuário." });
  }
});

/**
 * PATCH /api/admin/users/:id/status
 * Inativação ou Reativação segura de conta (SOFT DISABLE).
 */
router.patch("/users/:id/status", async (req, res) => {
  const { id } = req.params;
  const targetId = parseInt(id, 10);
  const { status } = req.body; // 'active', 'inactive', 'blocked'

  if (!["active", "inactive", "blocked"].includes(status)) {
    return res.status(400).json({ error: "Status inválido. Escolha 'active', 'inactive' ou 'blocked'." });
  }

  if (req.user.id === targetId && status !== "active") {
    return res.status(400).json({
      error: "Ação bloqueada por segurança: Você não pode inativar ou bloquear sua própria conta de administrador.",
    });
  }

  try {
    try {
      await pool.query("UPDATE users SET status = ? WHERE id = ?", [status, targetId]);
    } catch (dbErr) {
      console.warn("[AdminUsers] MySQL indisponível, atualizando status em users.json:", dbErr.message);
    }

    const users = readJsonFile(USERS_FILE, []);
    const userIdx = users.findIndex(u => Number(u.id) === targetId);
    if (userIdx !== -1) {
      users[userIdx].status = status;
      writeJsonFile(USERS_FILE, users);
    }

    const actionText = status === "active" ? "reativada" : status === "inactive" ? "inativada" : "bloqueada";

    return res.json({
      success: true,
      message: `Conta de usuário ${actionText} com sucesso!`,
      status,
    });
  } catch (err) {
    console.error("[AdminUsers] Erro ao alterar status:", err);
    return res.status(500).json({ error: "Erro ao modificar status do usuário." });
  }
});

module.exports = router;
