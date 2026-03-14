export function normalizeRedirectTarget(redirectTo?: string | string[]) {
	if (Array.isArray(redirectTo)) {
		return redirectTo[0];
	}
	return redirectTo;
}

const INTERNAL_REDIRECT_ORIGIN = "https://pengana.local";

export function getSafeRedirectPath(
	redirectTo: string | undefined,
	fallbackPath: string,
) {
	if (!redirectTo?.startsWith("/") || redirectTo.startsWith("//")) {
		return fallbackPath;
	}

	try {
		const parsedRedirect = new URL(redirectTo, INTERNAL_REDIRECT_ORIGIN);
		const normalizedRedirect =
			parsedRedirect.pathname + parsedRedirect.search + parsedRedirect.hash;

		if (
			parsedRedirect.origin !== INTERNAL_REDIRECT_ORIGIN ||
			normalizedRedirect !== redirectTo
		) {
			return fallbackPath;
		}

		return redirectTo;
	} catch {
		return fallbackPath;
	}
}
