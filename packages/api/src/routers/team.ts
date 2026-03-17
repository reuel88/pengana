import { getTeamMembersAsAdmin, isOrgAdmin } from "@pengana/db/team-queries";
import { z } from "zod";

import { apiError } from "../errors";
import { envelope, envelopeOutput, protectedProcedure } from "../index";

export const teamRouter = {
	listTeamMembers: protectedProcedure
		.route({
			method: "GET",
			path: "/team/members",
			summary: "List team members (admin)",
		})
		.input(
			z.object({
				teamId: z.string(),
				organizationId: z.string(),
			}),
		)
		.output(
			envelopeOutput(z.array(z.object({ id: z.string(), userId: z.string() }))),
		)
		.handler(async ({ input, context }) => {
			const userId = context.session.user.id;

			const admin = await isOrgAdmin(input.organizationId, userId);
			if (!admin) {
				throw apiError("FORBIDDEN", "Only org admins can list team members");
			}

			const members = await getTeamMembersAsAdmin(
				input.teamId,
				input.organizationId,
			);
			if (!members) {
				throw apiError("NOT_FOUND", "Team not found in this organization");
			}

			return envelope(members);
		}),
};
