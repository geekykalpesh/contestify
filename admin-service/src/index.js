const express = require("express");
const cors = require("cors");
require("dotenv").config();

const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "HEALTHY",
    service: "admin-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Admin Routes
app.use("/api/admin", adminRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("[Admin Service Error]:", err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Admin Service internal error"
  });
});

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 [Admin Service] running on http://localhost:${PORT}`);
  console.log(`==================================================`);
});

module.exports = app;
