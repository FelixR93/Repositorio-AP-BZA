// Verifica si el usuario tiene uno de los roles permitidos.

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.role) return res.status(403).json({ message: "Acceso denegado (sin rol)." });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Acceso denegado." });
    next();
  };
}

module.exports = { requireRole };
