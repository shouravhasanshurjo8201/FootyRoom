import { Router } from "express";
import { createCategory, getAllCategories } from "../controllers/category.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").get(getAllCategories);
router.route("/").post(verifyJWT, createCategory);

export default router;