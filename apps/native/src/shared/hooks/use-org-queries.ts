import {
	orgQueryKeys,
	useAuthClient,
	useOrgRole,
	useOrgSettings,
} from "@pengana/org-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

const STALE_TIME = 30_000;

export { orgQueryKeys, useOrgRole, useOrgSettings };

async function unwrapAuth<T>(
	promise: Promise<{ data?: T | null; error?: unknown }>,
): Promise<T> {
	const { data, error } = await promise;
	if (error) throw error;
	return data as T;
}

export function useActiveOrg() {
	const authClient = useAuthClient();
	return useQuery({
		queryKey: orgQueryKeys.activeOrg,
		queryFn: () => unwrapAuth(authClient.organization.getFullOrganization()),
		staleTime: STALE_TIME,
	});
}

export function useActiveMember() {
	const authClient = useAuthClient();
	return useQuery({
		queryKey: orgQueryKeys.activeMember,
		queryFn: () => unwrapAuth(authClient.organization.getActiveMember()),
		staleTime: STALE_TIME,
	});
}

export function useListOrgs() {
	const authClient = useAuthClient();
	return useQuery({
		queryKey: orgQueryKeys.listOrgs,
		queryFn: () => unwrapAuth(authClient.organization.list()),
		staleTime: STALE_TIME,
	});
}

export function useTeams(orgId: string | undefined) {
	const authClient = useAuthClient();
	return useQuery({
		queryKey: orgQueryKeys.teams(orgId),
		queryFn: async () =>
			(await unwrapAuth(
				authClient.organization.listTeams({
					query: { organizationId: orgId as string },
				}),
			)) ?? [],
		enabled: !!orgId,
		staleTime: STALE_TIME,
	});
}

export function useTeamMembers(teamId: string | undefined) {
	const authClient = useAuthClient();
	return useQuery({
		queryKey: orgQueryKeys.teamMembers(teamId),
		queryFn: async () =>
			(await unwrapAuth(
				authClient.organization.listTeamMembers({
					query: { teamId: teamId as string },
				}),
			)) ?? [],
		enabled: !!teamId,
		staleTime: STALE_TIME,
	});
}

export function useUserInvitations() {
	const authClient = useAuthClient();
	return useQuery({
		queryKey: orgQueryKeys.userInvitations,
		queryFn: () => unwrapAuth(authClient.organization.listUserInvitations()),
		staleTime: STALE_TIME,
	});
}

export function useInvitation(invitationId: string) {
	const authClient = useAuthClient();
	return useQuery({
		queryKey: orgQueryKeys.invitation(invitationId),
		queryFn: () =>
			unwrapAuth(
				authClient.organization.getInvitation({
					query: { id: invitationId },
				}),
			),
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
