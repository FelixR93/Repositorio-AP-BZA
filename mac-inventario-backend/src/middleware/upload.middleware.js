// Configuración Multer para subir archivos Excel.
// Guarda en storage/uploads

const path = require("path");
const multer = require("multer");
const fs = require("fs");

const uploadDir = path.join(process.cwd(), "storage", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `import_${Date.now()}${ext || ".xlsx"}`);
  }
});

function fileFilter(_, file, cb) {
  const ok = (file.originalname || "").toLowerCase().endsWith(".xlsx");
  if (!ok) return cb(new Error("Solo se permite archivos .xlsx"));
  cb(null, true);
}

const uploadExcel = multer({ storage, fileFilter });

module.exports = { uploadExcel };
