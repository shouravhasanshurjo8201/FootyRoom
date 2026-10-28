import { Router } from "express";
import {
    createProduct,
    getAllProducts,
    searchProducts,
    filterProducts
} from "../controllers/product.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/").get(getAllProducts);
router.route("/").post(verifyJWT, upload.single("avatar"), createProduct);
router.route("/search").get(searchProducts);
router.route("/filter").get(filterProducts);

export default router;