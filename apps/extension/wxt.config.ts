import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

export default defineConfig({
	modules: ["@wxt-dev/module-react"],
	manifest: {
		permissions: ["alarms"],
		// DEV-ONLY: Production requires a different origin or dynamic host_permissions strategy
		host_permissions: ["http://localhost:3000/*"],
	},
	vite: () => ({
		plugins: [tailwindcss()],
	}),
});
