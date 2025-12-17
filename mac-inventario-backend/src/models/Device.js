const mongoose = require("mongoose");
const { APS } = require("../constants/aps");

const deviceSchema = new mongoose.Schema(
  {
    apName: { type: String, enum: APS, required: true },
    ownerName: { type: String, required: true, trim: true },
    mac: { type: String, required: true, unique: true, index: true },

    deviceType: {
      type: String,
      enum: ["MOVIL", "LAPTOP", "PC"],
      required: true
    },

    brand: { type: String, default: "" },
    model: { type: String, default: "" },
    serial: { type: String, default: "" },
    hostname: { type: String, default: "" },

    area: {
      type: String,
      enum: ["CONTROL", "SEGURIDAD", "MONITOREO"],
      required: true
    },

    locationPoint: { type: String, required: true, trim: true },
    notes: { type: String, default: "" },

    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // ⚠️ YA NO required → para datos antiguos
    registeredByName: {
      type: String,
      default: "N/D"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Device", deviceSchema);
