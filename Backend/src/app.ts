import express, { type Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRouter from "./routes/auth.routes.js";
import productRouter from "./routes/product.routes.js";
import brandRouter from "./routes/brand.routes.js";
import categoryRouter from "./routes/category.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { ApiError } from "./utils/ApiError.js";

const app: Application = express();
const instanceId = process.env.INSTANCE_ID ?? `backend-${process.pid}`;
const instancePort = Number(process.env.PORT ?? 8000);
const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  ...(process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
]);

const sendHealthResponse = (res: express.Response) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  const payload = {
    success: databaseConnected,
    message: databaseConnected ? "API is healthy" : "Database is unavailable",
    status: databaseConnected ? "OK" : "NOT_READY",
    timestamp: new Date().toISOString(),
    instance: {
      id: instanceId,
      pid: process.pid,
      port: instancePort,
      environment: process.env.NODE_ENV ?? "development",
    },
  };

  res.status(databaseConnected ? 200 : 503).json(payload);
};

app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[${instanceId}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.set("trust proxy", 1);

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running...",
    status: "OK",
    timestamp: new Date().toISOString(),
    instance: {
      id: instanceId,
      pid: process.pid,
      port: instancePort,
    },
  });
});

app.get("/health", (_req, res) => {
  sendHealthResponse(res);
});

app.get("/api/v1/health", (_req, res) => {
  sendHealthResponse(res);
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/brands", brandRouter);
app.use("/api/v1/categories", categoryRouter);
app.use((_req, _res, next) => {
  next(new ApiError(404, "Route not found"));
});

app.use(errorHandler);

export { app };
