import { updateTodoForScope } from "@pengana/db/todo-queries";
import { syncInputSchema, syncOutputSchema } from "@pengana/sync-engine";
import { z } from "zod";

import { envelope, envelopeOutput, seatedProcedure } from "../index";
import { handleTodoSync } from "./todo-sync";

export const todoRouter = {
	sync: seatedProcedure
		.route({ method: "POST", path: "/todo/sync", summary: "Sync todos" })
		.input(syncInputSchema)
		.output(envelopeOutput(syncOutputSchema))
		.handler(async ({ input, context }) => {
			const userId = context.session.user.id;
			const orgId = context.session.session.activeOrganizationId as string;
			return envelope(
				await handleTodoSync(
					input,
					"personal",
					userId,
					userId,
					orgId,
					context.notifyUser,
				),
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

			await updateTodoForScope(input.todoId, "personal", userId, {
				title: `[Server Edit] ${Date.now()}`,
				updatedAt: new Date(),
			});

			return envelope({ success: true });
		}),
};
