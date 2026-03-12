import { os } from "@orpc/server";
import {
	autoSeatOwner,
	isMemberSeatedByUserId,
} from "@pengana/db/seat-queries";
import { z } from "zod";

import type { Context } from "./context";
import { apiError } from "./errors";

export const o = os.$context<Context>();

export function envelopeOutput<T extends z.ZodType>(dataSchema: T) {
	return z.object({ success: z.literal(true), data: dataSchema });
}

export function envelope<T>(data: T) {
	return { success: true as const, data };
}

export const publicProcedure = o;

const requireAuth = o.middleware(async ({ context, next }) => {
	if (!context.session?.user) {
		throw apiError("UNAUTHORIZED", context.t("unauthorized"));
	}
	return next({
		context: {
			session: context.session,
		},
	});
});

export const protectedProcedure = publicProcedure.use(requireAuth);

const requireSeat = o.middleware(async ({ context, next }) => {
	if (!context.session?.user) {
		throw apiError("UNAUTHORIZED", "Authentication required");
	}

	const userId = context.session.user.id;
	const orgId = context.session.session.activeOrganizationId;
	if (!orgId) {
		throw apiError("BAD_REQUEST", "No active organization");
	}

	let seated = await isMemberSeatedByUserId(orgId, userId);

	if (!seated) {
		// Auto-seat owner on first write (lazy bootstrap)
		seated = await autoSeatOwner(orgId, userId);
	}

	if (!seated) {
		throw apiError(
			"FORBIDDEN",
			"A seat is required for write operations. Contact your organization owner.",
		);
	}

	return next({ context: { session: context.session } });
});

export const seatedProcedure = protectedProcedure.use(requireSeat);
