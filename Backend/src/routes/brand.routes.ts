import { Router } from "express";
import { createBrand, getAllBrands } from "../controllers/brand.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").get(getAllBrands);
router.route("/").post(verifyJWT, createBrand);

export default router;