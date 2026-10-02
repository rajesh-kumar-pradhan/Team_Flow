import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  addMember,
  changeMemberRole,
  removeMember
} from "../services/organizationMember.service.js";
import { Role } from "../types/role.js";
import pool from "../db/database.js";

const validRoles: Role[] = [
  "ADMIN",
  "PROJECT_MANAGER",
  "DEVELOPER",
  "MEMBER"
];

interface OrganizationParams {
  organizationId: string;
}

interface MemberParams {
  organizationId: string;
  userId: string;
}

type AuthenticatedRequestWithOrganizationParams =
  AuthenticatedRequest & Request<OrganizationParams>;

type AuthenticatedRequestWithMemberParams =
  AuthenticatedRequest & Request<MemberParams>;

export const getMembers = async (
  req: AuthenticatedRequestWithOrganizationParams,
  res: Response
) => {
  try {
    const { organizationId } = req.params;

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
  req: AuthenticatedRequestWithOrganizationParams,
  res: Response
) => {
  try {
    const { organizationId } = req.params;
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: "Email and role are required"
      });
    }

    if (typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email must be a string"
      });
    }

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

export const changeRole = async (
  req: AuthenticatedRequestWithMemberParams,
  res: Response
) => {
  try {
    const { organizationId, userId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required"
      });
    }

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role"
      });
    }

    if (req.user?.userId === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role"
      });
    }

    const updatedMember = await changeMemberRole({
      organizationId,
      userId,
      newRole: role
    });

    return res.status(200).json({
      success: true,
      message: "Member role updated successfully",
      data: updatedMember
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "MEMBER_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Organization member not found"
      });
    }

    if (
      error instanceof Error &&
      error.message === "SAME_ROLE"
    ) {
      return res.status(400).json({
        success: false,
        message: "Member already has this role"
      });
    }

    if (
      error instanceof Error &&
      error.message === "LAST_ADMIN"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot remove the last ADMIN from the organization"
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const remove = async (
  req: AuthenticatedRequestWithMemberParams,
  res: Response
) => {
  try {
    const { organizationId, userId } = req.params;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const removedMember = await removeMember({
      organizationId,
      userId,
      requesterId: req.user.userId
    });

    return res.status(200).json({
      success: true,
      message: "Member removed successfully",
      data: removedMember
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "CANNOT_REMOVE_SELF"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot remove yourself from the organization"
      });
    }

    if (
      error instanceof Error &&
      error.message === "MEMBER_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message: "Organization member not found"
      });
    }

    if (
      error instanceof Error &&
      error.message === "LAST_ADMIN"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot remove the last ADMIN from the organization"
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};