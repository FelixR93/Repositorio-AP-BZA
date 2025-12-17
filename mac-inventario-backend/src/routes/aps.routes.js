// Lista de APs (logueado) para llenar combos en el frontend.

const router = require("express").Router();
const { auth } = require("../middleware/auth.middleware");
const { listAps } = require("../controllers/aps.controller");

router.use(auth);
router.get("/", listAps);

module.exports = router;
