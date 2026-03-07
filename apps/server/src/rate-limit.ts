import { getConnInfo } from "@hono/node-server/conninfo";
import { rateLimiter } from "hono-rate-limiter";

const keyGenerator = (c: Parameters<typeof getConnInfo>[0]) =>
	getConnInfo(c).remote.address ?? "unknown";

const handler = (c: { json: Function }) =>
	c.json(
		{
			code: "TOO_MANY_REQUESTS",
			message: "Rate limit exceeded. Try again later.",
		},
		429,
	);

export const globalLimiter = rateLimiter({
	windowMs: 60 * 1000,
	limit: 120,
	standardHeaders: "draft-6",
	keyGenerator,
	handler,
});

export const authLimiter = rateLimiter({
	windowMs: 15 * 60 * 1000,
	limit: 20,
	standardHeaders: "draft-6",
	keyGenerator,
	handler,
});

export const uploadLimiter = rateLimiter({
	windowMs: 60 * 1000,
	limit: 10,
	standardHeaders: "draft-6",
	keyGenerator,
	handler,
});

export const syncLimiter = rateLimiter({
	windowMs: 60 * 1000,
	limit: 60,
	standardHeaders: "draft-6",
	keyGenerator,
	handler,
});
