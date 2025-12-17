const router = require("express").Router();
const { auth } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/role.middleware");

const {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  setUserActive,
  deleteUser
} = require("../controllers/users.controller");

// 🔒 Solo ADMIN
router.use(auth, requireRole("ADMIN"));

router.get("/", listUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.patch("/:id/active", setUserActive);
router.delete("/:id", deleteUser);

module.exports = router;
