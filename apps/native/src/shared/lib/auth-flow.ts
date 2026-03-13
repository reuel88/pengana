export function normalizeRedirectTarget(redirectTo?: string | string[]) {
	if (Array.isArray(redirectTo)) {
		return redirectTo[0];
	}
	return redirectTo;
}
