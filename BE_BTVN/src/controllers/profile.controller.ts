import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import User from "../models/user.model";
import {
  ProfileResponse,
  ApiResponse,
  UpdateProfileRequest,
  ChangePasswordRequest,
  RequestPhoneOTPRequest,
  ChangePhoneRequest,
  RequestEmailOTPRequest,
  ChangeEmailRequest,
} from "../types";
import { generateOTP, getOTPExpiry, isOTPExpired } from "../utils/otp";
import emailService from "../services/email.service";

/**
 * Sanitize user object for response (remove sensitive data)
 */
const sanitizeUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  avatar: user.avatar,
  isVerified: user.isVerified,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

/**
 * Handle validation errors from express-validator
 */
const handleValidationErrors = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: "path" in err ? err.path : undefined,
        message: err.msg,
      })),
    } as ApiResponse);
    return true;
  }
  return false;
};

/**
 * Get user from request (set by auth middleware)
 */
const getUserFromRequest = async (req: Request): Promise<User | null> => {
  const userId = (req as any).userId;
  if (!userId) return null;
  return await User.findByPk(userId);
};

/**
 * @route   GET /api/profile
 * @desc    Get current user's profile
 * @access  Private
 */
export const getProfile = async (
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      } as ProfileResponse);
      return;
    }

    res.status(200).json({
      success: true,
      message: "Lấy thông tin profile thành công",
      user: sanitizeUser(user),
    } as ProfileResponse);
  } catch (error: any) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin profile",
    } as ApiResponse);
  }
};

/**
 * @route   PUT /api/profile
 * @desc    Update user's basic profile (name, avatar)
 * @access  Private
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    if (handleValidationErrors(req, res)) return;

    const user = await getUserFromRequest(req);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      } as ApiResponse);
      return;
    }

    const { name, avatar }: UpdateProfileRequest = req.body;

    // Update fields if provided
    if (name !== undefined && name.trim() !== "") {
      user.name = name.trim();
    }

    if (avatar !== undefined) {
      // Validate avatar size (max 5MB for Base64)
      if (avatar && avatar.length > 5 * 1024 * 1024) {
        res.status(400).json({
          success: false,
          message: "Ảnh đại diện quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.",
        } as ApiResponse);
        return;
      }
      user.avatar = avatar;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin thành công",
      user: sanitizeUser(user),
    } as ProfileResponse);
  } catch (error: any) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật thông tin",
    } as ApiResponse);
  }
};

/**
 * @route   PUT /api/profile/password
 * @desc    Change user's password
 * @access  Private
 */
export const changePassword = async (
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    if (handleValidationErrors(req, res)) return;

    const user = await getUserFromRequest(req);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      } as ApiResponse);
      return;
    }

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    }: ChangePasswordRequest = req.body;

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      res.status(400).json({
        success: false,
        message: "Mật khẩu hiện tại không chính xác",
      } as ApiResponse);
      return;
    }

    // Check if new password matches confirm password
    if (newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: "Mật khẩu xác nhận không khớp",
      } as ApiResponse);
      return;
    }

    // Check if new password is different from current
    if (currentPassword === newPassword) {
      res.status(400).json({
        success: false,
        message: "Mật khẩu mới phải khác mật khẩu hiện tại",
      } as ApiResponse);
      return;
    }

    // Hash and save new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Đổi mật khẩu thành công",
    } as ApiResponse);
  } catch (error: any) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi đổi mật khẩu",
    } as ApiResponse);
  }
};

/**
 * @route   POST /api/profile/phone/otp
 * @desc    Request OTP for changing phone number
 * @access  Private
 */
export const requestPhoneChangeOTP = async (
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    if (handleValidationErrors(req, res)) return;

    const user = await getUserFromRequest(req);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      } as ApiResponse);
      return;
    }

    const { newPhone }: RequestPhoneOTPRequest = req.body;

    // Check if phone is already used by another user
    const existingUser = await User.findOne({
      where: { phone: newPhone },
    });
    if (existingUser && existingUser.id !== user.id) {
      res.status(400).json({
        success: false,
        message: "Số điện thoại này đã được sử dụng bởi tài khoản khác",
      } as ApiResponse);
      return;
    }

    // Generate and save OTP
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = getOTPExpiry();
    user.otpPurpose = "CHANGE_PHONE";
    user.pendingPhone = newPhone;
    await user.save();

    // Send OTP via email (since we don't have SMS service)
    await emailService.sendProfileChangeOTP(
      user.email,
      otp,
      user.name,
      "phone",
      newPhone,
    );

    res.status(200).json({
      success: true,
      message: "Mã OTP đã được gửi đến email của bạn",
    } as ApiResponse);
  } catch (error: any) {
    console.error("Request phone OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi gửi mã OTP",
    } as ApiResponse);
  }
};

