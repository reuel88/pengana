import { updateOrgTodoForOrg } from "@pengana/db/org-todo-queries";
import { syncInputSchema, syncOutputSchema } from "@pengana/sync-engine";
import { z } from "zod";

import { apiError } from "../errors";
import { envelope, envelopeOutput, seatedProcedure } from "../index";
import { handleOrgSync } from "./org-todo-sync";

export const orgTodoRouter = {
	sync: seatedProcedure
		.route({
			method: "POST",
			path: "/org-todo/sync",
			summary: "Sync organization todos",
		})
		.input(syncInputSchema)
		.output(envelopeOutput(syncOutputSchema))
		.handler(async ({ input, context }) => {
			const userId = context.session.user.id;
			const orgId = context.session.session.activeOrganizationId;
			if (!orgId) throw apiError("BAD_REQUEST", "No active organization");
			return envelope(
				await handleOrgSync(input, orgId, userId, context.notifyOrgMembers),
			);
		}),

	forceConflict: seatedProcedure
		.route({
			method: "POST",
			path: "/org-todo/force-conflict",
			summary: "Force an org todo sync conflict (testing)",
		})
		.input(z.object({ todoId: z.string() }))
		.output(envelopeOutput(z.object({ success: z.boolean() })))
		.handler(async ({ input, context }) => {
			const orgId = context.session.session.activeOrganizationId;
			if (!orgId) throw apiError("BAD_REQUEST", "No active organization");

			await updateOrgTodoForOrg(input.todoId, orgId, {
				title: `[Server Edit] ${Date.now()}`,
				updatedAt: new Date(),
			});

			return envelope({ success: true });
		}),
};
