import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createContext } from "@pengana/api/context";
import type { ErrorCode } from "@pengana/api/errors";
import { ERROR_CODES } from "@pengana/api/errors";
import { appRouter } from "@pengana/api/routers/index";
import type { Context, Next } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { errorEnvelope } from "./error-envelope";
import { logger, orpcLogger } from "./logger";
import { tryParseJsonObject } from "./safe-json";

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

export interface NotificationHandlers {
	notifyUser: (userId: string) => void;
	notifyOrgMembers: (orgId: string) => void;
}

// Initialized after server starts — WebSocket setup needs the HTTP server
// instance, but this middleware is created before the server exists. We use a
// mutable ref so that once the server starts and notifyUser is wired up, all
// subsequent requests pick up the real implementation.
const notifyRef: NotificationHandlers = {
	notifyUser: () => {
		logger.warn`notifyUser called before WebSocket server initialized`;
	},
	notifyOrgMembers: () => {
		logger.warn`notifyOrgMembers called before WebSocket server initialized`;
	},
};

export function wireNotifications(
	notifyUser: (userId: string) => void,
	notifyOrgMembers: (orgId: string) => void,
) {
	notifyRef.notifyUser = notifyUser;
	notifyRef.notifyOrgMembers = notifyOrgMembers;
}

const VALID_ERROR_CODES = new Set<string>(ERROR_CODES);

async function wrapApiErrorResponse(c: Context, response: Response) {
	const contentType = response.headers.get("content-type") ?? "";
	if (!contentType.includes("application/json") || response.status < 400) {
		return c.newResponse(response.body, response);
	}
	const body = await tryParseJsonObject(response);
	const rawCode = typeof body.code === "string" ? body.code : "";
	return c.json(
		errorEnvelope(
			VALID_ERROR_CODES.has(rawCode)
				? (rawCode as ErrorCode)
				: "INTERNAL_SERVER_ERROR",
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
	const orpcContext = {
		...appContext,
		notifyUser: notifyRef.notifyUser,
		notifyOrgMembers: notifyRef.notifyOrgMembers,
	};

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
		return wrapApiErrorResponse(c, apiResult.response);
	}

	await next();
}