/**
 * @route   PUT /api/profile/phone
 * @desc    Change phone number with OTP verification
 * @access  Private
 */
export const changePhone = async (
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    if (handleValidationErrors(req, res)) return;

    const user = await getUserFromRequest(req);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      } as ApiResponse);
      return;
    }

    const { newPhone, otp }: ChangePhoneRequest = req.body;

    // Verify OTP purpose and pending phone
    if (user.otpPurpose !== "CHANGE_PHONE" || user.pendingPhone !== newPhone) {
      res.status(400).json({
        success: false,
        message: "Yêu cầu không hợp lệ. Vui lòng yêu cầu mã OTP mới.",
      } as ApiResponse);
      return;
    }

    // Verify OTP
    if (user.otp !== otp) {
      res.status(400).json({
        success: false,
        message: "Mã OTP không chính xác",
      } as ApiResponse);
      return;
    }

    // Check OTP expiry
    if (!user.otpExpiry || isOTPExpired(user.otpExpiry)) {
      res.status(400).json({
        success: false,
        message: "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.",
      } as ApiResponse);
      return;
    }

    // Update phone number
    user.phone = newPhone;
    user.otp = null;
    user.otpExpiry = null;
    user.otpPurpose = null;
    user.pendingPhone = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật số điện thoại thành công",
      user: sanitizeUser(user),
    } as ProfileResponse);
  } catch (error: any) {
    console.error("Change phone error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật số điện thoại",
    } as ApiResponse);
  }
};

/**
 * @route   POST /api/profile/email/otp
 * @desc    Request OTP for changing email
 * @access  Private
 */
export const requestEmailChangeOTP = async (
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    if (handleValidationErrors(req, res)) return;

    const user = await getUserFromRequest(req);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      } as ApiResponse);
      return;
    }

    const { newEmail }: RequestEmailOTPRequest = req.body;

    // Check if email is already used
    const existingUser = await User.findOne({
      where: { email: newEmail },
    });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "Email này đã được sử dụng bởi tài khoản khác",
      } as ApiResponse);
      return;
    }

    // Generate and save OTP
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = getOTPExpiry();
    user.otpPurpose = "CHANGE_EMAIL";
    user.pendingEmail = newEmail;
    await user.save();

    // Send OTP to NEW email address
    await emailService.sendProfileChangeOTP(
      newEmail,
      otp,
      user.name,
      "email",
      newEmail,
    );

    res.status(200).json({
      success: true,
      message: "Mã OTP đã được gửi đến email mới của bạn",
    } as ApiResponse);
  } catch (error: any) {
    console.error("Request email OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi gửi mã OTP",
    } as ApiResponse);
  }
};

/**
 * @route   PUT /api/profile/email
 * @desc    Change email with OTP verification
 * @access  Private
 */
export const changeEmail = async (
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    if (handleValidationErrors(req, res)) return;

    const user = await getUserFromRequest(req);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      } as ApiResponse);
      return;
    }

    const { newEmail, otp }: ChangeEmailRequest = req.body;

    // Verify OTP purpose and pending email
    if (user.otpPurpose !== "CHANGE_EMAIL" || user.pendingEmail !== newEmail) {
      res.status(400).json({
        success: false,
        message: "Yêu cầu không hợp lệ. Vui lòng yêu cầu mã OTP mới.",
      } as ApiResponse);
      return;
    }

    // Verify OTP
    if (user.otp !== otp) {
      res.status(400).json({
        success: false,
        message: "Mã OTP không chính xác",
      } as ApiResponse);
      return;
    }

    // Check OTP expiry
    if (!user.otpExpiry || isOTPExpired(user.otpExpiry)) {
      res.status(400).json({
        success: false,
        message: "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.",
      } as ApiResponse);
      return;
    }

    // Update email
    user.email = newEmail;
    user.otp = null;
    user.otpExpiry = null;
    user.otpPurpose = null;
    user.pendingEmail = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật email thành công",
      user: sanitizeUser(user),
    } as ProfileResponse);
  } catch (error: any) {
    console.error("Change email error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật email",
    } as ApiResponse);
  }
};
