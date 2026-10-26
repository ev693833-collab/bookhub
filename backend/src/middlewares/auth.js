const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "devsongs_super_secret_jwt_key_2026";

/**
 * Middleware estrito de autenticação via JWT.
 * Bloqueia requisições sem token válido (HTTP 401).
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ error: "Acesso não autorizado. Token não fornecido." });
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return res.status(401).json({ error: "Token de autenticação inválido ou ausente." });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    if (!verified || !verified.id) {
      return res.status(401).json({ error: "Token inválido ou expirado." });
    }
    req.user = verified;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Sessão inválida ou expirada. Faça login novamente." });
  }
};

/**
 * Middleware de autenticação opcional via JWT.
 * Não bloqueia requisições públicas. Se um token válido for fornecido,
 * anexa `req.user` para permitir personalização segura baseada na identidade.
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    req.user = null;
    return next();
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = (verified && verified.id) ? verified : null;
  } catch (_) {
    req.user = null;
  }

  next();
};

verifyToken.optional = optionalAuth;

module.exports = verifyToken;
