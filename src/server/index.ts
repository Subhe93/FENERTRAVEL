import express from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
// import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth";
import shipmentsRoutes from "./routes/shipments";
import usersRoutes from "./routes/users";
import branchesRoutes from "./routes/branches";
import countriesRoutes from "./routes/countries";
import statusRoutes from "./routes/status";
import logsRoutes from "./routes/logs";
import backupRoutes from "./routes/backup";

const app = express();
const PORT = process.env.API_PORT || 5030;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    createParentPath: true,
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB max
    },
  }) as unknown as express.RequestHandler
);

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/shipments", shipmentsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/branches", branchesRoutes);
app.use("/api/countries", countriesRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/backup", backupRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "Fener Travel API",
  });
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Server Error:", err);
    res.status(500).json({
      success: false,
      error: "خطأ في الخادم",
      timestamp: new Date().toISOString(),
    });
  }
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "المسار غير موجود",
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
