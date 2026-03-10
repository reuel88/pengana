export function errorEnvelope(code: string, message: string) {
	return { success: false as const, error: { code, message } };
}
