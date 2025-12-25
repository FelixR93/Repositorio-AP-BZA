const Device = require("../models/Device");
const AuditLog = require("../models/AuditLog");
const { APS } = require("../constants/aps");

// helper: escape regex
function escapeRegex(str = "") {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ✅ Dashboard (mejorado: try/catch, y recent limitado)
async function getDashboardStats(_req, res) {
  try {
    const total = await Device.countDocuments();

    const byApAgg = await Device.aggregate([
      { $group: { _id: "$apName", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // completar con APs sin registros
    const byAp = APS.map((ap) => {
      const found = byApAgg.find((x) => x._id === ap);
      return { apName: ap, count: found ? found.count : 0 };
    });

    const byType = await Device.aggregate([
      { $group: { _id: "$deviceType", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const byArea = await Device.aggregate([
      { $group: { _id: "$area", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // ✅ solo “recent” para dashboard (no infinito)
    const recent = await AuditLog.find({})
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();

    return res.json({ total, byAp, byType, byArea, recent });
  } catch (err) {
    console.error("getDashboardStats error:", err);
    return res.status(500).json({ message: "Error al cargar el dashboard" });
  }
}

/**
 * ✅ Bitácora completa paginada
 * GET /api/stats/logs?page=1&limit=20&q=...&action=CREATE
 */
async function getLogsPaged(req, res) {
  try {
    // ✅ (OPCIONAL) si quieres SOLO ADMIN:
    // if (req.user?.role !== "ADMIN") {
    //   return res.status(403).json({ message: "Solo administradores" });
    // }

    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limitRaw = parseInt(req.query.limit || "20", 10);
    const limit = Math.min(Math.max(limitRaw, 5), 100);

    const q = String(req.query.q || "").trim();
    const action = String(req.query.action || "ALL").trim().toUpperCase();

    const filter = {};

    if (action && action !== "ALL") {
      filter.action = action;
    }

    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { message: rx },
        { userName: rx },
        { role: rx },
        { ip: rx },
        { apName: rx },
        { mac: rx }
      ];
    }

    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      AuditLog.countDocuments(filter),
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.json({
      page,
      limit,
      total,
      totalPages,
      items
    });
  } catch (err) {
    console.error("getLogsPaged error:", err);
    return res.status(500).json({ message: "Error al cargar la bitácora" });
  }
}

module.exports = { getDashboardStats, getLogsPaged };
