// Dispositivos + Export/Import Excel + Plantilla

const router = require("express").Router();
const { auth } = require("../middleware/auth.middleware");
const { uploadExcel } = require("../middleware/upload.middleware");

const {
  createDevice,
  listDevices,
  getDeviceById,
  exportDevicesExcel,
  downloadDevicesTemplate,
  importDevicesExcel,
  updateDevice,
  deleteDevice
} = require("../controllers/devices.controller");

router.use(auth);

// ✅ Listado / búsqueda
router.get("/", listDevices);

// ✅ Exportar Excel
router.get("/export", exportDevicesExcel);

// ✅ Descargar plantilla Excel
router.get("/template", downloadDevicesTemplate);

// ✅ Importar Excel (multipart/form-data "file")
router.post("/import", uploadExcel.single("file"), importDevicesExcel);

// ✅ Crear
router.post("/", createDevice);

// ✅ Obtener por ID
router.get("/:id", getDeviceById);

// ✅ Editar
router.put("/:id", updateDevice);

// ✅ Eliminar
router.delete("/:id", deleteDevice);

module.exports = router;
