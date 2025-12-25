const router = require("express").Router();
const { auth } = require("../middleware/auth.middleware");
const { getDashboardStats, getLogsPaged } = require("../controllers/stats.controller");

// todo stats requiere token
router.use(auth);

// dashboard (resumen)
router.get("/dashboard", getDashboardStats);

// ✅ NUEVO: bitácora completa paginada + filtros
// GET /api/stats/logs?page=1&limit=20&q=...&action=CREATE
router.get("/logs", getLogsPaged);

module.exports = router;
