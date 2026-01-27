export interface User {
  id: number;
  name: string;
  email: string;
  isVerified?: boolean;
  role?: "USER" | "ADMIN";
  createdAt?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  resetToken?: string;
  email?: string;
  code?: string;
  user?: User;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
  purpose: "REGISTER" | "RESET_PASSWORD";
}

export interface ResendOTPRequest {
  email: string;
  purpose: "REGISTER" | "RESET_PASSWORD";
}

export interface ForgetPasswordRequest {
  email: string;
}

export interface ForgetPasswordResponse {
  success: boolean;
  message: string;
  email?: string;
}

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
}
