const ExcelJS = require("exceljs");
const { APS } = require("../../constants/aps");

/**
 * Crea plantilla .xlsx para importar dispositivos.
 * - Incluye encabezados exactos
 * - Incluye 1 fila de ejemplo
 * - Incluye validaciones (listas) para AP, Tipo, Área
 *
 * @param {string} fixedApName Si viene ?ap=Bonanza 1, deja el AP fijo en el ejemplo
 */
async function buildDevicesTemplateWorkbook(fixedApName = "") {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Bonanza (EXPAUSA.SA)";
  wb.created = new Date();

  const ws = wb.addWorksheet("Plantilla Import", {
    views: [{ state: "frozen", ySplit: 1 }]
  });

  // ✅ Columnas que tu importer debe leer
  // (si ya tienes importer, alinea los headers con esto)
  ws.columns = [
    { header: "AP", key: "apName", width: 18 },
    { header: "DUEÑO", key: "ownerName", width: 26 },
    { header: "MAC", key: "mac", width: 20 },
    { header: "TIPO", key: "deviceType", width: 12 },
    { header: "ÁREA", key: "area", width: 14 },
    { header: "PUNTO", key: "locationPoint", width: 26 },

    // opcionales
    { header: "MARCA", key: "brand", width: 16 },
    { header: "MODELO", key: "model", width: 18 },
    { header: "SERIAL", key: "serial", width: 18 },
    { header: "HOSTNAME", key: "hostname", width: 18 },
    { header: "NOTAS", key: "notes", width: 30 }
  ];

  // Header style
  const header = ws.getRow(1);
  header.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  header.alignment = { vertical: "middle", horizontal: "center" };
  header.height = 20;

  header.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF102A43" }
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    };
  });

  // Fila ejemplo
  ws.addRow({
    apName: fixedApName && APS.includes(fixedApName) ? fixedApName : "Bonanza 1",
    ownerName: "Ej: Juan Pérez",
    mac: "AA:BB:CC:DD:EE:FF",
    deviceType: "LAPTOP",
    area: "CONTROL",
    locationPoint: "Ej: Oficina Control / Garita 1",
    brand: "Dell",
    model: "Latitude 5420",
    serial: "SN123456",
    hostname: "PC-CONTROL-01",
    notes: "Registro de ejemplo"
  });

  // Hoja de ayuda con listas (para validación)
  const help = wb.addWorksheet("Listas", { state: "veryHidden" });

  help.getCell("A1").value = "APS";
  APS.forEach((ap, i) => (help.getCell(`A${i + 2}`).value = ap));

  help.getCell("B1").value = "TIPOS";
  ["MOVIL", "LAPTOP", "PC"].forEach((t, i) => (help.getCell(`B${i + 2}`).value = t));

  help.getCell("C1").value = "AREAS";
  ["CONTROL", "SEGURIDAD", "MONITOREO"].forEach((a, i) => (help.getCell(`C${i + 2}`).value = a));

  // Data validation (listas desplegables)
  // Rango para validar: filas 2..5000 (amplio)
  const maxRow = 5000;

  // AP
  ws.dataValidations.add(`A2:A${maxRow}`, {
    type: "list",
    allowBlank: false,
    formulae: [`=Listas!$A$2:$A$${APS.length + 1}`],
    showErrorMessage: true,
    errorStyle: "error",
    errorTitle: "AP inválido",
    error: "Selecciona un AP válido de la lista."
  });

  // Tipo
  ws.dataValidations.add(`D2:D${maxRow}`, {
    type: "list",
    allowBlank: false,
    formulae: [`=Listas!$B$2:$B$4`],
    showErrorMessage: true,
    errorTitle: "Tipo inválido",
    error: "Selecciona MOVIL, LAPTOP o PC."
  });

  // Área
  ws.dataValidations.add(`E2:E${maxRow}`, {
    type: "list",
    allowBlank: false,
    formulae: [`=Listas!$C$2:$C$4`],
    showErrorMessage: true,
    errorTitle: "Área inválida",
    error: "Selecciona CONTROL, SEGURIDAD o MONITOREO."
  });

  // Notas en columnas obligatorias
  ws.getCell("A1").note = "Obligatorio. Debe coincidir con los APs oficiales.";
  ws.getCell("B1").note = "Obligatorio. Nombre del dueño del dispositivo.";
  ws.getCell("C1").note = "Obligatorio. Formato recomendado AA:BB:CC:DD:EE:FF.";
  ws.getCell("D1").note = "Obligatorio. MOVIL/LAPTOP/PC.";
  ws.getCell("E1").note = "Obligatorio. CONTROL/SEGURIDAD/MONITOREO.";
  ws.getCell("F1").note = "Obligatorio. Punto o ubicación específica.";

  // Autofiltro
  ws.autoFilter = { from: "A1", to: "K1" };

  return wb;
}

module.exports = { buildDevicesTemplateWorkbook };
