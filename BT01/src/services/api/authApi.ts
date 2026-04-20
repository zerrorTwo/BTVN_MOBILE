import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../../config";
import type { RootState } from "../../store";
import type {
  AuthResponse,
  ForgetPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResendOTPRequest,
  ResetPasswordRequest,
  VerifyOTPRequest,
} from "../../types";

// Custom baseQuery with logging
const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithLogging = async (args: any, api: any, extraOptions: any) => {
  const timestamp = new Date().toISOString();
  const endpoint = typeof args === "string" ? args : args.url;
  const fullURL = `${API_BASE_URL}${endpoint}`;

  if (typeof args === "object" && args.body) {
    const sanitizedBody = { ...args.body };
    if (sanitizedBody.password) sanitizedBody.password = "***HIDDEN***";
    if (sanitizedBody.newPassword) sanitizedBody.newPassword = "***HIDDEN***";
  }

  const startTime = Date.now();
  const result = await rawBaseQuery(args, api, extraOptions);
  const duration = Date.now() - startTime;

  // if (result.data) {
  //   console.log(`Response:`, JSON.stringify(result.data, null, 2));
  // }

  // if (result.error) {
  //   console.log(`❌ Error:`, JSON.stringify(result.error, null, 2));
  // }

  // console.log("=".repeat(80) + "\n");

  return result;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithLogging,
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (credentials) => ({
        url: "/api/v1/auth/register",
        method: "POST",
        body: credentials,
      }),
    }),
    verifyOTP: builder.mutation<AuthResponse, VerifyOTPRequest>({
      query: (data) => ({
        url: "/api/v1/auth/verify-otp",
        method: "POST",
        body: data,
      }),
    }),
    resendOTP: builder.mutation<AuthResponse, ResendOTPRequest>({
      query: (data) => ({
        url: "/api/v1/auth/resend-otp",
        method: "POST",
        body: data,
      }),
    }),
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/api/v1/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
    forgetPassword: builder.mutation<AuthResponse, ForgetPasswordRequest>({
      query: (data) => ({
        url: "/api/v1/auth/forget-password",
        method: "POST",
        body: data,
      }),
    }),
    resetPassword: builder.mutation<AuthResponse, ResetPasswordRequest>({
      query: (data) => ({
        url: "/api/v1/auth/reset-password",
        method: "POST",
        body: data,
      }),
    }),
    getCurrentUser: builder.query<AuthResponse, void>({
      query: () => "/api/v1/auth/me",
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
