import dotenv from "dotenv";

dotenv.config({
    path: "./.env",
});

const startServer = async () => {
    try {
        const { default: connectDB } = await import("./db/index.js");
        const { app } = await import("./app.js");

        await connectDB();

        const port = Number(process.env.PORT) || 8000;

        app.listen(port, () => {
            console.log(`⚙️ Server is running at port : ${port}`);
        });
    } catch (error: unknown) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
};

startServer();
