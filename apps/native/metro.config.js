// Learn more https://docs.expo.io/guides/customizing-metro
const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push("sql");
config.resolver.assetExts.push("wasm");
config.resolver.platforms.push("web");

// Force monorepo packages to use the app's copies of shared deps,
// preventing duplicate instances from pnpm's virtual store
const appModules = path.resolve(__dirname, "node_modules");
config.resolver.extraNodeModules = {
	react: path.resolve(appModules, "react"),
	"react-dom": path.resolve(appModules, "react-dom"),
	"@tanstack/react-query": path.resolve(appModules, "@tanstack/react-query"),
};

module.exports = config;
