import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { auth, setNotifyUser } from "@pengana/auth";
import { db } from "@pengana/db";
import { env } from "@pengana/env/server";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@pengana/i18n/config";
import { initServerI18n } from "@pengana/i18n/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { languageDetector } from "hono/language";
import { createAuthResponseGuard } from "./auth-response-guard";
import { errorEnvelope } from "./error-envelope";
import { initLogger, logger, requestLogger } from "./logger";
import { handleOrpcRoutes, wireNotifications } from "./orpc";
import {
	authLimiter,
	globalLimiter,
	syncLimiter,
	uploadLimiter,
} from "./rate-limit";
import { setupWebSocket } from "./ws";
import { issueWsTicket } from "./ws-tickets";

await initLogger();

const app = new Hono();

app.use(requestLogger);
const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());

app.use(
	"/*",
	cors({
		origin: allowedOrigins,
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

app.on(
	["POST", "GET"],
	"/api/auth/*",
	createAuthResponseGuard(auth, db, allowedOrigins),
);

app.post("/api/ws-ticket", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session?.user?.id) {
		return c.json(
			errorEnvelope("UNAUTHORIZED", "Authentication required"),
			401,
		);
	}
	return c.json({ ticket: issueWsTicket(session.user.id) });
});

// handleOrpcRoutes only matches /rpc and /api-reference; all other paths fall through
app.use("/*", handleOrpcRoutes);

app.get("/", (c) => {
	return c.text("OK");
});

app.use("/uploads/*", serveStatic({ root: "./" }));

await initServerI18n();

if (env.NODE_ENV === "development" || env.ENABLE_EMAIL_DEV) {
	const { createEmailDevApp } = await import("@pengana/email-dev");
	app.route("/dev/email", createEmailDevApp(db));
}

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

// Wire WebSocket notifications into ORPC context and auth hooks
const ws = setupWebSocket(server);
wireNotifications(ws.notifyUser, ws.notifyOrgMembers);
setNotifyUser(ws.notifyUser);
