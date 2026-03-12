import { getLogger } from "@logtape/logtape";
import {
	countOrgMembers,
	getOrgSubscription,
	upsertSubscription,
} from "@pengana/db/subscription-queries";
import { z } from "zod";
import { apiError } from "../errors";
import { envelope, envelopeOutput, protectedProcedure } from "../index";

const logger = getLogger(["app", "billing"]);

const subscriptionSchema = z.object({
	id: z.string(),
	organizationId: z.string(),
	polarSubscriptionId: z.string(),
	polarProductId: z.string(),
	status: z.string(),
	seats: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const billingRouter = {
	getOrgSubscription: protectedProcedure
		.route({
			method: "GET",
			path: "/billing/subscription",
			summary: "Get org subscription",
		})
		.input(z.object({ organizationId: z.string() }))
		.output(envelopeOutput(subscriptionSchema.nullable()))
		.handler(async ({ input }) => {
			const sub = await getOrgSubscription(input.organizationId);
			return envelope(sub ?? null);
		}),

	confirmCheckout: protectedProcedure
		.route({
			method: "POST",
			path: "/billing/confirm-checkout",
			summary: "Confirm checkout and create subscription",
		})
		.input(z.object({ checkoutId: z.string() }))
		.output(envelopeOutput(z.object({ status: z.string() })))
		.handler(async ({ input }) => {
			const { polarClient } = await import("@pengana/auth/lib/payments");

			logger.info`confirmCheckout called with checkoutId=${input.checkoutId}`;

			const checkout = await polarClient.checkouts.get({
				id: input.checkoutId,
			});

			logger.info`Checkout fetched: status=${checkout.status} subscriptionId=${checkout.subscriptionId ?? "null"} productId=${checkout.productId ?? "null"} metadata=${JSON.stringify(checkout.metadata)}`;

			if (checkout.status !== "succeeded") {
				throw apiError("BAD_REQUEST", "Checkout has not been completed");
			}

			if (!checkout.productId) {
				throw apiError("BAD_REQUEST", "Checkout has no product");
			}

			let subscriptionId = checkout.subscriptionId;

			if (!subscriptionId) {
				logger.info`subscriptionId null on checkout, looking up via subscriptions.list`;
				const { result } = await polarClient.subscriptions.list({
					externalCustomerId: checkout.externalCustomerId ?? undefined,
					productId: checkout.productId ?? undefined,
					active: true,
				});
				subscriptionId = result.items[0]?.id ?? null;
			}

			if (!subscriptionId) {
				throw apiError(
					"BAD_REQUEST",
					"Subscription not yet created — please retry",
				);
			}

			const orgId = (checkout.metadata as Record<string, unknown>)?.orgId as
				| string
				| undefined;
			if (!orgId) {
				logger.error`Checkout metadata missing orgId. Full metadata: ${JSON.stringify(checkout.metadata)}`;
				throw apiError("BAD_REQUEST", "Checkout metadata is missing orgId");
			}

			try {
				await upsertSubscription({
					organizationId: orgId,
					polarSubscriptionId: subscriptionId,
					polarProductId: checkout.productId,
					status: "active",
					seats: null,
				});
				logger.info`Subscription upserted for org=${orgId} polarSub=${subscriptionId}`;
			} catch (err) {
				logger.error`Failed to upsert subscription for org=${orgId}: ${err}`;
				throw apiError("INTERNAL_SERVER_ERROR", "Failed to save subscription");
			}

			return envelope({ status: "active" });
		}),

	removeOrgMember: protectedProcedure
		.route({
			method: "POST",
			path: "/billing/remove-member",
			summary: "Remove member and sync billing",
		})
		.input(
			z.object({ memberIdOrEmail: z.string(), organizationId: z.string() }),
		)
		.output(envelopeOutput(z.object({ success: z.boolean() })))
		.handler(async ({ input, context }) => {
			const { auth } = await import("@pengana/auth");
			const { polarClient } = await import("@pengana/auth/lib/payments");

			await auth.api.removeMember({
				body: {
					memberIdOrEmail: input.memberIdOrEmail,
					organizationId: input.organizationId,
				},
				headers: context.headers,
			});

			const sub = await getOrgSubscription(input.organizationId);
			if (sub?.polarSubscriptionId && sub.status === "active") {
				const memberCount = await countOrgMembers(input.organizationId);
				await polarClient.subscriptions.update({
					id: sub.polarSubscriptionId,
					subscriptionUpdate: { seats: memberCount },
				});
			}

			return envelope({ success: true });
		}),
};
