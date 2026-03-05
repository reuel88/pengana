import { updateTodoForUser } from "@finance-tool-poc/db/todo-queries";
import { syncInputSchema } from "@finance-tool-poc/sync-engine";
import { z } from "zod";

import { protectedProcedure } from "../index";
import { handleSync } from "./todo-sync";

export const todoRouter = {
	sync: protectedProcedure
		.input(syncInputSchema)
		.handler(async ({ input, context }) => {
			return handleSync(input, context.session.user.id, context.notifyUser);
		}),

	forceConflict: protectedProcedure
		.input(z.object({ todoId: z.string() }))
		.handler(async ({ input, context }) => {
			const userId = context.session.user.id;

			await updateTodoForUser(input.todoId, userId, {
				title: `[Server Edit] ${Date.now()}`,
				updatedAt: new Date(),
			});

			return { success: true };
		}),
};
