// Protege rutas con JWT.
// Lee Authorization: Bearer <token> y añade req.user.

const jwt = require("jsonwebtoken");
const { ENV } = require("../config/env");

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ message: "No autorizado (sin token)." });

  try {
    const payload = jwt.verify(token, ENV.JWT_SECRET);
    req.user = payload; // { sub, role, username, fullName }
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado." });
  }
}

module.exports = { auth };
