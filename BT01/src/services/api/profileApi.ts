import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../store";

// ============================================================================
// Types / DTOs
// ============================================================================

export interface ProfileUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  isVerified: boolean;
  role: "USER" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  user?: ProfileUser;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  errors?: Array<{ field?: string; message: string }>;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RequestPhoneOTPRequest {
  newPhone: string;
}

export interface ChangePhoneRequest {
  newPhone: string;
  otp: string;
}

export interface RequestEmailOTPRequest {
  newEmail: string;
}

export interface ChangeEmailRequest {
  newEmail: string;
  otp: string;
}

// ============================================================================
// API Configuration
// ============================================================================

// Use 10.0.2.2 for Android emulator, localhost for iOS/web
const API_BASE_URL = "http://10.0.2.2:5000";

// Custom baseQuery with auth token
const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// BaseQuery with logging
const baseQueryWithLogging = async (args: any, api: any, extraOptions: any) => {
  const timestamp = new Date().toISOString();
  const endpoint = typeof args === "string" ? args : args.url;
  const fullURL = `${API_BASE_URL}${endpoint}`;

  console.log("\n" + "=".repeat(80));
  console.log(`📤 PROFILE API REQUEST [${timestamp}]`);
  console.log("=".repeat(80));
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Full URL: ${fullURL}`);

  const startTime = Date.now();
  const result = await baseQueryWithAuth(args, api, extraOptions);
  const duration = Date.now() - startTime;

  console.log("-".repeat(80));
  console.log(`📥 PROFILE API RESPONSE`);
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

// ============================================================================
// Profile API
// ============================================================================

export const profileApi = createApi({
  reducerPath: "profileApi",
  baseQuery: baseQueryWithLogging,
  tagTypes: ["Profile"],
  endpoints: (builder) => ({
    // Get current user profile
    getProfile: builder.query<ProfileResponse, void>({
      query: () => "/api/profile",
      providesTags: ["Profile"],
    }),

    // Update profile (name, avatar)
    updateProfile: builder.mutation<ProfileResponse, UpdateProfileRequest>({
      query: (data) => ({
        url: "/api/profile",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Profile"],
    }),

    // Change password
    changePassword: builder.mutation<ApiResponse, ChangePasswordRequest>({
      query: (data) => ({
        url: "/api/profile/password",
        method: "PUT",
        body: data,
      }),
    }),

    // Request OTP for phone change
    requestPhoneOTP: builder.mutation<ApiResponse, RequestPhoneOTPRequest>({
      query: (data) => ({
        url: "/api/profile/phone/otp",
        method: "POST",
        body: data,
      }),
    }),

    // Change phone with OTP
    changePhone: builder.mutation<ProfileResponse, ChangePhoneRequest>({
      query: (data) => ({
        url: "/api/profile/phone",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Profile"],
    }),

    // Request OTP for email change
    requestEmailOTP: builder.mutation<ApiResponse, RequestEmailOTPRequest>({
      query: (data) => ({
        url: "/api/profile/email/otp",
        method: "POST",
        body: data,
      }),
    }),

    // Change email with OTP
    changeEmail: builder.mutation<ProfileResponse, ChangeEmailRequest>({
      query: (data) => ({
        url: "/api/profile/email",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Profile"],
    }),
  }),
});

// Export hooks
export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useRequestPhoneOTPMutation,
  useChangePhoneMutation,
  useRequestEmailOTPMutation,
  useChangeEmailMutation,
} = profileApi;
