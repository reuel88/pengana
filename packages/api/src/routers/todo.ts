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
			return envelope(await handleSync(input, userId, context.notifyUser));
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
