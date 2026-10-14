const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const pool = require("../config/database");

const router = express.Router();
const saltRounds = 10;
const JWT_SECRET = process.env.JWT_SECRET || "devsongs_super_secret_jwt_key_2026";

// Armazenamento local de fallback resiliente
const DATA_DIR = path.join(__dirname, "../../data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]", "utf8");
}

function getLocalUsers() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf8");
    return JSON.parse(raw);
  } catch (_) {
    return [];
  }
}

function saveLocalUsers(users) {
  ensureDataFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

// Rota de registro de usuário
router.post("/register", async (req, res) => {
  const { email, password, full_name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // 1. Tentar gravar no MySQL se disponível
  let dbFailed = false;
  try {
    const [existingUser] = await pool.query("SELECT * FROM users WHERE email = ?", [normalizedEmail]);

    if (existingUser && existingUser.length > 0) {
      return res.status(400).json({ error: "E-mail já cadastrado." });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await pool.query(
      "INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)",
      [normalizedEmail, hashedPassword, full_name || ""]
    );

    return res.status(201).json({ message: "Usuário cadastrado com sucesso!" });
  } catch (error) {
    dbFailed = true;
    console.warn("MySQL não conectado ou indisponível. Usando armazenamento local seguro:", error.message);
  }

  // 2. Fallback automático para banco local JSON
  if (dbFailed) {
    try {
      const users = getLocalUsers();

      if (users.some((u) => u.email === normalizedEmail)) {
        return res.status(400).json({ error: "E-mail já cadastrado." });
      }

      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const newUser = {
        id: users.length > 0 ? Math.max(...users.map((u) => u.id || 0)) + 1 : 1,
        email: normalizedEmail,
        password_hash: hashedPassword,
        full_name: full_name || "",
        avatar_url: null,
        role: "user",
        created_at: new Date().toISOString(),
      };

      users.push(newUser);
      saveLocalUsers(users);

      return res.status(201).json({ message: "Usuário cadastrado com sucesso!" });
    } catch (err) {
      console.error("Erro no registro local:", err);
      return res.status(500).json({ error: "Erro ao registrar usuário." });
    }
  }
});

// Rota de login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Preencha todos os campos." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  let userData = null;

  // 1. Tentar buscar no MySQL
  try {
    const [user] = await pool.query(
      `
      SELECT 
        id, 
        email, 
        full_name,
        password_hash,
        avatar_url,
        role
      FROM users
      WHERE email = ?
    `,
      [normalizedEmail]
    );

    if (user && user.length > 0) {
      userData = user[0];
    }
  } catch (error) {
    console.warn("MySQL indisponível no login. Consultando fallback local:", error.message);
  }

  // 2. Se não encontrou no MySQL, buscar no armazenamento local
  if (!userData) {
    const users = getLocalUsers();
    userData = users.find((u) => u.email === normalizedEmail);
  }

  if (!userData) {
    return res.status(400).json({ error: "E-mail ou senha inválidos." });
  }

  // Verifica se a senha está correta
  const validPassword = await bcrypt.compare(password, userData.password_hash);

  if (!validPassword) {
    return res.status(400).json({ error: "E-mail ou senha inválidos." });
  }

  // Gera o token JWT
  const token = jwt.sign(
    { id: userData.id, email: userData.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  // Retorna tudo que o frontend precisa
  return res.json({
    token,
    user: {
      id: userData.id,
      email: userData.email,
      full_name: userData.full_name,
      avatar_url: userData.avatar_url,
      role: userData.role || "user",
    },
  });
});

// Rota de redefinição de senha
router.post("/reset-password", async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  if (!email || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: "Preencha todos os campos." });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: "As senhas não coincidem." });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    let found = false;
    try {
      const [user] = await pool.query("SELECT * FROM users WHERE email = ?", [normalizedEmail]);
      if (user && user.length > 0) {
        found = true;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        await pool.query("UPDATE users SET password_hash = ? WHERE email = ?", [hashedPassword, normalizedEmail]);
      }
    } catch (_) {}

    if (!found) {
      const users = getLocalUsers();
      const idx = users.findIndex((u) => u.email === normalizedEmail);
      if (idx !== -1) {
        users[idx].password_hash = await bcrypt.hash(newPassword, saltRounds);
        saveLocalUsers(users);
      }
    }

    return res.status(200).json({ message: "Se o e-mail existir, a senha será redefinida." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao redefinir senha." });
  }
});

module.exports = router;
