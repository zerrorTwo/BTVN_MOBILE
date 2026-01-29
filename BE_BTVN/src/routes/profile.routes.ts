import { Router } from "express";
import { body } from "express-validator";
import {
  getProfile,
  updateProfile,
  changePassword,
  requestPhoneChangeOTP,
  changePhone,
  requestEmailChangeOTP,
  changeEmail,
} from "../controllers/profile.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// ============================================================================
// Validation Rules
// ============================================================================

const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Họ tên phải từ 2 đến 100 ký tự"),
  body("avatar")
    .optional()
    .isString()
    .withMessage("Avatar phải là chuỗi (Base64 hoặc URL)"),
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Vui lòng nhập mật khẩu hiện tại"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu mới phải có ít nhất 6 ký tự"),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Vui lòng xác nhận mật khẩu mới"),
];

const requestPhoneOTPValidation = [
  body("newPhone")
    .notEmpty()
    .withMessage("Vui lòng nhập số điện thoại mới")
    .matches(/^[0-9]{10,11}$/)
    .withMessage("Số điện thoại không hợp lệ (phải có 10-11 chữ số)"),
];

const changePhoneValidation = [
  body("newPhone")
    .notEmpty()
    .withMessage("Vui lòng nhập số điện thoại mới")
    .matches(/^[0-9]{10,11}$/)
    .withMessage("Số điện thoại không hợp lệ"),
  body("otp")
    .isLength({ min: 6, max: 6 })
    .withMessage("Mã OTP phải có 6 chữ số"),
];

const requestEmailOTPValidation = [
  body("newEmail").isEmail().withMessage("Email không hợp lệ").normalizeEmail(),
];

const changeEmailValidation = [
  body("newEmail").isEmail().withMessage("Email không hợp lệ").normalizeEmail(),
  body("otp")
    .isLength({ min: 6, max: 6 })
    .withMessage("Mã OTP phải có 6 chữ số"),
];

// ============================================================================
// Routes - All routes require authentication
// ============================================================================

// Get current user's profile
router.get("/", authMiddleware, getProfile);

// Update basic profile info (name, avatar)
router.put("/", authMiddleware, updateProfileValidation, updateProfile);

// Change password
router.put(
  "/password",
  authMiddleware,
  changePasswordValidation,
  changePassword,
);

// Request OTP for phone change
router.post(
  "/phone/otp",
  authMiddleware,
  requestPhoneOTPValidation,
  requestPhoneChangeOTP,
);

// Change phone with OTP verification
router.put("/phone", authMiddleware, changePhoneValidation, changePhone);

// Request OTP for email change
router.post(
  "/email/otp",
  authMiddleware,
  requestEmailOTPValidation,
  requestEmailChangeOTP,
);

// Change email with OTP verification
router.put("/email", authMiddleware, changeEmailValidation, changeEmail);

export default router;
