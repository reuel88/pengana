import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		tailwindcss(),
		tanstackRouter({}),
		react(),
		VitePWA({
			registerType: "autoUpdate",
			manifest: {
				name: "pengana",
				short_name: "pengana",
				description: "pengana - PWA Application",
				theme_color: "#0c0c0c",
			},
			pwaAssets: { disabled: false, config: true },
			devOptions: { enabled: true },
		}),
	],
	build: {
		chunkSizeWarningLimit: 600,
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes("node_modules") || id.includes(".pnpm")) {
						if (id.includes("react-dom")) return "react-dom";
						if (id.match(/\/react\//)) return "react";
						if (id.includes("@tanstack") && id.includes("react-router"))
							return "router";
						if (id.includes("@tanstack") && id.includes("react-query"))
							return "query";
						if (id.includes("i18next")) return "i18n";
						if (id.includes("lucide-react")) return "icons";
						if (id.includes("@radix-ui")) return "radix";
						if (id.includes("better-auth") || id.includes("@better-auth"))
							return "auth";
					}
				},
			},
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		port: 3001,
		proxy: {
			"/api": {
				target: "http://localhost:3000",
				changeOrigin: true,
			},
			"/rpc": {
				target: "http://localhost:3000",
				changeOrigin: true,
			},
			"/uploads": {
				target: "http://localhost:3000",
				changeOrigin: true,
			},
		},
	},
});
