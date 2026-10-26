const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const path = require("path");
const fs = require("fs");

const JWT_SECRET = process.env.JWT_SECRET || "devsongs_super_secret_jwt_key_2026";
const DATA_DIR = path.join(__dirname, "../../data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function getLocalUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    }
  } catch (_) {}
  return [];
}

/**
 * Middleware para proteger rotas exclusivas do Superadmin.
 * Verifica a validade do JWT e confere no banco de dados se o usuário
 * possui a role 'admin' e se a sua conta está ativa.
 */
const verifyAdmin = async (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ error: "Acesso não autorizado. Token não fornecido." });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return res.status(401).json({ error: "Token de autenticação inválido ou ausente." });
  }

  try {
    // 1. Decodifica e valida assinatura do JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: "Token inválido ou expirado." });
    }

    // 2. Consulta a conta real no banco de dados para evitar manipulação de role no payload do cliente
    let userRecord = null;
    try {
      const [rows] = await pool.query(
        "SELECT id, full_name, email, role, status FROM users WHERE id = ? LIMIT 1",
        [decoded.id]
      );
      if (rows && rows.length > 0) {
        userRecord = rows[0];
      }
    } catch (dbErr) {
      console.warn("[AdminAuth] Erro ao consultar banco de dados, tentando fallback:", dbErr.message);
    }

    // Fallback local se MySQL estiver indisponível
    if (!userRecord) {
      const localUsers = getLocalUsers();
      userRecord = localUsers.find((u) => u.id === decoded.id || u.email === decoded.email);
    }

    if (!userRecord) {
      return res.status(401).json({ error: "Usuário não encontrado no sistema." });
    }

    // 3. Validação de status da conta (impede acesso de usuários inativos ou bloqueados)
    if (userRecord.status === "blocked" || userRecord.status === "inactive") {
      return res.status(403).json({
        error: "Sua conta está inativa ou bloqueada. Contate o suporte para reativação."
      });
    }

    // 4. Validação estrita de privilégio Superadmin
    if (userRecord.role !== "admin") {
      return res.status(403).json({
        error: "Acesso negado. Esta rota é restrita a administradores do sistema."
      });
    }

    // Adiciona o usuário autenticado e verificado à requisição
    req.user = userRecord;
    next();
  } catch (err) {
    console.error("[AdminAuth] Falha na verificação de token:", err.message);
    return res.status(401).json({ error: "Sessão inválida ou expirada. Faça login novamente." });
  }
};

module.exports = verifyAdmin;
