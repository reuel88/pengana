import { configure, getConsoleSink, getLogger } from "@logtape/logtape";
import type { MiddlewareHandler } from "hono";

export async function initLogger() {
	await configure({
		sinks: { console: getConsoleSink() },
		loggers: [{ category: "app", lowestLevel: "debug", sinks: ["console"] }],
	});
}

// Slice loggers — add new slices as getLogger(["app", "<slice-name>"])
export const logger = getLogger(["app"]);
export const httpLogger = getLogger(["app", "http"]);
export const wsLogger = getLogger(["app", "ws"]);
export const orpcLogger = getLogger(["app", "orpc"]);

export const requestLogger: MiddlewareHandler = async (c, next) => {
	const start = Date.now();
	const { method, path } = c.req;
	await next();
	const status = c.res.status;
	const elapsed = Date.now() - start;
	if (status >= 400) {
		httpLogger.warn`${method} ${path} ${String(status)} ${String(elapsed)}ms`;
	} else {
		httpLogger.info`${method} ${path} ${String(status)} ${String(elapsed)}ms`;
	}
};
