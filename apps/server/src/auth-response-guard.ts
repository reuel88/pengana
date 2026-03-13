import type { auth as Auth } from "@pengana/auth";
import { NOREPLY_EMAIL } from "@pengana/auth/lib/constants";
import { signUpEnumerationEmail } from "@pengana/auth/lib/email-templates";
import type { db as Db } from "@pengana/db";
import { findUserByEmail } from "@pengana/db/notification-queries";
import { sendEmail } from "@pengana/email-dev/send-email";
import type { Context } from "hono";
import { logger } from "./logger";

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

function getRouteBehavior(req: Request): AuthRouteBehavior {
	if (req.method !== "POST") return null;

	const pathname = new URL(req.url).pathname;
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
		try {
			const body = (await response.clone().json()) as Record<string, unknown>;
			const strings = [
				body.code,
				body.error,
				body.message,
				typeof body.error === "object" && body.error !== null
					? (body.error as Record<string, unknown>).code
					: undefined,
				typeof body.error === "object" && body.error !== null
					? (body.error as Record<string, unknown>).message
					: undefined,
			]
				.filter((value): value is string => typeof value === "string")
				.map((value) => value.toLowerCase());
			values.push(...strings);
		} catch {
			return values;
		}

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

async function looksLikeEnumerationResponse(
	req: Request,
	response: Response,
): Promise<boolean> {
	const behavior = getRouteBehavior(req);
	if (!behavior || response.ok) return false;

	if (behavior === "generic-sign-in-failure") {
		return [400, 401, 403, 404].includes(response.status);
	}

	if ([404, 409].includes(response.status)) {
		return true;
	}

	const values = await extractResponseStrings(response);
	return values.some((value) =>
		ENUMERATION_HINTS.some((hint) => value.includes(hint)),
	);
}

async function maybeNotifyExistingUserOnDuplicateSignUp(
	req: Request,
	db: typeof Db,
	allowedOrigins: string[],
) {
	const pathname = new URL(req.url).pathname;
	if (pathname !== "/api/auth/sign-up/email") return;

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
			html: signUpEnumerationEmail(
				existingUser.name ?? "",
				`${allowedOrigins[0]}/login`,
			),
		});
	} catch (err) {
		logger.error`Failed to handle sign-up enumeration protection: ${err}`;
	}
}

function acknowledgedResponse(req: Request) {
	const pathname = new URL(req.url).pathname;
	const body =
		pathname === "/api/auth/sign-up/email"
			? { token: null, user: null }
			: { ok: true };
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
}

function genericSignInFailureResponse() {
	return new Response(
		JSON.stringify({
			code: "INVALID_CREDENTIALS",
			message: "Invalid email or password",
		}),
		{
			status: 401,
			headers: { "Content-Type": "application/json" },
		},
	);
}

export function createAuthResponseGuard(
	auth: typeof Auth,
	db: typeof Db,
	allowedOrigins: string[],
) {
	return async (c: Context) => {
		const response = await auth.handler(c.req.raw);
		if (!(await looksLikeEnumerationResponse(c.req.raw, response))) {
			return response;
		}

		const behavior = getRouteBehavior(c.req.raw);
		if (behavior === "generic-sign-in-failure") {
			return genericSignInFailureResponse();
		}

		// Fire-and-forget: avoid timing side-channel that leaks email existence
		void maybeNotifyExistingUserOnDuplicateSignUp(
			c.req.raw,
			db,
			allowedOrigins,
		);
		return acknowledgedResponse(c.req.raw);
	};
}
