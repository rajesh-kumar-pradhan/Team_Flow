import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import {
  getMembers,
  add,
  changeRole,
  remove
} from "../controllers/organizationMember.controller.js";
import { ROLES } from "../types/role.js";

const router = Router();

/*
 * View organization members
 *
 * ADMIN + PROJECT_MANAGER
 */
router.get(
  "/:organizationId/members",
  authenticate,
  requireRole(
    ROLES.ADMIN,
    ROLES.PROJECT_MANAGER
  ),
  getMembers
);

/*
 * Add a member
 *
 * ADMIN only
 */
router.post(
  "/:organizationId/members",
  authenticate,
  requireRole(ROLES.ADMIN),
  add
);

/*
 * Change member role
 *
 * ADMIN only
 */
router.patch(
  "/:organizationId/members/:userId/role",
  authenticate,
  requireRole(ROLES.ADMIN),
  changeRole
);

/*
 * Remove member
 *
 * ADMIN only
 */
router.delete(
  "/:organizationId/members/:userId",
  authenticate,
  requireRole(ROLES.ADMIN),
  remove
);

export default router;