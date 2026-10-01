import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import {
  getMembers,
  add
} from "../controllers/organizationMember.controller.js";
import { ROLES } from "../types/role.js";

const router = Router();

router.get(
  "/:organizationId/members",
  authenticate,
  requireRole(
    ROLES.ADMIN,
    ROLES.PROJECT_MANAGER
  ),
  getMembers
);

router.post(
  "/:organizationId/members",
  authenticate,
  requireRole(ROLES.ADMIN),
  add
);

export default router;