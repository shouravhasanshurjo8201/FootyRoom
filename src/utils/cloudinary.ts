import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import fs from "node:fs/promises";

const uploadOnCloudinary = async (localFilePath: string): Promise<UploadApiResponse> => {
    try {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            throw new Error(
                "Cloudinary environment variables are missing"
            );
        }

        cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
        });

        return await cloudinary.uploader.upload(localFilePath, {
            resource_type: "image",
        });
    } catch (error: unknown) {
        console.error("Cloudinary upload failed:", error);
        throw error;
    } finally {
        try {
            await fs.rm(localFilePath, { force: true });
        } catch (cleanupError) {
            console.error("Failed to remove temporary upload:", cleanupError);
        }
    }
};

export { uploadOnCloudinary };
