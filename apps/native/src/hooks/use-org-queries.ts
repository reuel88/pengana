import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { authClient } from "@/lib/auth-client";

const STALE_TIME = 30_000;

export const orgQueryKeys = {
	activeOrg: ["auth", "active-organization"] as const,
	invitation: (id: string) => ["auth", "invitation", id] as const,
	userInvitations: ["auth", "user-invitations"] as const,
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

export function useInvalidateOrg() {
	const queryClient = useQueryClient();

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

	const invalidateAll = useCallback(
		() => queryClient.invalidateQueries({ queryKey: ["auth"], exact: false }),
		[queryClient],
	);

	return {
		invalidateInvitation,
		invalidateUserInvitations,
		invalidateAll,
	};
}
