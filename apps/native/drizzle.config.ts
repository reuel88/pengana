import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "sqlite",
	schema: [
		"./src/features/todo/entities/todo/schema.ts",
		"./src/features/sync/entities/upload-queue/schema.ts",
	],
	out: "./drizzle",
	dbCredentials: {
		url: "./app.db",
	},
});
