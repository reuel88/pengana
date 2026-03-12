import { isMemberSeatedByUserId } from "@pengana/db/seat-queries";
import { updateTodoForUser } from "@pengana/db/todo-queries";
import { syncInputSchema, syncOutputSchema } from "@pengana/sync-engine";
import { z } from "zod";

import {
	envelope,
	envelopeOutput,
	protectedProcedure,
	seatedProcedure,
} from "../index";
import { handleSync } from "./todo-sync";

export const todoRouter = {
	sync: protectedProcedure
		.route({ method: "POST", path: "/todo/sync", summary: "Sync todos" })
		.input(syncInputSchema)
		.output(envelopeOutput(syncOutputSchema))
		.handler(async ({ input, context }) => {
			const userId = context.session.user.id;
			const orgId = context.session.session.activeOrganizationId;
			const isSeated = orgId
				? await isMemberSeatedByUserId(orgId, userId)
				: false;
			return envelope(
				await handleSync(input, userId, context.notifyUser, isSeated),
			);
		}),

	forceConflict: seatedProcedure
		.route({
			method: "POST",
			path: "/todo/force-conflict",
			summary: "Force a sync conflict (testing)",
		})
		.input(z.object({ todoId: z.string() }))
		.output(envelopeOutput(z.object({ success: z.boolean() })))
		.handler(async ({ input, context }) => {
			const userId = context.session.user.id;

			await updateTodoForUser(input.todoId, userId, {
				title: `[Server Edit] ${Date.now()}`,
				updatedAt: new Date(),
			});

			return envelope({ success: true });
		}),
};
