const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Deduplicate React — moti ships its own nested react/framer-motion which
// causes "Invalid hook call" on web. Force ALL react imports to root copies.
const DEDUPE = ["react", "react-dom", "react-native"];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react-native-linear-gradient") {
    return context.resolveRequest(context, "expo-linear-gradient", platform);
  }

  if (
    DEDUPE.some(
      (pkg) => moduleName === pkg || moduleName.startsWith(pkg + "/")
    )
  ) {
    const resolved = require.resolve(moduleName, { paths: [__dirname] });
    return { filePath: resolved, type: "sourceFile" };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
