import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { auth, setNotifyUser } from "@pengana/auth";
import { env } from "@pengana/env/server";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@pengana/i18n/config";
import { initServerI18n } from "@pengana/i18n/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { languageDetector } from "hono/language";
import { initLogger, logger, requestLogger } from "./logger";
import { handleOrpcRoutes, notifyRef } from "./orpc";
import {
	authLimiter,
	globalLimiter,
	syncLimiter,
	uploadLimiter,
} from "./rate-limit";
import { setupWebSocket } from "./ws";

const app = new Hono();

app.use(requestLogger);
app.use(
	"/*",
	cors({
		origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization", "Accept-Language"],
		credentials: true,
	}),
);

app.use(
	languageDetector({
		supportedLanguages: [...SUPPORTED_LOCALES],
		fallbackLanguage: DEFAULT_LOCALE,
		order: ["header"],
		caches: false,
	}),
);

app.use("/*", globalLimiter);

// Rate-limit sensitive auth endpoints individually (not all of /api/auth/*
// because session/profile endpoints don't need brute-force protection)
const rateLimitedAuthPaths = [
	"/api/auth/sign-in/*",
	"/api/auth/sign-up/*",
	"/api/auth/forgot-password",
	"/api/auth/reset-password",
	"/api/auth/change-password",
	"/api/auth/verify-email",
];
for (const path of rateLimitedAuthPaths) {
	app.use(path, authLimiter);
}

app.use("/rpc/upload.*", uploadLimiter);
app.use("/rpc/todo.*", syncLimiter);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.use("/*", handleOrpcRoutes);

app.get("/", (c) => {
	return c.text("OK");
});

app.use("/uploads/*", serveStatic({ root: "./" }));

await initLogger();
await initServerI18n();

const server = serve(
	{
		fetch: app.fetch,
		port: env.PORT,
		hostname: "0.0.0.0",
	},
	(info) => {
		logger.info`Server is running on http://localhost:${String(info.port)}`;
	},
);

notifyRef.current = setupWebSocket(server).notifyUser;
setNotifyUser(notifyRef.current);
