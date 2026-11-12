import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { closeRedis, connectRedis } from "./utils/redisCache.js";

dotenv.config({ path: "./.env" });

const instanceId = process.env.INSTANCE_ID ?? `backend-${process.pid}`;

// Vercel পরিবেশে সরাসরি কানেকশন শুরু করবে
if (process.env.VERCEL) {
  connectDB().catch((err) => console.error("MongoDB connection failed:", err));
  void connectRedis();
} else {
  // লোকাল বা Docker পরিবেশে আগের মতো সার্ভার চলবে
  const startServer = async () => {
    try {
      await connectDB();
      void connectRedis();
      const port = Number(process.env.PORT) || 8000;

      const server = app.listen(port, "0.0.0.0", () => {
        console.log(`⚙️ [${instanceId}] Server is running at port: ${port}`);
      });

      const shutdown = async () => {
        server.close(async () => {
          await Promise.all([closeRedis(), mongoose.disconnect()]);
          process.exit(0);
        });
      };

      process.on("SIGINT", () => void shutdown());
      process.on("SIGTERM", () => void shutdown());
    } catch (error) {
      console.error(`[${instanceId}] Server startup failed:`, error);
      process.exit(1);
    }
  };

  void startServer();
}

export default app;
