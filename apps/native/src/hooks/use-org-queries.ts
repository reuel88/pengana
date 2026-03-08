import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { authClient } from "@/lib/auth-client";

const STALE_TIME = 30_000;

export const orgQueryKeys = {
	activeOrg: ["auth", "active-organization"] as const,
	activeMember: ["auth", "active-member"] as const,
	listOrgs: ["auth", "list-organizations"] as const,
	invitation: (id: string) => ["auth", "invitation", id] as const,
	userInvitations: ["auth", "user-invitations"] as const,
	teams: (orgId: string | undefined) => ["auth", "teams", orgId] as const,
	teamMembers: (teamId: string | undefined) =>
		["auth", "team-members", teamId] as const,
};

export function useActiveOrg() {
	return useQuery({
		queryKey: orgQueryKeys.activeOrg,
		queryFn: async () => {
			const { data } = await authClient.organization.getFullOrganization();
			return data;
		},
		staleTime: STALE_TIME,
	});
}

export function useActiveMember() {
	return useQuery({
		queryKey: orgQueryKeys.activeMember,
		queryFn: async () => {
			const { data } = await authClient.organization.getActiveMember();
			return data;
		},
		staleTime: STALE_TIME,
	});
}

export function useListOrgs() {
	return useQuery({
		queryKey: orgQueryKeys.listOrgs,
		queryFn: async () => {
			const { data } = await authClient.organization.list();
			return data;
		},
		staleTime: STALE_TIME,
	});
}

export function useInvitation(invitationId: string) {
	return useQuery({
		queryKey: orgQueryKeys.invitation(invitationId),
		queryFn: async () => {
			const { data } = await authClient.organization.getInvitation({
				query: { id: invitationId },
			});
			return data;
		},
		enabled: !!invitationId,
		staleTime: STALE_TIME,
	});
}

export function useUserInvitations() {
	return useQuery({
		queryKey: orgQueryKeys.userInvitations,
		queryFn: async () => {
			const { data } = await authClient.organization.listUserInvitations();
			return data;
		},
		staleTime: STALE_TIME,
	});
}

export function useTeams(orgId: string | undefined) {
	return useQuery({
		queryKey: orgQueryKeys.teams(orgId),
		queryFn: async () => {
			const { data } = await authClient.organization.listTeams({
				query: { organizationId: orgId as string },
			});
			return data ?? [];
		},
		enabled: !!orgId,
		staleTime: STALE_TIME,
	});
}

export function useTeamMembers(teamId: string | undefined) {
	return useQuery({
		queryKey: orgQueryKeys.teamMembers(teamId),
		queryFn: async () => {
			const { data } = await authClient.organization.listTeamMembers({
				query: { teamId: teamId as string },
			});
			return data ?? [];
		},
		enabled: !!teamId,
		staleTime: STALE_TIME,
	});
}

export function useInvalidateOrg() {
	const queryClient = useQueryClient();

	const invalidateActiveOrg = useCallback(
		() => queryClient.invalidateQueries({ queryKey: orgQueryKeys.activeOrg }),
		[queryClient],
	);

	const invalidateActiveMember = useCallback(
		() =>
			queryClient.invalidateQueries({ queryKey: orgQueryKeys.activeMember }),
		[queryClient],
	);

	const invalidateListOrgs = useCallback(
		() => queryClient.invalidateQueries({ queryKey: orgQueryKeys.listOrgs }),
		[queryClient],
	);

	const invalidateInvitation = useCallback(
		(id: string) =>
			queryClient.invalidateQueries({
				queryKey: orgQueryKeys.invitation(id),
			}),
		[queryClient],
	);

	const invalidateUserInvitations = useCallback(
		() =>
			queryClient.invalidateQueries({
				queryKey: orgQueryKeys.userInvitations,
			}),
		[queryClient],
	);

	const invalidateTeams = useCallback(
		(orgId?: string) =>
			queryClient.invalidateQueries({ queryKey: orgQueryKeys.teams(orgId) }),
		[queryClient],
	);

	const invalidateTeamMembers = useCallback(
		(teamId: string) =>
			queryClient.invalidateQueries({
				queryKey: orgQueryKeys.teamMembers(teamId),
			}),
		[queryClient],
	);

	const invalidateAll = useCallback(
		() => queryClient.invalidateQueries({ queryKey: ["auth"], exact: false }),
		[queryClient],
	);

	return {
		invalidateActiveOrg,
		invalidateActiveMember,
		invalidateListOrgs,
		invalidateInvitation,
		invalidateUserInvitations,
		invalidateTeams,
		invalidateTeamMembers,
		invalidateAll,
	};
}
