import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createContext } from "@pengana/api/context";
import { appRouter } from "@pengana/api/routers/index";
import type { Context, Next } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { errorEnvelope } from "./error-envelope";
import { logger, orpcLogger } from "./logger";

function logUnhandledError(error: unknown) {
	orpcLogger.error`Unhandled error: ${error}`;
}

const apiHandler = new OpenAPIHandler(appRouter, {
	plugins: [
		new OpenAPIReferencePlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
		}),
	],
	interceptors: [onError(logUnhandledError)],
});

const rpcHandler = new RPCHandler(appRouter, {
	interceptors: [onError(logUnhandledError)],
});

// Initialized after server starts — WebSocket setup needs the HTTP server
// instance, but this middleware is created before the server exists. We use a
// mutable ref so that once the server starts and notifyUser is wired up, all
// subsequent requests pick up the real implementation.
export const notifyRef: { current: (userId: string) => void } = {
	current: () => {
		logger.warn`notifyUser called before WebSocket server initialized`;
	},
};

async function parseJsonObject(
	response: Response,
): Promise<Record<string, unknown>> {
	try {
		const raw: unknown = await response.clone().json();
		if (raw != null && typeof raw === "object" && !Array.isArray(raw)) {
			return raw as Record<string, unknown>;
		}
		return {};
	} catch {
		return {};
	}
}

const VALID_ERROR_CODES = new Set([
	"UNAUTHORIZED",
	"NOT_FOUND",
	"BAD_REQUEST",
	"FORBIDDEN",
	"INTERNAL_SERVER_ERROR",
	"TOO_MANY_REQUESTS",
]);

async function ensureErrorEnvelope(c: Context, response: Response) {
	const contentType = response.headers.get("content-type") ?? "";
	if (!contentType.includes("application/json") || response.status < 400) {
		return c.newResponse(response.body, response);
	}
	const body = await parseJsonObject(response);
	const rawCode = typeof body.code === "string" ? body.code : "";
	return c.json(
		errorEnvelope(
			VALID_ERROR_CODES.has(rawCode) ? rawCode : "INTERNAL_SERVER_ERROR",
			typeof body.message === "string" ? body.message : "Unknown error",
		),
		response.status as ContentfulStatusCode,
	);
}

export async function handleOrpcRoutes(c: Context, next: Next) {
	if (
		!c.req.path.startsWith("/rpc") &&
		!c.req.path.startsWith("/api-reference")
	) {
		return next();
	}

	const appContext = await createContext({ context: c });
	const orpcContext = { ...appContext, notifyUser: notifyRef.current };

	const rpcResult = await rpcHandler.handle(c.req.raw, {
		prefix: "/rpc",
		context: orpcContext,
	});
	if (rpcResult.matched) {
		return c.newResponse(rpcResult.response.body, rpcResult.response);
	}

	const apiResult = await apiHandler.handle(c.req.raw, {
		prefix: "/api-reference",
		context: orpcContext,
	});
	if (apiResult.matched) {
		return ensureErrorEnvelope(c, apiResult.response);
	}

	await next();
}
