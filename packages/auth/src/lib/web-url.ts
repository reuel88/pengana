export interface WebUrlEnv {
	WEB_URL?: string;
	APP_URL?: string;
	CORS_ORIGIN: string;
}

function trimTrailingSlash(value: string) {
	return value.replace(/\/+$/, "");
}

function validateHttpUrl(value: string, source: string) {
	const parsed = new URL(value);
	if (!["http:", "https:"].includes(parsed.protocol)) {
		throw new Error(`${source} must use http or https`);
	}
	return trimTrailingSlash(parsed.toString());
}

export function resolveWebBaseUrl(env: WebUrlEnv) {
	if (env.WEB_URL) {
		return validateHttpUrl(env.WEB_URL, "WEB_URL");
	}

	if (env.APP_URL) {
		return validateHttpUrl(env.APP_URL, "APP_URL");
	}

	// Last resort for older environments that have not set WEB_URL/APP_URL yet.
	for (const origin of env.CORS_ORIGIN.split(",")) {
		const trimmedOrigin = origin.trim();
		if (!trimmedOrigin) continue;

		try {
			const parsed = new URL(trimmedOrigin);
			if (["http:", "https:"].includes(parsed.protocol)) {
				return trimTrailingSlash(parsed.toString());
			}
		} catch {}
	}

	throw new Error(
		"Unable to resolve web URL from WEB_URL, APP_URL, or CORS_ORIGIN",
	);
}

export function normalizeSeatCount(seats?: number | null) {
	return seats == null ? null : String(seats);
}
