import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createContext } from "@pengana/api/context";
import { appRouter } from "@pengana/api/routers/index";
import { auth } from "@pengana/auth";
import { env } from "@pengana/env/server";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@pengana/i18n/config";
import { initServerI18n } from "@pengana/i18n/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { languageDetector } from "hono/language";
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
app.use("/api/auth/sign-in/*", authLimiter);
app.use("/api/auth/sign-up/*", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/reset-password", authLimiter);
app.use("/api/auth/change-password", authLimiter);
app.use("/api/auth/verify-email", authLimiter);
app.use("/rpc/upload.*", uploadLimiter);
app.use("/rpc/todo.*", syncLimiter);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

const logUnhandledError = (error: unknown) => {
	orpcLogger.error`Unhandled error: ${error}`;
};

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

const ws = { notifyUser: (_userId: string) => {} };

app.use("/*", async (c, next) => {
	const appContext = await createContext({ context: c });
	const fullContext = { ...appContext, notifyUser: ws.notifyUser };

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
		const original = apiResult.response;
		const contentType = original.headers.get("content-type") ?? "";

		if (contentType.includes("application/json") && original.status >= 400) {
			const body = (await original.json()) as Record<string, unknown>;
			const envelope = {
				success: false,
				error: {
					code: body.code ?? "INTERNAL_SERVER_ERROR",
					message: body.message ?? "Unknown error",
				},
			};
			return c.json(envelope, original.status as never);
		}

		return c.newResponse(original.body, original);
	}

	await next();
});

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

ws.notifyUser = setupWebSocket(server).notifyUser;
