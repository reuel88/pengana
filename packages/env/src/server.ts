import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.url(),
		POLAR_ACCESS_TOKEN: z.string().min(1),
		POLAR_SERVER: z.enum(["sandbox", "production"]).default("sandbox"),
		POLAR_PRO_PRODUCT_ID: z
			.string()
			.min(1)
			.default("c69d9ab1-4e67-4a0c-8ff5-364a94e536f0"),
		POLAR_PRO_PRODUCT_SLUG: z.string().min(1).default("pro"),
		POLAR_SUCCESS_URL: z.url(),
		POLAR_WEBHOOK_SECRET: z.string().min(1),
		FREE_TIER_SEATS: z.coerce.number().default(2),
		CORS_ORIGIN: z.string().min(1),
		PORT: z.coerce.number().default(3000),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
