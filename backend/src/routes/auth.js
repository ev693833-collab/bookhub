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
    const [existingUser] = await pool.query("SELECT id FROM users WHERE LOWER(TRIM(email)) = ?", [normalizedEmail]);

    if (existingUser && existingUser.length > 0) {
      return res.status(400).json({ error: "Este endereço de e-mail já está cadastrado em outra conta." });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await pool.query(
      "INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)",
      [normalizedEmail, hashedPassword, full_name || ""]
    );

    return res.status(201).json({ message: "Usuário cadastrado com sucesso!" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY" || error.errno === 1062) {
      return res.status(400).json({ error: "Este endereço de e-mail já está cadastrado em outra conta." });
    }
    dbFailed = true;
    console.warn("MySQL não conectado ou indisponível. Usando armazenamento local seguro:", error.message);
  }

  // 2. Fallback automático para banco local JSON
  if (dbFailed) {
    try {
      const users = getLocalUsers();

      if (users.some((u) => u.email && u.email.toLowerCase().trim() === normalizedEmail)) {
        return res.status(400).json({ error: "Este endereço de e-mail já está cadastrado em outra conta." });
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

// Middleware de autenticação
const verifyToken = require("../middlewares/auth");

// Rota para consultar dados atuais do usuário logado
router.get("/me", verifyToken, async (req, res) => {
  const userId = req.user.id;
  const userEmail = (req.user.email || "").toLowerCase().trim();

  let userData = null;

  // 1. Tentar buscar no MySQL
  try {
    const [rows] = await pool.query(
      "SELECT id, full_name, email, avatar_url, role, created_at FROM users WHERE id = ? OR email = ?",
      [userId, userEmail]
    );
    if (rows && rows.length > 0) {
      userData = rows[0];
    }
  } catch (err) {
    console.warn("MySQL indisponível em /me. Buscando fallback local:", err.message);
  }

  // 2. Fallback local
  if (!userData) {
    const users = getLocalUsers();
    userData = users.find((u) => u.id === userId || (u.email && u.email.toLowerCase() === userEmail));
  }

  if (!userData) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }

  return res.json({
    user: {
      id: userData.id,
      full_name: userData.full_name || "",
      email: userData.email,
      avatar_url: userData.avatar_url || null,
      role: userData.role || "user",
      created_at: userData.created_at || null,
    },
  });
});

// Middleware de upload em memória para avatar
const multer = require("multer");
const uploadAvatar = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  storage: multer.memoryStorage(),
});

// Rota dedicada para envio e salvamento de foto de perfil (Multipart ou Base64)
router.post("/avatar", verifyToken, uploadAvatar.single("avatar"), async (req, res) => {
  try {
    let avatarUrl = null;

    if (req.file) {
      const mime = req.file.mimetype || "image/jpeg";
      const base64 = req.file.buffer.toString("base64");
      avatarUrl = `data:${mime};base64,${base64}`;
    } else if (req.body && req.body.avatar_url) {
      avatarUrl = req.body.avatar_url.trim();
    } else {
      return res.status(400).json({ error: "Nenhuma imagem foi enviada." });
    }

    const userId = req.user.id;
    const userEmail = (req.user.email || "").toLowerCase().trim();

    // 1. Localizar o usuário
    let currentUser = null;
    try {
      const [rows] = await pool.query("SELECT * FROM users WHERE id = ? OR email = ?", [userId, userEmail]);
      if (rows && rows.length > 0) currentUser = rows[0];
    } catch (e) {
      console.warn("MySQL indisponível ao salvar avatar:", e.message);
    }

    if (!currentUser) {
      const users = getLocalUsers();
      currentUser = users.find((u) => u.id === userId || (u.email && u.email.toLowerCase() === userEmail));
    }

    if (!currentUser) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    // 2. Gravar no MySQL
    try {
      await pool.query("UPDATE users SET avatar_url = ? WHERE id = ?", [avatarUrl, currentUser.id]);
      console.log(`[AUTH] Foto de perfil atualizada no MySQL para usuário ID: ${currentUser.id}`);
    } catch (e) {
      console.error("[AUTH] Erro ao gravar avatar no MySQL:", e);
    }

    // 3. Sincronizar no JSON local
    try {
      const users = getLocalUsers();
      const idx = users.findIndex((u) => u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase());
      if (idx !== -1) {
        users[idx].avatar_url = avatarUrl;
        saveLocalUsers(users);
      } else {
        users.push({
          id: currentUser.id,
          full_name: currentUser.full_name,
          email: currentUser.email,
          avatar_url: avatarUrl,
          role: currentUser.role || "user",
          password_hash: currentUser.password_hash,
          created_at: currentUser.created_at || new Date().toISOString(),
        });
        saveLocalUsers(users);
      }
    } catch (err) {
      console.error("[AUTH] Erro ao sincronizar avatar no users.json:", err);
    }

    const updatedUser = {
      id: currentUser.id,
      full_name: currentUser.full_name,
      email: currentUser.email,
      avatar_url: avatarUrl,
      role: currentUser.role || "user",
    };

    return res.json({
      message: "Foto de perfil atualizada com sucesso!",
      avatar_url: avatarUrl,
      user: updatedUser,
    });
  } catch (err) {
    console.error("[AUTH] Erro interno em /avatar:", err);
    return res.status(500).json({ error: "Falha ao processar e salvar a foto de perfil." });
  }
});

// Rota para atualizar o perfil do próprio usuário (dados pessoais, avatar e senha)
router.put("/profile", verifyToken, async (req, res) => {
  const userId = req.user.id;
  const userEmail = (req.user.email || "").toLowerCase().trim();
  const { full_name, email, avatar_url, current_password, new_password, newPassword, confirm_password, confirmPassword } = req.body;

  // 1. Localizar o registro atual do usuário
  let currentUser = null;

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ? OR email = ?", [userId, userEmail]);
    if (rows && rows.length > 0) {
      currentUser = rows[0];
    }
  } catch (err) {
    console.warn("MySQL indisponível na atualização de perfil:", err.message);
  }

  if (!currentUser) {
    const users = getLocalUsers();
    currentUser = users.find((u) => u.id === userId || (u.email && u.email.toLowerCase() === userEmail));
  }

  if (!currentUser) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }

  const effectiveFullName = full_name !== undefined ? full_name.trim() : (currentUser.full_name || "");
  const effectiveEmail = email !== undefined ? email.toLowerCase().trim() : (currentUser.email || "").toLowerCase().trim();

  if (!effectiveFullName) {
    return res.status(400).json({ error: "O nome completo é obrigatório." });
  }

  if (!effectiveEmail || !effectiveEmail.includes("@")) {
    return res.status(400).json({ error: "Informe um e-mail válido." });
  }

  // 2. Se o e-mail mudou, verificar se o novo e-mail já está em uso por outro usuário
  if (effectiveEmail !== currentUser.email.toLowerCase()) {
    try {
      const [existing] = await pool.query(
        "SELECT id FROM users WHERE LOWER(TRIM(email)) = ? AND id != ?",
        [effectiveEmail, currentUser.id]
      );
      if (existing && existing.length > 0) {
        return res.status(400).json({ error: "Este endereço de e-mail já está em uso por outra conta. Escolha outro e-mail." });
      }
    } catch (_) {}

    const localUsers = getLocalUsers();
    const conflict = localUsers.find(
      (u) => u.email && u.email.toLowerCase().trim() === effectiveEmail && u.id !== currentUser.id
    );
    if (conflict) {
      return res.status(400).json({ error: "Este endereço de e-mail já está em uso por outra conta. Escolha outro e-mail." });
    }
  }

  // 3. Validação de troca de senha (caso preenchida)
  let updatedPasswordHash = currentUser.password_hash;
  const targetNewPassword = new_password || newPassword;
  const targetConfirmPassword = confirm_password || confirmPassword;
  let passwordChanged = false;

  if (targetNewPassword) {
    if (current_password) {
      const isCurrentValid = await bcrypt.compare(current_password, currentUser.password_hash);
      if (!isCurrentValid) {
        return res.status(400).json({ error: "Senha atual incorreta." });
      }
    }
    if (targetNewPassword.length < 6) {
      return res.status(400).json({ error: "A nova senha deve ter no mínimo 6 caracteres." });
    }
    if (targetConfirmPassword && targetNewPassword !== targetConfirmPassword) {
      return res.status(400).json({ error: "A confirmação de senha não confere." });
    }
    updatedPasswordHash = await bcrypt.hash(targetNewPassword, saltRounds);
    passwordChanged = true;
  }

  // 4. Montar dados atualizados (ROLE NUNCA É ALTERADO PELO USUÁRIO)
  let finalAvatarUrl = currentUser.avatar_url || null;
  if (avatar_url !== undefined) {
    finalAvatarUrl = avatar_url && avatar_url.trim() ? avatar_url.trim() : null;
  }

  const updatedUser = {
    id: currentUser.id,
    full_name: effectiveFullName,
    email: effectiveEmail,
    avatar_url: finalAvatarUrl,
    role: currentUser.role || "user", // Preserva estritamente a permissão existente
    password_hash: updatedPasswordHash,
  };

  // 5. Persistir no MySQL se disponível
  try {
    const [result] = await pool.query(
      "UPDATE users SET full_name = ?, email = ?, avatar_url = ?, password_hash = ? WHERE id = ?",
      [updatedUser.full_name, updatedUser.email, updatedUser.avatar_url, updatedUser.password_hash, currentUser.id]
    );
    console.log(`[AUTH] Perfil atualizado no MySQL para usuário ID: ${currentUser.id}. Linhas afetadas: ${result?.affectedRows}`);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY" || err.errno === 1062) {
      return res.status(400).json({ error: "Este endereço de e-mail já está em uso por outra conta. Escolha outro e-mail." });
    }
    console.error("[AUTH] Falha ao atualizar perfil no MySQL:", err);
  }

  // 6. Sincronizar no fallback local users.json
  try {
    const users = getLocalUsers();
    const idx = users.findIndex((u) => u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase());
    if (idx !== -1) {
      users[idx] = {
        ...users[idx],
        full_name: updatedUser.full_name,
        email: updatedUser.email,
        avatar_url: updatedUser.avatar_url,
        password_hash: updatedUser.password_hash,
        role: users[idx].role || currentUser.role || "user",
      };
      saveLocalUsers(users);
    } else {
      users.push({
        id: updatedUser.id,
        full_name: updatedUser.full_name,
        email: updatedUser.email,
        avatar_url: updatedUser.avatar_url,
        password_hash: updatedUser.password_hash,
        role: updatedUser.role,
        created_at: currentUser.created_at || new Date().toISOString(),
      });
      saveLocalUsers(users);
    }
  } catch (err) {
    console.error("[AUTH] Erro ao sincronizar fallback local:", err);
  }

  // 7. Gerar novo token JWT atualizado
  const newToken = jwt.sign(
    { id: updatedUser.id, email: updatedUser.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  const successMsg = passwordChanged
    ? "Perfil e nova senha salvos com sucesso!"
    : "Perfil atualizado com sucesso!";

  return res.json({
    message: successMsg,
    token: newToken,
    user: {
      id: updatedUser.id,
      full_name: updatedUser.full_name,
      email: updatedUser.email,
      avatar_url: updatedUser.avatar_url,
      role: updatedUser.role,
    },
  });
});

module.exports = router;
