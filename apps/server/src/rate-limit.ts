import { getConnInfo } from "@hono/node-server/conninfo";
import { env } from "@pengana/env/server";
import type { Context } from "hono";
import { rateLimiter } from "hono-rate-limiter";
import { errorEnvelope } from "./error-envelope";
import { logger } from "./logger";

const HTTP_TOO_MANY_REQUESTS = 429;
const isDev = env.NODE_ENV === "development";
// Dev servers share an IP (localhost) and tools like HMR generate bursts of
// requests, so rate limits are relaxed by this factor during development.
const DEV_MULTIPLIER = 10;

// NOTE: getConnInfo returns the direct connection address. Behind a reverse proxy
// (e.g. nginx, CloudFront), this will be the proxy's IP, not the client's.
// If deploying behind a proxy, replace with X-Forwarded-For / CF-Connecting-IP.
const keyGenerator = (c: Context) => {
	const address = getConnInfo(c).remote.address;
	if (!address) {
		logger.warn`Rate-limit: request with undefined remote address, using shared bucket`;
	}
	return address ?? "unknown";
};

const rateLimitExceededHandler = (c: Context) =>
	c.json(
		errorEnvelope("TOO_MANY_REQUESTS", "Rate limit exceeded. Try again later."),
		HTTP_TOO_MANY_REQUESTS,
	);

function createLimiter(windowMs: number, prodLimit: number) {
	return rateLimiter({
		windowMs,
		limit: isDev ? prodLimit * DEV_MULTIPLIER : prodLimit,
		standardHeaders: "draft-6",
		keyGenerator,
		handler: rateLimitExceededHandler,
	});
}

// Applied to all routes (/*). 120 requests per minute per IP.
// Prevents general API abuse.
export const globalLimiter = createLimiter(60 * 1000, 120);

// Applied to auth routes (/api/auth/*). 20 requests per 15 minutes per IP.
// Prevents brute-force login/signup attempts.
export const authLimiter = createLimiter(15 * 60 * 1000, 20);

// Applied to upload routes (/rpc/upload.*). 10 requests per minute per IP.
// Prevents upload abuse and controls storage/bandwidth usage.
export const uploadLimiter = createLimiter(60 * 1000, 10);

// Applied to todo sync routes (/rpc/todo.*). 60 requests per minute per IP.
// Prevents excessive sync polling while allowing reasonable real-time usage.
export const syncLimiter = createLimiter(60 * 1000, 60);
