import { os } from "@orpc/server";
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
