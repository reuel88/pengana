function htmlEscape(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

export function resetPasswordEmail(name: string, url: string) {
	const safeName = htmlEscape(name);
	const safeUrl = htmlEscape(url);
	return `<p>Hi ${safeName},</p><p>Click the link below to reset your password:</p><p><a href="${safeUrl}">${safeUrl}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`;
}

export function verifyEmail(name: string, callbackUrl: string) {
	const safeName = htmlEscape(name);
	const safeCallbackUrl = htmlEscape(callbackUrl);
	return `<p>Hi ${safeName},</p><p>Click the link below to verify your email address:</p><p><a href="${safeCallbackUrl}">${safeCallbackUrl}</a></p>`;
}

export function welcomeEmail(name: string) {
	const safeName = htmlEscape(name);
	return `<p>Hi ${safeName},</p><p>Welcome to pengana! Your account has been created successfully.</p>`;
}

export function magicLinkEmail(url: string) {
	const safeUrl = htmlEscape(url);
	return `<p>Click the link below to sign in:</p><p><a href="${safeUrl}">${safeUrl}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`;
}

export function invitationEmail(
	inviterName: string,
	orgName: string,
	acceptUrl: string,
) {
	const safeInviterName = htmlEscape(inviterName);
	const safeOrgName = htmlEscape(orgName);
	const safeAcceptUrl = htmlEscape(acceptUrl);
	return `<p>${safeInviterName} invited you to join <strong>${safeOrgName}</strong> on pengana.</p><p><a href="${safeAcceptUrl}">Accept Invitation</a></p>`;
}

export function signUpEnumerationEmail(name: string, signInUrl: string) {
	const safeName = htmlEscape(name);
	const safeSignInUrl = htmlEscape(signInUrl);
	return `<p>Hi ${safeName},</p><p>Someone tried to create an account using your email address. If this was you, try <a href="${safeSignInUrl}">signing in</a> instead.</p><p>If you didn't request this, you can safely ignore this email.</p>`;
}
