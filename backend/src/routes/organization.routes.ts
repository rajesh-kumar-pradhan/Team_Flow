import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { create } from "../controllers/organization.controller.js";

const router = Router();

router.post("/", authenticate, create);

export default router;