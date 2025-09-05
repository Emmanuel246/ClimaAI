import { Router } from "express";
import {
  signup,
  login,
  refreshToken,
  logout,
} from "../controllers/auth.controller.js";
import { validate } from "../utils/validation.js";
import { signupSchema, loginSchema } from "../utils/validation.js";

const router = Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

export default router;
