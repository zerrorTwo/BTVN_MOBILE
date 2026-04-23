// Color System with Gradients
export const colors = {
  // Primary Blue
  primary: {
    main: "#0B5ED7",
    light: "#3B82F6",
    dark: "#0A4AA3",
    gradient: ["#3B82F6", "#0B5ED7"],
    vibrant: ["#60A5FA", "#2563EB", "#0B5ED7"],
  },

  // Success
  success: {
    main: "#26AA99",
    light: "#4DB6AC",
    dark: "#00897B",
    gradient: ["#4DB6AC", "#26AA99"],
  },

  // Warning
  warning: {
    main: "#F69113",
    light: "#FFB74D",
    dark: "#F57C00",
    gradient: ["#FFB74D", "#FF9800"],
  },

  // Error
  error: {
    main: "#F44336",
    light: "#EF5350",
    dark: "#C62828",
    gradient: ["#EF5350", "#F44336"],
  },

  // Info
  info: {
    main: "#2196F3",
    light: "#64B5F6",
    dark: "#1976D2",
    gradient: ["#64B5F6", "#2196F3"],
  },

  // Backgrounds
  background: {
    default: "#F5F5F5",
    paper: "#FFFFFF",
    dark: "#1A1A1A",
    gradient: ["#FAFAFA", "#F5F5F5"],
    primaryGradient: ["#EAF3FF", "#F5F9FF"],
    darkGradient: ["#2C2C2C", "#1A1A1A"],
  },

  // Text
  text: {
    primary: "#212121",
    secondary: "#757575",
    disabled: "#BDBDBD",
    hint: "#9E9E9E",
    white: "#FFFFFF",
  },

  // Border
  border: {
    light: "#E0E0E0",
    main: "#BDBDBD",
    dark: "#9E9E9E",
  },

  // Overlay
  overlay: {
    light: "rgba(0, 0, 0, 0.1)",
    medium: "rgba(0, 0, 0, 0.3)",
    dark: "rgba(0, 0, 0, 0.5)",
    darker: "rgba(0, 0, 0, 0.7)",
  },

  // Glass effect
  glass: {
    light: "rgba(255, 255, 255, 0.8)",
    medium: "rgba(255, 255, 255, 0.6)",
    dark: "rgba(255, 255, 255, 0.4)",
  },

  // Status colors
  status: {
    pending: "#F69113",
    confirmed: "#1E90FF",
    preparing: "#9C27B0",
    shipping: "#2196F3",
    completed: "#26AA99",
    cancelled: "#9E9E9E",
    cancelRequested: "#F44336",
  },

  // Payment status
  payment: {
    unpaid: "#F69113",
    paid: "#26AA99",
    failed: "#F44336",
    refunded: "#9E9E9E",
  },

  // Payment provider brand colors
  provider: {
    momo: "#A50064",
    momoLight: "#D82D8B",
    momoSoft: "#FFE4F1",
    vnpay: "#005BAA",
    zalopay: "#0068FF",
    cod: "#26AA99",
  },
};

// Gradient presets
export const gradients = {
  primary: ["#60A5FA", "#2563EB", "#0B5ED7"],
  primarySimple: ["#3B82F6", "#0B5ED7"],
  success: ["#4DB6AC", "#26AA99"],
  warning: ["#FFB74D", "#FF9800"],
  error: ["#EF5350", "#F44336"],
  info: ["#64B5F6", "#2196F3"],
  shimmer: ["#F0F0F0", "#E8E8E8", "#F0F0F0"],
  silver: ["#E8E8E8", "#F5F5F5", "#E8E8E8"],
  gold: ["#FFD700", "#FFC107", "#FFD700"],
  momo: ["#D82D8B", "#A50064"],
  splash: ["#1E3A8A", "#0B5ED7", "#3B82F6"],
};
