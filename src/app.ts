import express, { type Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from './routes/auth.routes.js';
import productRouter from './routes/product.routes.js';
import brandRouter from './routes/brand.routes.js';
import categoryRouter from './routes/category.routes.js';

const app: Application = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN || "*",
        credentials: true,
    })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Root route 
app.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running...",
        status: "OK",
        timestamp: new Date().toISOString(),
    });
});

// API health check
app.get("/api/v1/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "API is healthy",
        status: "OK",
        timestamp: new Date().toISOString(),
    });
});

// Auth API Route
app.use("/api/v1/auth", authRouter);

// Products API Route
app.use("/api/v1/products", productRouter);

// Products API Route
app.use("/api/v1/brands", brandRouter);

// Products API Route
app.use("/api/v1/categories", categoryRouter);

export { app };
