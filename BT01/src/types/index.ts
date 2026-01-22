export interface User {
  id: number;
  name: string;
  email: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

export interface ForgetPasswordResponse {
  success: boolean;
  message: string;
  resetToken?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface ForgetPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    msg: string;
    param: string;
  }>;
}
