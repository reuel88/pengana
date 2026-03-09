import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createContext } from "@pengana/api/context";
import { appRouter } from "@pengana/api/routers/index";
import type { Context, Next } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
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

// Initialized after server starts — WebSocket needs the HTTP server instance.
// handleOrpcRoutes captures this ref in its closure, so when notifyRef.current
// is later assigned the real notifyUser function, all subsequent requests use it.
export const notifyRef: { current: (userId: string) => void } = {
	current: () => {
		logger.warn`notifyUser called before WebSocket server initialized`;
	},
};

async function parseJsonBody(
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

async function ensureErrorEnvelope(c: Context, response: Response) {
	const contentType = response.headers.get("content-type") ?? "";
	if (!contentType.includes("application/json") || response.status < 400) {
		return c.newResponse(response.body, response);
	}
	const body = await parseJsonBody(response);
	const VALID_ERROR_CODES = new Set([
		"UNAUTHORIZED",
		"NOT_FOUND",
		"BAD_REQUEST",
		"FORBIDDEN",
		"INTERNAL_SERVER_ERROR",
		"TOO_MANY_REQUESTS",
	]);
	const rawCode = typeof body.code === "string" ? body.code : "";
	return c.json(
		{
			success: false,
			error: {
				code: VALID_ERROR_CODES.has(rawCode)
					? rawCode
					: "INTERNAL_SERVER_ERROR",
				message:
					typeof body.message === "string" ? body.message : "Unknown error",
			},
		},
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
