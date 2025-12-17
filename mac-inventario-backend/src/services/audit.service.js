const AuditLog = require("../models/AuditLog");

async function writeAudit(req, payload) {
  // req.user viene del auth middleware
  const userId = req.user?.sub;
  const userName = req.user?.fullName || req.user?.username || "N/D";
  const role = req.user?.role || "";
  const ip = req.meta?.ip || "";
  const userAgent = req.meta?.userAgent || "";

  return AuditLog.create({
    ...payload,
    userId,
    userName,
    role,
    ip,
    userAgent
  });
}

module.exports = { writeAudit };
