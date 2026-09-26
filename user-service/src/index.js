const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");
const { initRedis } = require("./config/redis");
const { globalErrorHandler } = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const internalRoutes = require("./routes/internalRoutes");
const { initSocket } = require("./socket");

const app = express();
const server = http.createServer(app);

// Initialize WebSockets
initSocket(server);

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// 🛡️ API Rate Limiting for Scale & Security
const rateLimit = require("express-rate-limit");

// Global Rate Limiter: Max 500 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 500,
  message: { success: false, message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter Rate Limiter for Authentication routes
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Max 10 attempts per minute
  message: { success: false, message: "Too many authentication attempts." }
});

// Apply global limiter to all /api routes
app.use("/api", globalLimiter);
app.use("/api/auth", authLimiter);

// Static media file serving with aggressive Cloudflare CDN Edge Cache headers
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    maxAge: "365d",
    immutable: true,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
  })
);

// Root Landing Route
app.get("/", (req, res) => {
  res.status(200).json({
    service: "Creator Contest User Microservice API",
    status: "ONLINE",
    healthCheck: "/health",
    timestamp: new Date().toISOString()
  });
});

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "HEALTHY",
    service: "user-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/internal", internalRoutes);

// Global Error Handler
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5001;

// Startup Function
const startServer = async () => {
  await connectDB();
  await initRedis();

  server.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 [User Service] running on http://localhost:${PORT}`);
    console.log(`==================================================`);
  });
};

startServer();

module.exports = { app, server };
