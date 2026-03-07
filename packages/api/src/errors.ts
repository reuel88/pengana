import { ORPCError } from "@orpc/server";

export type ErrorCode =
	| "UNAUTHORIZED"
	| "NOT_FOUND"
	| "BAD_REQUEST"
	| "FORBIDDEN"
	| "INTERNAL_SERVER_ERROR";

export function apiError(code: ErrorCode, message: string) {
	return new ORPCError(code, { message });
}
