import { NextFunction, Response } from "express";
import User from "../models/user.model";
import { AuthRequest } from "./auth.middleware";

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const user = await User.findByPk(req.userId, {
      attributes: ["id", "role", "isVerified"],
    });

    if (!user || !user.isVerified) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    if (user.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Forbidden: admin role required",
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to verify admin permission",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};
