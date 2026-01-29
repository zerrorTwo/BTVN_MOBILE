// Profile DTOs - Data Transfer Objects for Profile API
// These interfaces define the structure for request/response data

/**
 * Response for profile data
 */
export interface ProfileResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    isVerified: boolean;
    role: "USER" | "ADMIN";
    createdAt: Date;
    updatedAt: Date;
  };
}

/**
 * Request for updating basic profile info (name, avatar)
 */
export interface UpdateProfileRequest {
  name?: string;
  avatar?: string; // Base64 encoded image or URL
}

/**
 * Request for changing password
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Request for changing phone number - Step 1: Request OTP
 */
export interface RequestPhoneOTPRequest {
  newPhone: string;
}

/**
 * Request for changing phone number - Step 2: Verify OTP
 */
export interface ChangePhoneRequest {
  newPhone: string;
  otp: string;
}

/**
 * Request for changing email - Step 1: Request OTP
 */
export interface RequestEmailOTPRequest {
  newEmail: string;
}

/**
 * Request for changing email - Step 2: Verify OTP
 */
export interface ChangeEmailRequest {
  newEmail: string;
  otp: string;
}

/**
 * Generic API Response
 */
export interface ApiResponse {
  success: boolean;
  message: string;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
}

/**
 * OTP Purpose types
 */
export type OTPPurpose =
  | "REGISTER"
  | "RESET_PASSWORD"
  | "CHANGE_EMAIL"
  | "CHANGE_PHONE";
