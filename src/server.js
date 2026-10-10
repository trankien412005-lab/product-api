require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./app");
const Product = require("./models/Product");

async function start() {
  const { PORT, MONGODB_URI } = process.env;
  const port = Number(PORT);

  if (
    !PORT ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !MONGODB_URI
  ) {
    throw new Error("Kiem tra PORT va MONGODB_URI trong .env");
  }

  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000
  });

  // Cho index unique cua pid san sang truoc khi nhan request.
  await Product.init();

  console.log("Da ket noi MongoDB");

  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`Product API dang chay tai http://localhost:${port}`);
  });

  server.on("error", (error) => {
    console.error("Loi khoi dong HTTP:", error.message);
    process.exit(1);
  });
}

start().catch((error) => {
  console.error("Khoi dong that bai:", error.message);
  process.exit(1);
});