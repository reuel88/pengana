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

// Force singleton resolution for packages that rely on React context.
// Without this, pnpm's isolated linker creates separate instances per peer-dep set
// (e.g. react@19.2.0 vs react@19.2.4), breaking context sharing.
// Using require.resolve to get exact file paths bypasses Metro's walk-up resolution entirely.
const singletonPkgs = {
	react: require.resolve("react", { paths: [__dirname] }),
	"react-dom": require.resolve("react-dom", { paths: [__dirname] }),
	"@tanstack/react-query": require.resolve("@tanstack/react-query", {
		paths: [__dirname],
	}),
};
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
	if (singletonPkgs[moduleName]) {
		return { type: "sourceFile", filePath: singletonPkgs[moduleName] };
	}
	if (originalResolveRequest) {
		return originalResolveRequest(context, moduleName, platform);
	}
	return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
