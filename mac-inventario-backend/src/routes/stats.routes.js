const router = require("express").Router();
const { auth } = require("../middleware/auth.middleware");
const { getDashboardStats } = require("../controllers/stats.controller");

router.use(auth);
router.get("/dashboard", getDashboardStats);

module.exports = router;
