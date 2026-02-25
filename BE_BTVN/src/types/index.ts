export interface IUser {
  id?: number;
  name: string;
  email: string;
  password?: string;
  phone?: string | null;
  avatar?: string | null;
  isVerified?: boolean;
  pendingEmail?: string | null;
  pendingPhone?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export * from "./profile.dto";

export * from "./product.dto";

export * from "./cart.dto";

export * from "./order.dto";

export { OrderStatus, PaymentMethod } from "../models/order.model";

export interface IRegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IAuthResponse {
  success: boolean;
  message: string;
  token?: string;
  resetToken?: string;
  email?: string;
  code?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    isVerified?: boolean;
    role?: "USER" | "ADMIN";
    createdAt?: Date;
  };
  errors?: any[];
}

export interface IOTPRequest {
  email: string;
  otp: string;
  purpose: "REGISTER" | "RESET_PASSWORD" | "CHANGE_EMAIL" | "CHANGE_PHONE";
}

export interface IResendOTPRequest {
  email: string;
  purpose: "REGISTER" | "RESET_PASSWORD";
}

export interface IResetPasswordRequest {
  resetToken: string;
  newPassword: string;
}
