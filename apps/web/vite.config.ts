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
				name: "finance-tool-poc",
				short_name: "finance-tool-poc",
				description: "finance-tool-poc - PWA Application",
				theme_color: "#0c0c0c",
			},
			pwaAssets: { disabled: false, config: true },
			devOptions: { enabled: true },
		}),
	],
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
