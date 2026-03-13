import { expo } from "@better-auth/expo";
import { getLogger } from "@logtape/logtape";
import { db } from "@pengana/db";
import { findUserByEmail } from "@pengana/db/notification-queries";
import * as schema from "@pengana/db/schema/auth";
import { assignSeatIfAvailable } from "@pengana/db/seat-queries";
import {
	countOrgMembers,
	getOrgSubscription,
	upsertSubscription,
} from "@pengana/db/subscription-queries";
import { sendEmail } from "@pengana/email-dev/send-email";
import { env } from "@pengana/env/server";
import { checkout, polar, portal, webhooks } from "@polar-sh/better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink, organization } from "better-auth/plugins";

import { NOREPLY_EMAIL } from "./lib/constants";
import {
	accountDeletedEmail,
	invitationEmail,
	magicLinkEmail,
	resetPasswordEmail,
	verifyEmail,
	welcomeEmail,
} from "./lib/email-templates";
import { polarClient } from "./lib/payments";
import { normalizeSeatCount, resolveWebBaseUrl } from "./lib/web-url";

const logger = getLogger(["app", "auth"]);
const webUrl = resolveWebBaseUrl(env);

let _notifyUser: (userId: string) => void = () => {};

export function setNotifyUser(fn: (userId: string) => void) {
	_notifyUser = fn;
}

export const auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL,
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
		sendResetPassword: async ({ user, url }) => {
			await sendEmail(db, {
				to: user.email,
				from: NOREPLY_EMAIL,
				subject: "Reset your password",
				html: resetPasswordEmail(user.name ?? "", url),
			});
		},
	},
	emailVerification: {
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url }) => {
			const token = new URL(url).searchParams.get("token") ?? "";
			const callbackUrl = `${webUrl}/verify-email/callback?token=${encodeURIComponent(token)}`;
			await sendEmail(db, {
				to: user.email,
				from: NOREPLY_EMAIL,
				subject: "Verify your email",
				html: verifyEmail(user.name ?? "", callbackUrl),
			});
		},
	},
	user: {
		deleteUser: {
			enabled: true,
			afterDelete: async (user) => {
				try {
					await sendEmail(db, {
						to: user.email,
						from: NOREPLY_EMAIL,
						subject: "Your pengana account was deleted",
						html: accountDeletedEmail(user.name ?? ""),
					});
				} catch (error) {
					logger.error`Failed to send account deletion email: ${error}`;
				}
			},
		},
	},
	advanced: {
		defaultCookieAttributes: {
			sameSite: env.NODE_ENV === "development" ? "lax" : "none",
			secure: env.NODE_ENV !== "development",
			httpOnly: true,
		},
	},
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					try {
						await sendEmail(db, {
							to: user.email,
							from: NOREPLY_EMAIL,
							subject: "Welcome to pengana!",
							html: welcomeEmail(user.name ?? ""),
						});
					} catch (error) {
						logger.error`Failed to send welcome email: ${error}`;
					}
				},
			},
		},
	},
	plugins: [
		polar({
			client: polarClient,
			createCustomerOnSignUp: false,
			use: [
				checkout({
					products: [
						{
							productId: env.POLAR_PRO_PRODUCT_ID,
							slug: env.POLAR_PRO_PRODUCT_SLUG,
						},
					],
					successUrl: env.POLAR_SUCCESS_URL,
					authenticatedUsersOnly: true,
				}),
				portal(),
				webhooks({
					secret: env.POLAR_WEBHOOK_SECRET,
					onPayload: async (payload) => {
						logger.info`Polar webhook received: ${payload.type} metadata=${JSON.stringify((payload.data as Record<string, unknown>)?.metadata ?? {})}`;

						const subTypes = [
							"subscription.created",
							"subscription.active",
							"subscription.updated",
							"subscription.canceled",
							"subscription.revoked",
							"subscription.uncanceled",
						] as const;

						type SubType = (typeof subTypes)[number];

						if (!subTypes.includes(payload.type as SubType)) return;

						const data = payload.data as {
							id: string;
							productId: string;
							seats?: number | null;
							metadata: Record<string, unknown>;
						};

						const orgId = data.metadata?.orgId as string | undefined;
						if (!orgId) {
							logger.warn`Polar webhook ${payload.type}: no orgId in metadata, skipping. subscriptionId=${data.id} metadata=${JSON.stringify(data.metadata)}`;
							return;
						}

						const statusMap: Record<string, string> = {
							"subscription.created": "active",
							"subscription.active": "active",
							"subscription.updated": "active",
							"subscription.canceled": "canceled",
							"subscription.revoked": "revoked",
							"subscription.uncanceled": "active",
						};

						try {
							await upsertSubscription({
								organizationId: orgId,
								polarSubscriptionId: data.id,
								polarProductId: data.productId,
								status: statusMap[payload.type] ?? "active",
								seats: normalizeSeatCount(data.seats),
							});
							logger.info`Webhook ${payload.type}: upserted subscription for org=${orgId} polarSub=${data.id}`;
						} catch (err) {
							logger.error`Webhook ${payload.type}: failed to upsert subscription for org=${orgId}: ${err}`;
							throw err;
						}
					},
				}),
			],
		}),
		magicLink({
			sendMagicLink: async ({ email, url }) => {
				await sendEmail(db, {
					to: email,
					from: NOREPLY_EMAIL,
					subject: "Sign in to pengana",
					html: magicLinkEmail(url),
				});
			},
		}),
		organization({
			teams: { enabled: true, defaultTeam: { enabled: false } },
			sendInvitationEmail: async ({ invitation, organization, inviter }) => {
				const inviterName = inviter.user.name ?? "Someone";
				await sendEmail(db, {
					to: invitation.email,
					from: NOREPLY_EMAIL,
					subject: `${inviterName} invited you to join ${organization.name}`,
					html: invitationEmail(
						inviterName,
						organization.name,
						`${webUrl}/invitation/${invitation.id}`,
					),
				});
			},
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
					try {
						const orgId = data.invitation.organizationId;
						const memberId = data.member.id;
						const assigned = await assignSeatIfAvailable(orgId, memberId);
						logger.info`Invitation accepted: member ${memberId} seat ${assigned ? "assigned" : "unavailable (read-only)"}`;
					} catch (error) {
						logger.error`Failed to assign seat after invitation accepted: ${error}`;
					}
					try {
						const orgId = data.invitation.organizationId;
						const sub = await getOrgSubscription(orgId);
						if (!sub?.polarSubscriptionId) return;
						const memberCount = await countOrgMembers(orgId);
						await polarClient.subscriptions.update({
							id: sub.polarSubscriptionId,
							subscriptionUpdate: { seats: memberCount },
						});
						const assigned = await assignSeatIfAvailable(orgId, data.member.id);
						logger.info`Invitation accepted: retry seat assignment for member ${data.member.id} ${assigned ? "succeeded" : "still unavailable"}`;
					} catch (error) {
						logger.error`Failed to sync Polar seat count: ${error}`;
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
