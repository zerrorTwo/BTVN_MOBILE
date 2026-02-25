require("dotenv").config();

module.exports = {
  expo: {
    name: "BT01",
    slug: "bt01",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      // API Base URL - Change based on environment
      apiBaseUrl:
        process.env.EXPO_PUBLIC_API_BASE_URL || "http://10.0.2.2:5000",
    },
  },
};
