import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "..";
import type {
  AuthResponse,
  ForgetPasswordResponse,
  LoginRequest,
  RegisterRequest,
  ForgetPasswordRequest,
  ResetPasswordRequest,
  VerifyOTPRequest,
  ResendOTPRequest,
  User,
} from "../../types";

// Use 10.0.2.2 for Android emulator, localhost for iOS/web
// Change to your computer's IP if testing on physical device (e.g., 192.168.1.68)
const API_BASE_URL = "http://10.0.2.2:5000";

// Custom baseQuery with logging
const baseQueryWithLogging = async (args: any, api: any, extraOptions: any) => {
  const timestamp = new Date().toISOString();
  const endpoint = typeof args === "string" ? args : args.url;
  const fullURL = `${API_BASE_URL}${endpoint}`;

  console.log("\n" + "=".repeat(80));
  console.log(`📤 API REQUEST [${timestamp}]`);
  console.log("=".repeat(80));
  console.log(`Full URL: ${fullURL}`);
  console.log(`Base URL: ${API_BASE_URL}`);
  console.log(`Endpoint: ${endpoint}`);
  console.log(
    `Method: ${typeof args === "string" ? "GET" : args.method || "GET"}`,
  );

  if (typeof args === "object" && args.body) {
    const sanitizedBody = { ...args.body };
    if (sanitizedBody.password) sanitizedBody.password = "***HIDDEN***";
    if (sanitizedBody.newPassword) sanitizedBody.newPassword = "***HIDDEN***";
    console.log(`Body:`, JSON.stringify(sanitizedBody, null, 2));
  }

  const startTime = Date.now();
  const result = await fetchBaseQuery({ baseUrl: API_BASE_URL })(
    args,
    api,
    extraOptions,
  );
  const duration = Date.now() - startTime;

  console.log("\n" + "-".repeat(80));
  console.log(`📥 API RESPONSE`);
  console.log("-".repeat(80));
  console.log(`Status: ${result.meta?.response?.status || "N/A"}`);
  console.log(`Duration: ${duration}ms`);

  if (result.data) {
    console.log(`Response:`, JSON.stringify(result.data, null, 2));
  }

  if (result.error) {
    console.log(`❌ Error:`, JSON.stringify(result.error, null, 2));
  }

  console.log("=".repeat(80) + "\n");

  return result;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithLogging,
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (credentials) => ({
        url: "/api/auth/register",
        method: "POST",
        body: credentials,
      }),
    }),
    verifyOTP: builder.mutation<AuthResponse, VerifyOTPRequest>({
      query: (data) => ({
        url: "/api/auth/verify-otp",
        method: "POST",
        body: data,
      }),
    }),
    resendOTP: builder.mutation<AuthResponse, ResendOTPRequest>({
      query: (data) => ({
        url: "/api/auth/resend-otp",
        method: "POST",
        body: data,
      }),
    }),
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/api/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
    forgetPassword: builder.mutation<AuthResponse, ForgetPasswordRequest>({
      query: (data) => ({
        url: "/api/auth/forget-password",
        method: "POST",
        body: data,
      }),
    }),
    resetPassword: builder.mutation<AuthResponse, ResetPasswordRequest>({
      query: (data) => ({
        url: "/api/auth/reset-password",
        method: "POST",
        body: data,
      }),
    }),
    getCurrentUser: builder.query<AuthResponse, void>({
      query: () => "/api/auth/me",
    }),
  }),
});

export const {
  useRegisterMutation,
  useVerifyOTPMutation,
  useResendOTPMutation,
  useLoginMutation,
  useForgetPasswordMutation,
  useResetPasswordMutation,
  useGetCurrentUserQuery,
} = authApi;
