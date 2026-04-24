import { Request, Response } from "express";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import User from "../models/user.model";
import { IAuthResponse } from "../types";
import {
  generateAccessToken,
  generateRefreshToken,
  generateToken,
  verifyRefreshToken,
} from "../utils/jwt";
import {
  generateOTP,
  getOTPExpiry,
  isOTPExpired,
  isValidOTPFormat,
} from "../utils/otp";
import emailService from "../services/email.service";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
      return;
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      if (existingUser.isVerified) {
        res.status(400).json({
          success: false,
          message: "User with this email already exists and is verified",
        });
        return;
      }

      // If not verified, allow "re-registration" (update name/password and send new OTP)
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Prevent rapid OTP generation: reuse OTP if generated < 5 mins ago
      const canReuseOTP = existingUser.otp && 
                         existingUser.updatedAt && 
                         (Date.now() - new Date(existingUser.updatedAt).getTime() < 300000);
      
      const otp = canReuseOTP ? existingUser.otp! : generateOTP();
      const otpExpiry = getOTPExpiry();

      console.log(`[DEBUG] Register (Re-reg): email=${email}, newOtp=${otp}, reused=${canReuseOTP}`);

      await existingUser.update({
        name,
        password: hashedPassword,
        otp,
        otpExpiry,
        otpPurpose: "REGISTER",
      });

      await emailService.sendRegistrationOTP(email, otp, name);

      res.status(200).json({
        success: true,
        message: canReuseOTP 
          ? "Account exists. Please use the OTP sent to your email." 
          : "Account exists but not verified. A new OTP has been sent.",
        email: email,
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      otp,
      otpExpiry,
      otpPurpose: "REGISTER",
      role: req.body.role || "USER",
    });

    await emailService.sendRegistrationOTP(email, otp, name);

    const response: IAuthResponse = {
      success: true,
      message: "Registration successful. Please check your email for OTP code.",
      email: user.email,
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
      return;
    }

    const { email, otp, purpose } = req.body;

    if (!isValidOTPFormat(otp)) {
      res.status(400).json({
        success: false,
        message: "Invalid OTP format. OTP must be 6 digits.",
      });
      return;
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Handle idempotency: If already verified for REGISTER, return success.
    // This prevents errors if the client sends double requests.
    if (user.isVerified && purpose === "REGISTER") {
      const token = generateToken(user.id);
      res.status(200).json({
        success: true,
        message: "Account already verified",
        token,
        data: { token },
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified,
          role: user.role,
        },
      });
      return;
    }

    const isOtpMatch = String(user.otp).trim() === String(otp).trim();
    const isPurposeMatch = String(user.otpPurpose).trim() === String(purpose).trim();

    console.log(`[DEBUG] Verify OTP: email=${email}, inputOtp=${otp}, dbOtp=${user.otp}, purpose=${purpose}, dbPurpose=${user.otpPurpose}`);
    console.log(`[DEBUG] Match Result: OTP=${isOtpMatch}, Purpose=${isPurposeMatch}`);

    if (!isOtpMatch || !isPurposeMatch) {
      res.status(400).json({
        success: false,
        message: "Invalid OTP code",
      });
      return;
    }

    if (!user.otpExpiry || isOTPExpired(user.otpExpiry)) {
      res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
      return;
    }

    if (purpose === "REGISTER") {
      user.isVerified = true;
      user.otp = null;
      user.otpExpiry = null;
      user.otpPurpose = null;
      await user.save();

      const token = generateToken(user.id);

      const response: IAuthResponse = {
        success: true,
        message: "Account verified successfully",
        token,
        data: { token },
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified,
          role: user.role,
        },
      };

      console.log(`[DEBUG] Verify OTP SUCCESS: email=${email}, userId=${user.id}`);
      res.status(200).json(response);
    } else if (purpose === "RESET_PASSWORD") {
      const resetToken = generateToken(user.id, "15m");

      user.otp = null;
      user.otpExpiry = null;
      await user.save();

      const response: IAuthResponse = {
        success: true,
        message: "OTP verified. You can now reset your password.",
        resetToken,
      };

      res.status(200).json(response);
    }
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during OTP verification",
    });
  }
};

