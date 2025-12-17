const Device = require("../models/Device");
const AuditLog = require("../models/AuditLog");
const { APS } = require("../constants/aps");

async function getDashboardStats(_req, res) {
  const total = await Device.countDocuments();

  const byApAgg = await Device.aggregate([
    { $group: { _id: "$apName", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // completar con APs sin registros
  const byAp = APS.map(ap => {
    const found = byApAgg.find(x => x._id === ap);
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

  const recent = await AuditLog.find({})
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return res.json({ total, byAp, byType, byArea, recent });
}

module.exports = { getDashboardStats };
