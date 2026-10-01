import { Response } from "express";
import {
  AuthenticatedRequest
} from "../middleware/auth.middleware.js";
import {
  createOrganization
} from "../services/organization.service.js";

export const create = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const { name } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Organization name is required"
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Organization name must be at least 2 characters"
      });
    }

    const organization = await createOrganization({
      name,
      userId: req.user.userId
    });

    return res.status(201).json({
      success: true,
      message: "Organization created successfully",
      data: organization
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};