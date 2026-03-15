import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

export default defineConfig({
	srcDir: "src",
	modules: ["@wxt-dev/module-react"],
	manifest: {
		permissions: ["alarms"],
		host_permissions: [
			`${process.env.VITE_SERVER_URL ?? "http://localhost:3000"}/*`,
		],
	},
	vite: () => ({
		plugins: [tailwindcss()],
		resolve: {
			alias: {
				"@pengana/org-client": path.resolve(
					__dirname,
					"../../packages/org-client/src/index.ts",
				),
			},
		},
	}),
});
