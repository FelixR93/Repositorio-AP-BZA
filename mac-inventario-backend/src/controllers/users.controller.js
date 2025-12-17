const bcrypt = require("bcryptjs");
const User = require("../models/User");

/**
 * Reglas:
 * - username único
 * - password se guarda como passwordHash
 * - ADMIN puede crear/editar/eliminar/activar-desactivar
 */

// GET /api/users
async function listUsers(req, res) {
  const users = await User.find({})
    .select("fullName username role isActive createdAt updatedAt")
    .sort({ createdAt: -1 })
    .lean();

  return res.json(users);
}

// GET /api/users/:id
async function getUserById(req, res) {
  const u = await User.findById(req.params.id)
    .select("fullName username role isActive createdAt updatedAt")
    .lean();

  if (!u) return res.status(404).json({ message: "Usuario no encontrado." });
  return res.json(u);
}

// POST /api/users
async function createUser(req, res) {
  const { fullName, username, password, role } = req.body;

  if (!fullName || !username || !password) {
    return res
      .status(400)
      .json({ message: "fullName, username y password son requeridos." });
  }

  const exists = await User.findOne({ username }).lean();
  if (exists)
    return res.status(409).json({ message: "El username ya existe." });

  const passwordHash = await bcrypt.hash(String(password), 10);

  const created = await User.create({
    fullName,
    username,
    role: role || "USER",
    passwordHash,
    isActive: true,
  });

  return res.status(201).json({
    _id: created._id,
    fullName: created.fullName,
    username: created.username,
    role: created.role,
    isActive: created.isActive,
  });
}

// PUT /api/users/:id
async function updateUser(req, res) {
  const { fullName, username, role, password } = req.body;

  const u = await User.findById(req.params.id);
  if (!u) return res.status(404).json({ message: "Usuario no encontrado." });

  if (!fullName || !username || !role) {
    return res
      .status(400)
      .json({ message: "fullName, username y role son requeridos." });
  }

  // username único (si cambia)
  if (username !== u.username) {
    const exists = await User.findOne({ username }).lean();
    if (exists)
      return res.status(409).json({ message: "El username ya existe." });
  }

  u.fullName = fullName;
  u.username = username;
  u.role = role;

  // contraseña opcional
  if (password && String(password).trim().length >= 4) {
    u.passwordHash = await bcrypt.hash(String(password).trim(), 10);
  }

  await u.save();

  return res.json({
    _id: u._id,
    fullName: u.fullName,
    username: u.username,
    role: u.role,
    isActive: u.isActive,
    updatedAt: u.updatedAt,
  });
}

// PATCH /api/users/:id/active
async function setUserActive(req, res) {
  const { isActive } = req.body;
  const userId = req.params.id;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "Usuario no encontrado." });
  }

  user.isActive = Boolean(isActive);
  await user.save();

  return res.json({
    _id: user._id,
    fullName: user.fullName,
    username: user.username,
    role: user.role,
    isActive: user.isActive,
  });
}

// DELETE /api/users/:id
async function deleteUser(req, res) {
  const u = await User.findById(req.params.id);
  if (!u) return res.status(404).json({ message: "Usuario no encontrado." });

  await User.findByIdAndDelete(req.params.id);
  return res.json({ message: "✅ Usuario eliminado correctamente." });
}

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  setUserActive,
  deleteUser,
};
