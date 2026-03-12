export function resetPasswordEmail(name: string, url: string) {
	return `<p>Hi ${name},</p><p>Click the link below to reset your password:</p><p><a href="${url}">${url}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`;
}

export function verifyEmail(name: string, callbackUrl: string) {
	return `<p>Hi ${name},</p><p>Click the link below to verify your email address:</p><p><a href="${callbackUrl}">${callbackUrl}</a></p>`;
}

export function welcomeEmail(name: string) {
	return `<p>Hi ${name},</p><p>Welcome to pengana! Your account has been created successfully.</p>`;
}

export function magicLinkEmail(url: string) {
	return `<p>Click the link below to sign in:</p><p><a href="${url}">${url}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`;
}

export function invitationEmail(
	inviterName: string,
	orgName: string,
	acceptUrl: string,
) {
	return `<p>${inviterName} invited you to join <strong>${orgName}</strong> on pengana.</p><p><a href="${acceptUrl}">Accept Invitation</a></p>`;
}

export function signUpEnumerationEmail(name: string, signInUrl: string) {
	return `<p>Hi ${name},</p><p>Someone tried to create an account using your email address. If this was you, try <a href="${signInUrl}">signing in</a> instead.</p><p>If you didn't request this, you can safely ignore this email.</p>`;
}
