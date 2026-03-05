import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "sqlite",
	schema: "./src/entities/todo/schema.ts",
	out: "./drizzle",
	dbCredentials: {
		url: "./todos.db",
	},
});
