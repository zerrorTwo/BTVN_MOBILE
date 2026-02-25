import Constants from "expo-constants";

// Get API base URL from environment
// EXPO_PUBLIC_ prefix makes env vars available at runtime for web/client
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  Constants.expoConfig?.extra?.apiBaseUrl ||
  "http://10.0.2.2:5000";

console.log("API_BASE_URL", API_BASE_URL);

// Other config values can be added here
export const CONFIG = {
  apiBaseUrl: API_BASE_URL,
  apiTimeout: 30000, // 30 seconds
  enableApiLogging: __DEV__, // Only log in development
};
