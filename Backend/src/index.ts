import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({
  path: "./.env",
});

const instanceId = process.env.INSTANCE_ID ?? `backend-${process.pid}`;

const startServer = async () => {
  try {
    const { default: connectDB } = await import("./db/index.js");
    const { app } = await import("./app.js");
    const { closeRedis, connectRedis } = await import("./utils/redisCache.js");

    await connectDB();
    void connectRedis();

    const port = Number(process.env.PORT) || 8000;

    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`⚙️ [${instanceId}] Server is running at port: ${port}`);
    });

    const shutdown = async () => {
      console.log(`\n[${instanceId}] Gracefully shutting down...`);

      server.close(async (error) => {
        if (error) {
          console.error(`[${instanceId}] HTTP server shutdown error:`, error);
          process.exitCode = 1;
          return;
        }

        try {
          await Promise.all([closeRedis(), mongoose.disconnect()]);
          console.log(`[${instanceId}] Database and cache connections closed`);
        } catch (disconnectError) {
          console.error(
            `[${instanceId}] Connection shutdown failed:`,
            disconnectError,
          );
        }

        process.exit(0);
      });

      setTimeout(() => {
        console.error(`[${instanceId}] Forced shutdown after timeout`);
        process.exit(1);
      }, 10000);
    };

    process.on("SIGINT", () => {
      void shutdown();
    });

    process.on("SIGTERM", () => {
      void shutdown();
    });
  } catch (error: unknown) {
    console.error(`[${instanceId}] Server startup failed:`, error);
    process.exit(1);
  }
};

void startServer();
