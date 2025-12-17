// Login con username/password. Retorna JWT + datos básicos del usuario.

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { ENV } = require("../config/env");

async function login(req, res) {
  // ✅ PROTECCIÓN CLAVE
  if (!req.body) {
    return res.status(400).json({
      message: "Body vacío. Envía JSON con Content-Type: application/json"
    });
  }

  const { username, password } = req.body;

  // ✅ VALIDACIÓN BÁSICA
  if (!username || !password) {
    return res.status(400).json({
      message: "username y password son requeridos."
    });
  }

  const user = await User.findOne({ username }).lean();
  if (!user || !user.isActive) {
    return res.status(401).json({ message: "Credenciales inválidas." });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Credenciales inválidas." });
  }

  // Token con información mínima
  const token = jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      username: user.username,
      fullName: user.fullName
    },
    ENV.JWT_SECRET,
    { expiresIn: "8h" }
  );

  return res.json({
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      username: user.username,
      role: user.role
    }
  });
}

module.exports = { login };
