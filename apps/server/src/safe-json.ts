/**
 * Safe JSON body parsing shared across server middleware.
 * Both auth-response-guard and orpc need to read JSON from cloned responses
 * without throwing on malformed input.
 */
export async function tryParseJsonObject(
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
