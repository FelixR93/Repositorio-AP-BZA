const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, enum: ["CREATE", "UPDATE", "DELETE", "IMPORT"], required: true },
    entity: { type: String, enum: ["DEVICE", "USER"], default: "DEVICE" },

    // Referencia del objeto afectado (si aplica)
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },

    // Detalle
    message: { type: String, default: "" },

    // Quién lo hizo
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    role: { type: String, default: "" },

    // Meta
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },

    // Contexto (útil para filtros)
    apName: { type: String, default: "" },
    mac: { type: String, default: "" },

    // Cambios (para UPDATE)
    before: { type: Object, default: null },
    after: { type: Object, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
