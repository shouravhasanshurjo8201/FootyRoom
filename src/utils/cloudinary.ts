import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs/promises";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath: string) => {
    if (!localFilePath) {
        return null;
    }

    try {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            throw new Error(
                "Cloudinary environment variables are missing"
            );
        }

        const response = await cloudinary.uploader.upload(
            localFilePath,
            {
                resource_type: "auto",
            }
        );

        await fs.unlink(localFilePath).catch((error: NodeJS.ErrnoException) => {
            console.error(
                "Cloudinary upload successful, but local file cleanup failed:",
                error.message
            );
        });

        return response;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Cloudinary upload failed:", error.message);
        } else {
            console.error("Cloudinary upload failed:", error);
        }

        return null;
    }
};

export { uploadOnCloudinary };