export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
      return;
    }

    const { email, purpose } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (purpose === "REGISTER" && user.isVerified) {
      res.status(400).json({
        success: false,
        message: "Account is already verified. Please login.",
      });
      return;
    }

    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    console.log(`[DEBUG] Resend OTP: email=${email}, newOtp=${otp}, purpose=${purpose}`);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.otpPurpose = purpose;
    await user.save();

    if (purpose === "REGISTER") {
      await emailService.sendRegistrationOTP(email, otp, user.name);
    } else {
      await emailService.sendPasswordResetOTP(email, otp, user.name);
    }

    const response: IAuthResponse = {
      success: true,
      message: "New OTP code has been sent to your email",
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while resending OTP",
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
      return;
    }

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    if (!user.isVerified) {
      // Automatically send a new OTP if user tries to login but is not verified
      // Prevent rapid OTP generation: reuse OTP if generated < 5 mins ago
      const canReuseOTP = user.otp && 
                         user.updatedAt && 
                         (Date.now() - new Date(user.updatedAt).getTime() < 300000);

      const otp = canReuseOTP ? user.otp! : generateOTP();
      const otpExpiry = getOTPExpiry();

      console.log(`[DEBUG] Login (Unverified): email=${email}, newOtp=${otp}, reused=${canReuseOTP}`);

      user.otp = otp;
      user.otpExpiry = otpExpiry;
      user.otpPurpose = "REGISTER";
      await user.save();

      await emailService.sendRegistrationOTP(user.email, otp, user.name);

      res.status(401).json({
        success: false,
        message: canReuseOTP
          ? "Tài khoản chưa được xác thực. Vui lòng sử dụng mã OTP đã được gửi đến email của bạn."
          : "Tài khoản chưa được xác thực. Một mã OTP mới đã được gửi đến email của bạn.",
        code: "ACCOUNT_NOT_VERIFIED",
        email: user.email,
      });
      return;
    }

    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    const response: IAuthResponse = {
      success: true,
      message: "Login successful",
      token,
      refreshToken,
      data: { token, refreshToken },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role,
      },
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

export const forgetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
      return;
    }

    const { email } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, an OTP code has been sent.",
      });
      return;
    }

    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.otpPurpose = "RESET_PASSWORD";
    await user.save();

    await emailService.sendPasswordResetOTP(email, otp, user.name);

    const response: IAuthResponse = {
      success: true,
      message: "OTP code has been sent to your email for password reset",
      email: user.email,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error("Forget password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password reset request",
    });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
      return;
    }

    const { newPassword } = req.body;

    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired reset token",
      });
      return;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Kiểm tra mật khẩu mới có trùng với mật khẩu cũ không
    const isSameAsOldPassword = await bcrypt.compare(
      newPassword,
      user.password,
    );
    if (isSameAsOldPassword) {
      res.status(400).json({
        success: false,
        message: "Mật khẩu mới không được trùng với mật khẩu cũ",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.otp = null;
    user.otpExpiry = null;
    user.otpPurpose = null;
    await user.save();

    const response: IAuthResponse = {
      success: true,
      message:
        "Password reset successfully. You can now login with your new password.",
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password reset",
    });
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).userId;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password", "otp", "otpExpiry", "otpPurpose"] },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const response: IAuthResponse = {
      success: true,
      message: "User data retrieved successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        role: user.role,
        createdAt: user.createdAt,
      },
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
      return;
    }

    const decoded = verifyRefreshToken(refreshToken);
    const token = generateAccessToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      token,
      refreshToken: newRefreshToken,
      data: {
        token,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error?.message || "Invalid or expired refresh token",
    });
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};
