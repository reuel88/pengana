import { and, eq } from "drizzle-orm";

import { db } from "./index";
import { member, team, teamMember } from "./schema/auth";

export async function isOrgAdmin(
	organizationId: string,
	userId: string,
): Promise<boolean> {
	const row = await db
		.select({ role: member.role })
		.from(member)
		.where(
			and(eq(member.organizationId, organizationId), eq(member.userId, userId)),
		)
		.limit(1)
		.then((rows) => rows[0]);

	return !!row && ["admin", "owner"].includes(row.role);
}

export async function addTeamMember(teamId: string, userId: string) {
	await db.insert(teamMember).values({
		id: crypto.randomUUID(),
		teamId,
		userId,
		createdAt: new Date(),
	});
}

export async function deleteTeamById(teamId: string) {
	await db.delete(team).where(eq(team.id, teamId));
}

export async function getTeamMembersAsAdmin(
	teamId: string,
	organizationId: string,
): Promise<{ id: string; userId: string }[] | null> {
	// Verify team belongs to the org
	const teamRow = await db
		.select({ id: team.id })
		.from(team)
		.where(and(eq(team.id, teamId), eq(team.organizationId, organizationId)))
		.limit(1)
		.then((rows) => rows[0]);

	if (!teamRow) {
		return null;
	}

	return db
		.select({ id: teamMember.id, userId: teamMember.userId })
		.from(teamMember)
		.where(eq(teamMember.teamId, teamId));
}
