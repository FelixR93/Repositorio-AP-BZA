// Middleware de error centralizado para respuestas consistentes.

function errorHandler(err, req, res, next) {
  // Si el error viene de multer o validaciones propias
  const message = err?.message || "Error interno del servidor";

  // Log técnico (para desarrollo)
  console.error("❌ ERROR:", message);

  // Respuesta
  res.status(500).json({ message });
}

module.exports = { errorHandler };
