import { createContext } from "@finance-tool-poc/api/context";
import { appRouter } from "@finance-tool-poc/api/routers/index";
import { auth } from "@finance-tool-poc/auth";
import { env } from "@finance-tool-poc/env/server";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { notifyUser, setupWebSocket } from "./ws";

const app = new Hono();

app.use(logger());
app.use(
	"/*",
	cors({
		origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

const handleError = (error: unknown) => {
	console.error(error);
};

export const apiHandler = new OpenAPIHandler(appRouter, {
	plugins: [
		new OpenAPIReferencePlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
		}),
	],
	interceptors: [onError(handleError)],
});

export const rpcHandler = new RPCHandler(appRouter, {
	interceptors: [onError(handleError)],
});

app.use("/*", async (c, next) => {
	const appContext = await createContext({ context: c });

	const rpcResult = await rpcHandler.handle(c.req.raw, {
		prefix: "/rpc",
		context: { ...appContext, notifyUser },
	});

	if (rpcResult.matched) {
		return c.newResponse(rpcResult.response.body, rpcResult.response);
	}

	const apiResult = await apiHandler.handle(c.req.raw, {
		prefix: "/api-reference",
		context: appContext,
	});

	if (apiResult.matched) {
		return c.newResponse(apiResult.response.body, apiResult.response);
	}

	await next();
});

app.get("/", (c) => {
	return c.text("OK");
});

app.use("/uploads/*", serveStatic({ root: "./" }));

const server = serve(
	{
		fetch: app.fetch,
		port: 3000,
		hostname: "0.0.0.0",
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);

setupWebSocket(server);
