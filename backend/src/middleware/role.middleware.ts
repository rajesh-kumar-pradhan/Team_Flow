import { Response, NextFunction } from "express";
import pool from "../db/database.js";
import {
  AuthenticatedRequest
} from "./auth.middleware.js";
import { Role } from "../types/role.js";

export const requireRole = (...allowedRoles: Role[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      const organizationId = req.params.organizationId;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          message: "Organization ID is required"
        });
      }

      const result = await pool.query(
        `SELECT role
         FROM organization_members
         WHERE organization_id = $1
         AND user_id = $2`,
        [organizationId, req.user.userId]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this organization"
        });
      }

      const userRole = result.rows[0].role as Role;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to perform this action"
        });
      }

      next();
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };
};