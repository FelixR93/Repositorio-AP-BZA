const fs = require("fs");
const mongoose = require("mongoose");
const Device = require("../models/Device");
const { APS } = require("../constants/aps");
const { normalizeMac, isValidMac } = require("../utils/mac");
const { buildDevicesWorkbook } = require("../utils/excel/deviceExcel.exporter");
const { parseDevicesExcel } = require("../utils/excel/deviceExcel.importer");
const { writeAudit } = require("../services/audit.service");
const { buildDevicesTemplateWorkbook } = require("../utils/excel/deviceExcel.template");

// ---------------------------
// CREATE
// ---------------------------
async function createDevice(req, res) {
  const {
    apName,
    ownerName,
    mac,
    deviceType,
    area,
    locationPoint,
    brand,
    model,
    serial,
    hostname,
    notes,
  } = req.body;

  if (!apName || !APS.includes(apName)) return res.status(400).json({ message: "AP inválido." });
  if (!ownerName) return res.status(400).json({ message: "ownerName es requerido." });
  if (!locationPoint) return res.status(400).json({ message: "locationPoint es requerido." });

  const macNorm = normalizeMac(mac);
  if (!isValidMac(macNorm))
    return res.status(400).json({ message: "MAC inválida. Ej: AA:BB:CC:DD:EE:FF" });

  const existing = await Device.findOne({ mac: macNorm }).lean();
  if (existing) {
    return res.status(409).json({
      message: `La MAC ya se encuentra en el sistema en el AP: ${existing.apName}, punto: ${existing.locationPoint}`,
      existing: {
        id: existing._id,
        apName: existing.apName,
        locationPoint: existing.locationPoint,
        ownerName: existing.ownerName,
      },
    });
  }

  const device = await Device.create({
    apName,
    ownerName,
    mac: macNorm,
    deviceType,
    area,
    locationPoint,
    brand: brand || "",
    model: model || "",
    serial: serial || "",
    hostname: hostname || "",
    notes: notes || "",
    registeredBy: req.user.sub,
    registeredByName: req.user.fullName || req.user.username,
  });

  await writeAudit(req, {
    action: "CREATE",
    entity: "DEVICE",
    entityId: device._id,
    apName: device.apName,
    mac: device.mac,
    message: `Creó dispositivo ${device.mac} en ${device.apName} (${device.locationPoint})`,
    after: {
      apName: device.apName,
      ownerName: device.ownerName,
      mac: device.mac,
      deviceType: device.deviceType,
      area: device.area,
      locationPoint: device.locationPoint,
    },
  });

  return res.status(201).json(device);
}

// ---------------------------
// LIST (GLOBAL + por AP + búsqueda)
// ---------------------------
async function listDevices(req, res) {
  const filter = {}; // ✅ TODOS ven todo

  const ap = req.query.ap ? String(req.query.ap) : "";
  if (ap) filter.apName = ap;

  const q = req.query.q ? String(req.query.q).trim() : "";
  if (q) {
    // MAC tolerante: quita separadores
    const macQ = q.replace(/[-:.]/g, "");
    filter.$or = [
      { mac: new RegExp(macQ, "i") },
      { ownerName: new RegExp(q, "i") },
      { locationPoint: new RegExp(q, "i") },
      { registeredByName: new RegExp(q, "i") },
    ];
  }

  const items = await Device.find(filter).sort({ createdAt: -1 }).lean();
  return res.json(items);
}

