import { expo } from "@better-auth/expo";
import { getLogger } from "@logtape/logtape";
import { db } from "@pengana/db";
import { findUserByEmail } from "@pengana/db/notification-queries";
import * as schema from "@pengana/db/schema/auth";
import { env } from "@pengana/env/server";
// import { checkout, polar, portal } from "@polar-sh/better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";

// import { polarClient } from "./lib/payments";

const logger = getLogger(["app", "auth"]);

let _notifyUser: (userId: string) => void = () => {};

export function setNotifyUser(fn: (userId: string) => void) {
	_notifyUser = fn;
}

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",

		schema: schema,
	}),
	trustedOrigins: [
		...env.CORS_ORIGIN.split(",").map((o) => o.trim()),
		"pengana://",
		...(env.NODE_ENV === "development"
			? [
					"exp://",
					"exp://**",
					"exp://192.168.*.*:*/**",
					"http://localhost:8081",
					"chrome-extension://*",
				]
			: []),
	],
	emailAndPassword: {
		enabled: true,
	},
	advanced: {
		defaultCookieAttributes: {
			sameSite: env.NODE_ENV === "development" ? "lax" : "none",
			secure: env.NODE_ENV !== "development",
			httpOnly: true,
		},
	},
	plugins: [
		// polar({
		// 	client: polarClient,
		// 	createCustomerOnSignUp: true,
		// 	enableCustomerPortal: true,
		// 	use: [
		// 		checkout({
		// 			products: [
		// 				{
		// 					productId: "your-product-id",
		// 					slug: "pro",
		// 				},
		// 			],
		// 			successUrl: env.POLAR_SUCCESS_URL,
		// 			authenticatedUsersOnly: true,
		// 		}),
		// 		portal(),
		// 	],
		// }),
		organization({
			teams: { enabled: true, defaultTeam: { enabled: false } },
			organizationHooks: {
				afterCreateInvitation: async (data) => {
					try {
						const user = await findUserByEmail(data.invitation.email);
						if (user) _notifyUser(user.id);
					} catch (error) {
						logger.error`Failed to notify after invitation created: ${error}`;
					}
				},
				afterAcceptInvitation: async (data) => {
					try {
						_notifyUser(data.invitation.inviterId);
					} catch (error) {
						logger.error`Failed to notify after invitation accepted: ${error}`;
					}
				},
				afterRejectInvitation: async (data) => {
					try {
						_notifyUser(data.invitation.inviterId);
					} catch (error) {
						logger.error`Failed to notify after invitation rejected: ${error}`;
					}
				},
				afterCancelInvitation: async (data) => {
					try {
						const user = await findUserByEmail(data.invitation.email);
						if (user) _notifyUser(user.id);
					} catch (error) {
						logger.error`Failed to notify after invitation cancelled: ${error}`;
					}
				},
			},
		}),
		expo(),
	],
});
