import { getConnInfo } from "@hono/node-server/conninfo";
import { env } from "@pengana/env/server";
import { rateLimiter } from "hono-rate-limiter";

const isDev = env.NODE_ENV === "development";

const keyGenerator = (c: Parameters<typeof getConnInfo>[0]) =>
	getConnInfo(c).remote.address ?? "unknown";

// biome-ignore lint/complexity/noBannedTypes: hono-rate-limiter handler expects generic json method
const handler = (c: { json: Function }) =>
	c.json(
		{
			success: false,
			error: {
				code: "TOO_MANY_REQUESTS",
				message: "Rate limit exceeded. Try again later.",
			},
		},
		429,
	);

// Applied to all routes (/*). 120 requests per minute per IP.
// Prevents general API abuse.
export const globalLimiter = rateLimiter({
	windowMs: 60 * 1000,
	limit: isDev ? 1200 : 120,
	standardHeaders: "draft-6",
	keyGenerator,
	handler,
});

// Applied to auth routes (/api/auth/*). 20 requests per 15 minutes per IP.
// Prevents brute-force login/signup attempts.
export const authLimiter = rateLimiter({
	windowMs: 15 * 60 * 1000,
	limit: isDev ? 200 : 20,
	standardHeaders: "draft-6",
	keyGenerator,
	handler,
});

// Applied to upload routes (/rpc/upload.*). 10 requests per minute per IP.
// Prevents upload abuse and controls storage/bandwidth usage.
export const uploadLimiter = rateLimiter({
	windowMs: 60 * 1000,
	limit: isDev ? 100 : 10,
	standardHeaders: "draft-6",
	keyGenerator,
	handler,
});

// Applied to todo sync routes (/rpc/todo.*). 60 requests per minute per IP.
// Prevents excessive sync polling while allowing reasonable real-time usage.
export const syncLimiter = rateLimiter({
	windowMs: 60 * 1000,
	limit: isDev ? 600 : 60,
	standardHeaders: "draft-6",
	keyGenerator,
	handler,
});
