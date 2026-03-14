import type { ErrorCode } from "@pengana/api/errors";

export function errorEnvelope(code: ErrorCode, message: string) {
	return { success: false as const, error: { code, message } };
}

export function successEnvelope<T>(data: T) {
	return { success: true as const, data };
}
