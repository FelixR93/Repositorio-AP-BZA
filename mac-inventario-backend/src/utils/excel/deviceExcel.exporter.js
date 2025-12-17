const ExcelJS = require("exceljs");

/**
 * Construye un workbook Excel con el inventario de dispositivos.
 * @param {Array} items - lista de Devices (puede venir con populate registeredBy o con registeredByName)
 */
async function buildDevicesWorkbook(items) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Bonanza (EXPAUSA.SA)";
  wb.created = new Date();

  const ws = wb.addWorksheet("Inventario MAC", {
    views: [{ state: "frozen", ySplit: 1 }]
  });

  // Columnas PRO
  ws.columns = [
    { header: "AP", key: "apName", width: 16 },
    { header: "DUEÑO", key: "ownerName", width: 24 },
    { header: "MAC", key: "mac", width: 18 },
    { header: "TIPO", key: "deviceType", width: 12 },
    { header: "ÁREA", key: "area", width: 14 },
    { header: "PUNTO", key: "locationPoint", width: 22 },
    { header: "REGISTRADO POR", key: "registeredByName", width: 22 },
    { header: "FECHA REGISTRO", key: "createdAt", width: 20 },
    { header: "ÚLTIMA ACT.", key: "updatedAt", width: 20 },

    // Opcionales
    { header: "MARCA", key: "brand", width: 16 },
    { header: "MODELO", key: "model", width: 18 },
    { header: "SERIAL", key: "serial", width: 18 },
    { header: "HOSTNAME", key: "hostname", width: 18 },
    { header: "NOTAS", key: "notes", width: 28 }
  ];

  // Estilo header
  const header = ws.getRow(1);
  header.font = { bold: true, size: 12 };
  header.alignment = { vertical: "middle", horizontal: "center" };
  header.height = 20;

  header.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF102A43" } // azul oscuro
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    };
  });

  // Helpers
  const fmtDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "";
    // dd/MM/yyyy HH:mm
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  };

  // Filas
  for (const d of items) {
    ws.addRow({
      apName: d.apName || "",
      ownerName: d.ownerName || "",
      mac: d.mac || "",
      deviceType: d.deviceType || "",
      area: d.area || "",
      locationPoint: d.locationPoint || "",
      registeredByName:
        d.registeredByName ||
        d.registeredBy?.fullName ||
        d.registeredBy?.username ||
        "",
      createdAt: fmtDate(d.createdAt),
      updatedAt: fmtDate(d.updatedAt),
      brand: d.brand || "",
      model: d.model || "",
      serial: d.serial || "",
      hostname: d.hostname || "",
      notes: d.notes || ""
    });
  }

  // Bordes y alineación general
  ws.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FF1E2A3A" } },
        left: { style: "thin", color: { argb: "FF1E2A3A" } },
        bottom: { style: "thin", color: { argb: "FF1E2A3A" } },
        right: { style: "thin", color: { argb: "FF1E2A3A" } }
      };
      cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    });

    // zebra
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF0F1826" }
        };
      });
    }
  });

  // Autofiltro
  ws.autoFilter = {
    from: "A1",
    to: "N1"
  };

  return wb;
}

module.exports = { buildDevicesWorkbook };
