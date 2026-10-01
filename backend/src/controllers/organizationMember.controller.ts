import { Response } from "express";
import {
  AuthenticatedRequest
} from "../middleware/auth.middleware.js";
import pool from "../db/database.js";
import {
  addMember
} from "../services/organizationMember.service.js";
import { Role } from "../types/role.js";

export const getMembers = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const organizationId = req.params.organizationId;

    if (typeof organizationId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid organization ID"
      });
    }

    const result = await pool.query(
      `SELECT
         u.id,
         u.name,
         u.email,
         om.role,
         om.joined_at
       FROM organization_members om
       INNER JOIN users u
         ON u.id = om.user_id
       WHERE om.organization_id = $1
       ORDER BY om.joined_at ASC`,
      [organizationId]
    );

    return res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const add = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const organizationId = req.params.organizationId;

    if (typeof organizationId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid organization ID"
      });
    }

    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: "Email and role are required"
      });
    }

    const validRoles: Role[] = [
      "ADMIN",
      "PROJECT_MANAGER",
      "DEVELOPER",
      "MEMBER"
    ];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role"
      });
    }

    const result = await addMember({
      organizationId,
      email,
      role
    });

    return res.status(201).json({
      success: true,
      message: "Member added successfully",
      data: result
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "USER_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (
      error instanceof Error &&
      error.message === "ALREADY_MEMBER"
    ) {
      return res.status(409).json({
        success: false,
        message: "User is already a member"
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};