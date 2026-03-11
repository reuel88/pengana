import { ORPCError } from "@orpc/server";

export const ERROR_CODES = [
	"UNAUTHORIZED",
	"NOT_FOUND",
	"BAD_REQUEST",
	"FORBIDDEN",
	"INTERNAL_SERVER_ERROR",
	"TOO_MANY_REQUESTS",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export function apiError(code: ErrorCode, message: string) {
	return new ORPCError(code, { message });
}
