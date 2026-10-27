import { Router } from "express";
import { googleAuth, refreshAccessToken, logoutUser, getCurrentUser } from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/google").post(googleAuth);
router.route("/refresh").post(refreshAccessToken);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/me").get(verifyJWT, getCurrentUser);

export default router;