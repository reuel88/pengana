export const orgQueryKeys = {
	activeOrg: ["auth", "active-organization"] as const,
	activeMember: ["auth", "active-member"] as const,
	listOrgs: ["auth", "list-organizations"] as const,
	teams: (orgId: string | undefined) => ["auth", "teams", orgId] as const,
	teamMembers: (teamId: string | undefined) =>
		["auth", "team-members", teamId] as const,
	userInvitations: ["auth", "user-invitations"] as const,
	invitation: (id: string) => ["auth", "invitation", id] as const,
};
