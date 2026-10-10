const express = require("express");
const Product = require("./models/Product");
const mongoose = require("mongoose");

const app = express();

app.use(express.json({ limit: "100kb" }));
// Kiem tra API va ket noi MongoDB.
app.get("/health", async (req, res) => {
  res.set("Cache-Control", "no-store");

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      status: "unhealthy",
      database: "disconnected"
    });
  }

  try {
    await mongoose.connection.db.admin().command(
      { ping: 1 },
      { timeoutMS: 2000 }
    );

    return res.status(200).json({
      status: "healthy",
      database: "connected"
    });
  } catch {
    return res.status(503).json({
      status: "unhealthy",
      database: "unavailable"
    });
  }
});

// Kiem tra du lieu cho thao tac them va sua.
function validateProduct(req, res, next) {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      message: "Du lieu phai la mot JSON object"
    });
  }

  const { pid, pname, price, quantity } = body;

  if (typeof pid !== "string" || !pid.trim()) {
    return res.status(400).json({
      message: "pid phai la chuoi khong rong"
    });
  }

  if (typeof pname !== "string" || !pname.trim()) {
    return res.status(400).json({
      message: "pname phai la chuoi khong rong"
    });
  }

  if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
    return res.status(400).json({
      message: "price phai la so khong am"
    });
  }

  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    return res.status(400).json({
      message: "quantity phai la so nguyen khong am"
    });
  }

  // Chi lay dung bon truong duoc phep.
  req.productData = {
    pid: pid.trim(),
    pname: pname.trim(),
    price,
    quantity
  };

  next();
}

// Trang kiem tra API.
app.get("/", (req, res) => {
  res.json({ message: "Product API dang chay" });
});

// CREATE: Them san pham.
app.post("/api/products", validateProduct, async (req, res) => {
  const product = await Product.create(req.productData);
  res.status(201).json(product);
});

// READ: Xem danh sach san pham.
app.get("/api/products", async (req, res) => {
  const products = await Product.find().sort({ pid: 1 });
  res.json(products);
});

// READ: Xem mot san pham theo pid.
app.get("/api/products/:pid", async (req, res) => {
  const product = await Product.findOne({ pid: req.params.pid });

  if (!product) {
    return res.status(404).json({
      message: "Khong tim thay san pham"
    });
  }

  res.json(product);
});

// UPDATE: Cap nhat day du thong tin; giu nguyen ma pid.
app.put("/api/products/:pid", validateProduct, async (req, res) => {
  if (req.productData.pid !== req.params.pid) {
    return res.status(400).json({
      message: "pid trong body phai trung pid tren URL"
    });
  }

  const product = await Product.findOneAndUpdate(
    { pid: req.params.pid },
    { $set: req.productData },
    { new: true, runValidators: true }
  );

  if (!product) {
    return res.status(404).json({
      message: "Khong tim thay san pham"
    });
  }

  res.json(product);
});

// DELETE: Xoa san pham.
app.delete("/api/products/:pid", async (req, res) => {
  const product = await Product.findOneAndDelete({
    pid: req.params.pid
  });

  if (!product) {
    return res.status(404).json({
      message: "Khong tim thay san pham"
    });
  }

  res.status(204).send();
});

// URL khong ton tai.
app.use((req, res) => {
  res.status(404).json({ message: "Duong dan khong ton tai" });
});

// Xu ly loi tap trung.
app.use((err, req, res, next) => {
  if (err.code === 11000) {
    return res.status(409).json({
      message: "Ma san pham pid da ton tai"
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      message: "JSON khong dung cu phap"
    });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      message: "Du lieu gui len qua lon"
    });
  }

  console.error(err.message);
  res.status(500).json({ message: "Loi may chu" });
});

module.exports = app;