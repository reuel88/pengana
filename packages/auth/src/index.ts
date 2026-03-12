import { expo } from "@better-auth/expo";
import { getLogger } from "@logtape/logtape";
import { db } from "@pengana/db";
import { findUserByEmail } from "@pengana/db/notification-queries";
import * as schema from "@pengana/db/schema/auth";
import {
	countOrgMembers,
	getOrgSubscription,
	upsertSubscription,
} from "@pengana/db/subscription-queries";
import { env } from "@pengana/env/server";
import { checkout, polar, portal, webhooks } from "@polar-sh/better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";

import { polarClient } from "./lib/payments";

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
		polar({
			client: polarClient,
			createCustomerOnSignUp: false,
			use: [
				checkout({
					products: [
						{ productId: "c69d9ab1-4e67-4a0c-8ff5-364a94e536f0", slug: "pro" },
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
								seats: data.seats ? String(data.seats) : null,
							});
							logger.info`Webhook ${payload.type}: upserted subscription for org=${orgId} polarSub=${data.id}`;
						} catch (err) {
							logger.error`Webhook ${payload.type}: failed to upsert subscription for org=${orgId}: ${err}`;
						}
					},
				}),
			],
		}),
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
					try {
						const orgId = data.invitation.organizationId;
						const sub = await getOrgSubscription(orgId);
						if (!sub?.polarSubscriptionId) return;
						const memberCount = await countOrgMembers(orgId);
						await polarClient.subscriptions.update({
							id: sub.polarSubscriptionId,
							subscriptionUpdate: { seats: memberCount },
						});
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
