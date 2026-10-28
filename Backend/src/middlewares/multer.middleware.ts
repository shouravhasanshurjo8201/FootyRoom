import multer from "multer";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { ApiError } from "../utils/ApiError.js";

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const destination = path.join(tmpdir(), "backend-pactice-1-uploads");
        void mkdir(destination, { recursive: true, mode: 0o700 }).then(
            () => cb(null, destination),
            (error: Error) => cb(error, destination)
        );
    },
    filename: (_req, file, cb) => {
        const extensionByMimeType: Record<string, string> = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "image/gif": ".gif",
        };
        cb(null, `${randomUUID()}${extensionByMimeType[file.mimetype] ?? ""}`);
    }
});

export const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
    },
    fileFilter: (_req, file, callback) => {
        const allowedMimeTypes = new Set([
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
        ]);
        if (!allowedMimeTypes.has(file.mimetype)) {
            callback(new ApiError(400, "Only JPEG, PNG, WebP, or GIF images are allowed"));
            return;
        }
        callback(null, true);
    },
});