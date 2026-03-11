// Learn more https://docs.expo.io/guides/customizing-metro
const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push("sql");
config.resolver.assetExts.push("wasm");
config.resolver.platforms.push("web");

// Ensure monorepo packages resolve shared deps from the app's node_modules first,
// preventing duplicate instances from pnpm's virtual store
const monorepoRoot = path.resolve(__dirname, "../..");
config.resolver.nodeModulesPaths = [
	path.resolve(__dirname, "node_modules"),
	path.resolve(monorepoRoot, "node_modules"),
];

module.exports = config;
