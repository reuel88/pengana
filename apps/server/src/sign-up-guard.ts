import type { auth as Auth } from "@pengana/auth";
import { NOREPLY_EMAIL } from "@pengana/auth/lib/constants";
import { signUpEnumerationEmail } from "@pengana/auth/lib/email-templates";
import type { db as Db } from "@pengana/db";
import { findUserByEmail } from "@pengana/db/notification-queries";
import { sendEmail } from "@pengana/email-dev/send-email";
import type { Context } from "hono";
import { logger } from "./logger";

export function createSignUpGuard(
	auth: typeof Auth,
	db: typeof Db,
	allowedOrigins: string[],
) {
	return async (c: Context) => {
		const clonedReq = c.req.raw.clone();
		const response = await auth.handler(c.req.raw);

		if (response.ok) return response;

		// Sign-up failed (likely duplicate email) — mask the error
		try {
			const body = await clonedReq.json();
			const email = body?.email as string | undefined;
			if (email) {
				const existingUser = await findUserByEmail(email);
				if (existingUser) {
					await sendEmail(db, {
						to: email,
						from: NOREPLY_EMAIL,
						subject: "Sign-up attempt with your email",
						html: signUpEnumerationEmail(
							existingUser.name ?? "",
							`${allowedOrigins[0]}/login`,
						),
					});
				}
			}
		} catch (err) {
			logger.error`Failed to handle sign-up enumeration protection: ${err}`;
		}

		// Return a neutral 200 so the caller can't distinguish new vs existing
		return new Response(JSON.stringify({ token: null, user: null }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	};
}
