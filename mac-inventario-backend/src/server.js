// Punto de arranque: conecta DB y levanta servidor.

const app = require("./app");
const { connectDB } = require("./config/db");
const { ENV } = require("./config/env");

(async () => {
  try {
    await connectDB(ENV.MONGO_URI);
    app.listen(ENV.PORT, () => console.log(`✅ API corriendo en http://localhost:${ENV.PORT}`));
  } catch (err) {
    console.error("❌ No se pudo iniciar el servidor:", err);
    process.exit(1);
  }
})();
