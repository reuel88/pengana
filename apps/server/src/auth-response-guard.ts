import type { auth as Auth } from "@pengana/auth";
import { NOREPLY_EMAIL } from "@pengana/auth/lib/constants";
import { signUpEnumerationEmail } from "@pengana/auth/lib/email-templates";
import type { db as Db } from "@pengana/db";
import { findUserByEmail } from "@pengana/db/notification-queries";
import { sendEmail } from "@pengana/email-dev/send-email";
import type { Context } from "hono";
import { authResponseGuardLogger as logger } from "./logger";
import { tryParseJsonObject } from "./safe-json";

type AuthRouteBehavior = "acknowledge" | "generic-sign-in-failure" | null;

const ACKNOWLEDGED_AUTH_PATHS = [
	"/api/auth/sign-up/email",
	"/api/auth/forgot-password",
	"/api/auth/send-verification-email",
	"/api/auth/change-email",
];

const ENUMERATION_HINTS = [
	"already",
	"duplicate",
	"exist",
	"invalid email or password",
	"no account",
	"no user",
	"not found",
	"taken",
	"unknown",
	"user not found",
];

function getRouteBehavior(method: string, pathname: string): AuthRouteBehavior {
	if (method !== "POST") return null;

	if (pathname === "/api/auth/sign-in/email") {
		return "generic-sign-in-failure";
	}

	if (
		ACKNOWLEDGED_AUTH_PATHS.includes(pathname) ||
		pathname.includes("magic-link")
	) {
		return "acknowledge";
	}

	return null;
}

async function extractResponseStrings(response: Response) {
	const values: string[] = [];
	const contentType = response.headers.get("content-type") ?? "";

	if (contentType.includes("application/json")) {
		const body = await tryParseJsonObject(response);
		if (Object.keys(body).length === 0) return values;

		const nestedError =
			typeof body.error === "object" && body.error !== null
				? (body.error as Record<string, unknown>)
				: undefined;
		const strings = [
			body.code,
			body.error,
			body.message,
			nestedError?.code,
			nestedError?.message,
		]
			.filter((value): value is string => typeof value === "string")
			.map((value) => value.toLowerCase());
		values.push(...strings);

		return values;
	}

	try {
		const text = (await response.clone().text()).trim().toLowerCase();
		if (text) values.push(text);
	} catch {
		// Ignore unparsable bodies and fall back to status-based checks.
	}

	return values;
}

const SIGN_IN_ENUMERATION_STATUSES = [400, 401, 403, 404];
const CONFLICT_OR_NOT_FOUND_STATUSES = [404, 409];

async function looksLikeEnumerationResponse(
	behavior: AuthRouteBehavior,
	response: Response,
): Promise<boolean> {
	if (!behavior || response.ok) return false;

	if (behavior === "generic-sign-in-failure") {
		return SIGN_IN_ENUMERATION_STATUSES.includes(response.status);
	}

	if (CONFLICT_OR_NOT_FOUND_STATUSES.includes(response.status)) {
		return true;
	}

	const values = await extractResponseStrings(response);
	return values.some((value) =>
		ENUMERATION_HINTS.some((hint) => value.includes(hint)),
	);
}

async function notifyExistingUserOnDuplicateSignUp(
	req: Request,
	db: typeof Db,
	webUrl: string,
) {
	try {
		const body = (await req.clone().json()) as { email?: string } | null;
		const email = body?.email;
		if (!email) return;

		const existingUser = await findUserByEmail(email);
		if (!existingUser) return;

		await sendEmail(db, {
			to: email,
			from: NOREPLY_EMAIL,
			subject: "Sign-up attempt with your email",
			html: signUpEnumerationEmail(existingUser.name ?? "", `${webUrl}/login`),
		});
	} catch (err) {
		logger.error`Failed to handle sign-up enumeration protection: ${err}`;
	}
}

function jsonResponse(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

function acknowledgedResponse(pathname: string) {
	const body =
		pathname === "/api/auth/sign-up/email"
			? { token: null, user: null }
			: { ok: true };
	return jsonResponse(body);
}

function genericSignInFailureResponse() {
	return jsonResponse(
		{ code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
		401,
	);
}

export function createAuthResponseGuard(
	auth: typeof Auth,
	db: typeof Db,
	webUrl: string,
) {
	return async (c: Context) => {
		const req = c.req.raw;
		const pathname = new URL(req.url).pathname;
		const behavior = getRouteBehavior(req.method, pathname);

		const authRequest = req.clone();
		const response = await auth.handler(authRequest);
		if (!(await looksLikeEnumerationResponse(behavior, response))) {
			return response;
		}

		if (behavior === "generic-sign-in-failure") {
			return genericSignInFailureResponse();
		}

		// Fire-and-forget: avoid timing side-channel that leaks email existence
		if (pathname === "/api/auth/sign-up/email") {
			void notifyExistingUserOnDuplicateSignUp(req, db, webUrl);
		}
		return acknowledgedResponse(pathname);
	};
}