// ---------------------------
// GET BY ID (evita 500 si ID inválido)
// ---------------------------
async function getDeviceById(req, res) {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID inválido." });
    }

    const item = await Device.findById(id).lean();
    if (!item) return res.status(404).json({ message: "No encontrado." });

    return res.json(item);
  } catch (error) {
    console.error("❌ getDeviceById:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
}

// ---------------------------
// EXPORT EXCEL PRO
// ---------------------------
async function exportDevicesExcel(req, res) {
  const filter = {};

  const ap = req.query.ap ? String(req.query.ap) : "";
  if (ap) filter.apName = ap;

  const items = await Device.find(filter)
    .populate("registeredBy", "fullName username")
    .sort({ createdAt: -1 });

  const wb = await buildDevicesWorkbook(items);

  const apSafe = ap ? ap.replace(/\s+/g, "_") : "TODOS";
  const fileName = `Inventario_MAC_${apSafe}_${Date.now()}.xlsx`;

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  await wb.xlsx.write(res);
  res.end();
}

// ---------------------------
// TEMPLATE EXCEL REAL
// ---------------------------
async function downloadDevicesTemplate(req, res) {
  const ap = req.query.ap ? String(req.query.ap) : "";
  const wb = await buildDevicesTemplateWorkbook(ap);

  const apSafe = ap ? ap.replace(/\s+/g, "_") : "GENERAL";
  const fileName = `Plantilla_Import_MAC_${apSafe}.xlsx`;

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  await wb.xlsx.write(res);
  res.end();
}

// ---------------------------
// IMPORT EXCEL + AUDIT
// ---------------------------
async function importDevicesExcel(req, res) {
  if (!req.file?.path) return res.status(400).json({ message: "Archivo .xlsx requerido." });

  const fallbackApName = req.query.ap ? String(req.query.ap) : "";
  const { rows, errors } = await parseDevicesExcel(req.file.path, fallbackApName);

  const inserted = [];
  const duplicates = [];
  const failed = [...errors];

  for (const r of rows) {
    try {
      const exists = await Device.findOne({ mac: r.mac }).lean();
      if (exists) {
        duplicates.push({
          mac: r.mac,
          message: `Duplicado: ya existe en AP: ${exists.apName}, punto: ${exists.locationPoint}`,
          existing: {
            apName: exists.apName,
            locationPoint: exists.locationPoint,
            ownerName: exists.ownerName,
          },
        });
        continue;
      }

      const created = await Device.create({
        ...r,
        registeredBy: req.user.sub,
        registeredByName: req.user.fullName || req.user.username,
      });

      inserted.push({ id: created._id, mac: created.mac, apName: created.apName });
    } catch (e) {
      failed.push({ row: r, errors: [e?.message || "Error insertando fila"] });
    }
  }

  try { fs.unlinkSync(req.file.path); } catch {}

  // ✅ AUDIT IMPORT
  await writeAudit(req, {
    action: "IMPORT",
    entity: "DEVICE",
    entityId: null,
    apName: fallbackApName || "",
    message: `Importó Excel. Insertadas: ${inserted.length}, Duplicadas: ${duplicates.length}, Fallidas: ${failed.length}`,
    after: {
      summary: { inserted: inserted.length, duplicates: duplicates.length, failed: failed.length }
    },
  });

  return res.json({
    summary: {
      totalRows: rows.length + errors.length,
      parsedValid: rows.length,
      inserted: inserted.length,
      duplicates: duplicates.length,
      failed: failed.length,
    },
    inserted,
    duplicates,
    failed,
  });
}

// ---------------------------
// UPDATE + AUDIT
// ---------------------------
async function updateDevice(req, res) {
  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID inválido." });
  }

  const existing = await Device.findById(id);
  if (!existing) return res.status(404).json({ message: "No encontrado." });

  const before = {
    apName: existing.apName,
    ownerName: existing.ownerName,
    mac: existing.mac,
    deviceType: existing.deviceType,
    area: existing.area,
    locationPoint: existing.locationPoint,
    brand: existing.brand,
    model: existing.model,
    serial: existing.serial,
    hostname: existing.hostname,
    notes: existing.notes,
  };

  const {
    apName,
    ownerName,
    mac,
    deviceType,
    area,
    locationPoint,
    brand,
    model,
    serial,
    hostname,
    notes,
  } = req.body;

  if (!apName || !APS.includes(apName)) return res.status(400).json({ message: "AP inválido." });
  if (!ownerName) return res.status(400).json({ message: "ownerName es requerido." });
  if (!locationPoint) return res.status(400).json({ message: "locationPoint es requerido." });

  const macNorm = normalizeMac(mac);
  if (!isValidMac(macNorm))
    return res.status(400).json({ message: "MAC inválida. Ej: AA:BB:CC:DD:EE:FF" });

  if (macNorm !== existing.mac) {
    const dup = await Device.findOne({ mac: macNorm }).lean();
    if (dup) {
      return res.status(409).json({
        message: `La MAC ya se encuentra en el sistema en el AP: ${dup.apName}, punto: ${dup.locationPoint}`,
        existing: {
          id: dup._id,
          apName: dup.apName,
          locationPoint: dup.locationPoint,
          ownerName: dup.ownerName,
        },
      });
    }
  }

  existing.apName = apName;
  existing.ownerName = ownerName;
  existing.mac = macNorm;
  existing.deviceType = deviceType;
  existing.area = area;
  existing.locationPoint = locationPoint;
  existing.brand = brand || "";
  existing.model = model || "";
  existing.serial = serial || "";
  existing.hostname = hostname || "";
  existing.notes = notes || "";

  await existing.save();

  const after = {
    apName: existing.apName,
    ownerName: existing.ownerName,
    mac: existing.mac,
    deviceType: existing.deviceType,
    area: existing.area,
    locationPoint: existing.locationPoint,
    brand: existing.brand,
    model: existing.model,
    serial: existing.serial,
    hostname: existing.hostname,
    notes: existing.notes,
  };

  await writeAudit(req, {
    action: "UPDATE",
    entity: "DEVICE",
    entityId: existing._id,
    apName: existing.apName,
    mac: existing.mac,
    message: `Actualizó dispositivo ${existing.mac} (${existing.apName})`,
    before,
    after,
  });

  return res.json(existing);
}

// ---------------------------
// DELETE + AUDIT
// ---------------------------
async function deleteDevice(req, res) {
  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID inválido." });
  }

  const existing = await Device.findById(id);
  if (!existing) return res.status(404).json({ message: "No encontrado." });

  const snapshot = {
    apName: existing.apName,
    ownerName: existing.ownerName,
    mac: existing.mac,
    deviceType: existing.deviceType,
    area: existing.area,
    locationPoint: existing.locationPoint,
  };

  await Device.findByIdAndDelete(id);

  await writeAudit(req, {
    action: "DELETE",
    entity: "DEVICE",
    entityId: existing._id,
    apName: existing.apName,
    mac: existing.mac,
    message: `Eliminó dispositivo ${existing.mac} (${existing.apName})`,
    before: snapshot,
  });

  return res.json({ message: "✅ Registro eliminado correctamente." });
}

module.exports = {
  createDevice,
  listDevices,
  getDeviceById,
  exportDevicesExcel,
  downloadDevicesTemplate,
  importDevicesExcel,
  updateDevice,
  deleteDevice,
};
