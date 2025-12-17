// Crea un ADMIN inicial para entrar al sistema.
// Usuario: admin
// Pass: Admin123
// Cambia luego desde el sistema.

require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("./src/models/User");
const { ROLES } = require("./src/constants/roles");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const username = "admin";
  const exists = await User.findOne({ username }).lean();
  if (exists) {
    console.log("✅ ADMIN ya existe.");
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash("Admin123", 10);

  await User.create({
    fullName: "Administrador Bonanza",
    username,
    passwordHash,
    role: ROLES.ADMIN,
    isActive: true
  });

  console.log("✅ ADMIN creado: admin / Admin123");
  process.exit(0);
})();
