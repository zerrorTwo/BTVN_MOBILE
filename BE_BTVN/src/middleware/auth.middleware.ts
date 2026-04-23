import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { User } from "../models";

export interface AuthRequest extends Request {
  userId?: number;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "No token provided. Please login.",
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    const decoded = verifyToken(token);

    (req as any).userId = decoded.userId;
    (req as any).user = { id: decoded.userId };

    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please login again.",
    });
  }
};

export const resetPasswordMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const { resetToken } = req.body;

    if (!resetToken) {
      res.status(401).json({
        success: false,
        message: "Reset token is required",
      });
      return;
    }

    const decoded = verifyToken(resetToken);

    (req as any).userId = decoded.userId;

    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired reset token",
    });
  }
};

export const authenticate = authMiddleware;

/**
 * Requires the caller to have role=ADMIN. Must be used AFTER `authenticate`.
 * Loads the user from DB to check role (JWT only carries userId).
 */
export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = (req as any).userId || (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Not authenticated" });
      return;
    }
    const user = await User.findByPk(userId);
    if (!user || user.role !== "ADMIN") {
      res.status(403).json({
        success: false,
        message: "Admin privilege required",
      });
      return;
    }
    (req as any).user = { id: user.id, role: user.role };
    next();
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to verify admin role" });
  }
};
