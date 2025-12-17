const ExcelJS = require("exceljs");
const { APS } = require("../../constants/aps");
const { normalizeMac, isValidMac } = require("../mac");

const COLS = {
  apName: ["ap", "access point"],
  ownerName: ["dueño", "owner", "usuario", "user"],
  mac: ["mac", "mac address"],
  deviceType: ["tipo", "device type"],
  area: ["area", "área"],
  locationPoint: ["punto", "ubicacion", "ubicación", "location"],
  brand: ["marca", "brand"],
  model: ["modelo", "model"],
  serial: ["serial", "serie"],
  hostname: ["hostname", "host"],
  notes: ["notas", "notes"]
};

// Normaliza texto de cabecera
function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Detecta columnas dinámicamente
function mapColumns(headerRow) {
  const map = {};

  headerRow.eachCell((cell, col) => {
    const name = norm(cell.value);

    for (const key of Object.keys(COLS)) {
      if (COLS[key].some((k) => name.includes(k))) {
        map[key] = col;
      }
    }
  });

  return map;
}

/**
 * Lee y valida un Excel de dispositivos
 * @param {string} filePath
 * @param {string} fallbackApName
 */
async function parseDevicesExcel(filePath, fallbackApName = "") {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);

  const ws = wb.worksheets[0];
  if (!ws) return { rows: [], errors: [{ errors: ["Excel vacío"] }] };

  const headerRow = ws.getRow(1);
  const colMap = mapColumns(headerRow);

  const required = ["ownerName", "mac", "deviceType", "area", "locationPoint"];
  const missing = required.filter((k) => !colMap[k]);

  if (!colMap.apName && !fallbackApName) missing.push("apName");

  if (missing.length) {
    return {
      rows: [],
      errors: [{ errors: [`Faltan columnas obligatorias: ${missing.join(", ")}`] }]
    };
  }

  const rows = [];
  const errors = [];

  ws.eachRow((row, idx) => {
    if (idx === 1) return; // header

    try {
      const apName = colMap.apName
        ? String(row.getCell(colMap.apName).value || "").trim()
        : fallbackApName;

      if (!apName || !APS.includes(apName)) {
        throw new Error("AP inválido o no permitido");
      }

      const macRaw = row.getCell(colMap.mac).value;
      const mac = normalizeMac(macRaw);

      if (!isValidMac(mac)) throw new Error("MAC inválida");

      const item = {
        apName,
        ownerName: String(row.getCell(colMap.ownerName).value || "").trim(),
        mac,
        deviceType: String(row.getCell(colMap.deviceType).value || "").toUpperCase(),
        area: String(row.getCell(colMap.area).value || "").toUpperCase(),
        locationPoint: String(row.getCell(colMap.locationPoint).value || "").trim(),

        brand: colMap.brand ? String(row.getCell(colMap.brand).value || "") : "",
        model: colMap.model ? String(row.getCell(colMap.model).value || "") : "",
        serial: colMap.serial ? String(row.getCell(colMap.serial).value || "") : "",
        hostname: colMap.hostname ? String(row.getCell(colMap.hostname).value || "") : "",
        notes: colMap.notes ? String(row.getCell(colMap.notes).value || "") : ""
      };

      rows.push(item);
    } catch (e) {
      errors.push({
        row: idx,
        errors: [e.message]
      });
    }
  });

  return { rows, errors };
}

module.exports = { parseDevicesExcel };
