import { Platform } from "react-native";

// Font families (you can add custom fonts later)
export const fontFamilies = {
  regular: Platform.select({
    ios: "System",
    android: "Roboto",
  }),
  medium: Platform.select({
    ios: "System",
    android: "Roboto-Medium",
  }),
  semibold: Platform.select({
    ios: "System",
    android: "Roboto-Medium",
  }),
  bold: Platform.select({
    ios: "System",
    android: "Roboto-Bold",
  }),
};

// Font sizes
export const fontSizes = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,
};

// Line heights
export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,
};

// Font weights (use these types directly)
export const fontWeights = {
  normal: "400" as "400",
  medium: "500" as "500",
  semibold: "600" as "600",
  bold: "700" as "700",
};

// Typography styles
export const typography = {
  // Headings
  h1: {
    fontSize: fontSizes["4xl"],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes["4xl"] * lineHeights.tight,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: fontSizes["3xl"],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes["3xl"] * lineHeights.tight,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: fontSizes["2xl"],
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes["2xl"] * lineHeights.normal,
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.xl * lineHeights.normal,
  },
  h5: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.lg * lineHeights.normal,
  },
  h6: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.md * lineHeights.normal,
  },

  // Body text
  body1: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: fontSizes.base * lineHeights.relaxed,
  },
  body2: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: fontSizes.sm * lineHeights.relaxed,
  },

  // Captions
  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.normal,
    lineHeight: fontSizes.xs * lineHeights.normal,
  },

  // Button text
  button: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.md * lineHeights.tight,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },

  // Subtitle
  subtitle1: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.md * lineHeights.normal,
  },
  subtitle2: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },

  // Overline
  overline: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.xs * lineHeights.normal,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
  },
};
