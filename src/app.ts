import express, { type Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

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

export { app };
