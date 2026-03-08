import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { useAuthClient } from "./auth-client-context";
import { orgQueryKeys } from "./org-query-keys";

const STALE_TIME = 30_000;

export function useActiveOrg() {
	const authClient = useAuthClient();
	return useQuery({
		queryKey: orgQueryKeys.activeOrg,
		queryFn: async () => {
			const { data, error } =
				await authClient.organization.getFullOrganization();
			if (error) throw error;
			return data;
		},
		staleTime: STALE_TIME,
	});
}

export function useActiveMember() {
	const authClient = useAuthClient();
	return useQuery({
		queryKey: orgQueryKeys.activeMember,
		queryFn: async () => {
			const { data, error } = await authClient.organization.getActiveMember();
			if (error) throw error;
			return data;
		},
		staleTime: STALE_TIME,
	});
}

export function useListOrgs() {
	const authClient = useAuthClient();
	return useQuery({
		queryKey: orgQueryKeys.listOrgs,
		queryFn: async () => {
			const { data, error } = await authClient.organization.list();
			if (error) throw error;
			return data;
		},
		staleTime: STALE_TIME,
	});
}

export function useTeams(orgId: string | undefined) {
	const authClient = useAuthClient();
	return useQuery({
		queryKey: orgQueryKeys.teams(orgId),
		queryFn: async () => {
			const { data, error } = await authClient.organization.listTeams({
				query: { organizationId: orgId as string },
			});
			if (error) throw error;
			return data ?? [];
		},
		enabled: !!orgId,
		staleTime: STALE_TIME,
	});
}

export function useTeamMembers(teamId: string | undefined) {
	const authClient = useAuthClient();
	return useQuery({
		queryKey: orgQueryKeys.teamMembers(teamId),
		queryFn: async () => {
			const { data, error } = await authClient.organization.listTeamMembers({
				query: { teamId: teamId as string },
			});
			if (error) throw error;
			return data ?? [];
		},
		enabled: !!teamId,
		staleTime: STALE_TIME,
	});
}

export function useUserInvitations() {
	const authClient = useAuthClient();
	return useQuery({
		queryKey: orgQueryKeys.userInvitations,
		queryFn: async () => {
			const { data, error } =
				await authClient.organization.listUserInvitations();
			if (error) throw error;
			return data;
		},
		staleTime: STALE_TIME,
	});
}

export function useInvitation(invitationId: string) {
	const authClient = useAuthClient();
	return useQuery({
		queryKey: orgQueryKeys.invitation(invitationId),
		queryFn: async () => {
			const { data, error } = await authClient.organization.getInvitation({
				query: { id: invitationId },
			});
			if (error) throw error;
			return data;
		},
		enabled: !!invitationId,
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

	const invalidateUserInvitations = useCallback(
		() =>
			queryClient.invalidateQueries({
				queryKey: orgQueryKeys.userInvitations,
			}),
		[queryClient],
	);

	const invalidateInvitation = useCallback(
		(id: string) =>
			queryClient.invalidateQueries({
				queryKey: orgQueryKeys.invitation(id),
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
		invalidateTeams,
		invalidateTeamMembers,
		invalidateUserInvitations,
		invalidateInvitation,
		invalidateAll,
	};
}
