import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createContext } from "@pengana/api/context";
import { appRouter } from "@pengana/api/routers/index";
import { auth, setNotifyUser } from "@pengana/auth";
import { env } from "@pengana/env/server";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@pengana/i18n/config";
import { initServerI18n } from "@pengana/i18n/server";
import { type Context, Hono, type Next } from "hono";
import { cors } from "hono/cors";
import { languageDetector } from "hono/language";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { initLogger, logger, orpcLogger, requestLogger } from "./logger";
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

function logUnhandledError(error: unknown) {
	orpcLogger.error`Unhandled error: ${error}`;
}

export const apiHandler = new OpenAPIHandler(appRouter, {
	plugins: [
		new OpenAPIReferencePlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
		}),
	],
	interceptors: [onError(logUnhandledError)],
});

export const rpcHandler = new RPCHandler(appRouter, {
	interceptors: [onError(logUnhandledError)],
});

// Initialized after server starts — WebSocket needs the HTTP server instance.
// The middleware closure captures this reference so it always uses the live function.
const notifyRef: { current: (userId: string) => void } = {
	current: () => {},
};

async function wrapApiErrorResponse(c: Context, response: Response) {
	const contentType = response.headers.get("content-type") ?? "";
	if (contentType.includes("application/json") && response.status >= 400) {
		const body = (await response.json()) as Record<string, unknown>;
		return c.json(
			{
				success: false,
				error: {
					code: body.code ?? "INTERNAL_SERVER_ERROR",
					message: body.message ?? "Unknown error",
				},
			},
			response.status as ContentfulStatusCode,
		);
	}
	return c.newResponse(response.body, response);
}

async function handleOrpcRoutes(c: Context, next: Next) {
	const appContext = await createContext({ context: c });
	const fullContext = { ...appContext, notifyUser: notifyRef.current };

	const rpcResult = await rpcHandler.handle(c.req.raw, {
		prefix: "/rpc",
		context: fullContext,
	});
	if (rpcResult.matched) {
		return c.newResponse(rpcResult.response.body, rpcResult.response);
	}

	const apiResult = await apiHandler.handle(c.req.raw, {
		prefix: "/api-reference",
		context: fullContext,
	});
	if (apiResult.matched) {
		return wrapApiErrorResponse(c, apiResult.response);
	}

	await next();
}

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
