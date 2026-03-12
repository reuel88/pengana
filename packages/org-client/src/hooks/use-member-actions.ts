import { useState } from "react";

import { useAuthClient } from "../context/auth-client-context";
import { authMutation } from "../lib/auth-mutation";
import { useInvalidateOrg } from "./use-org-queries";

export function useMemberActions({
	onUpdateRoleSuccess,
	onRemoveSuccess,
	onLeaveSuccess,
	onError,
	errorMessages,
	removeMemberFn,
}: {
	onUpdateRoleSuccess?: () => void;
	onRemoveSuccess?: () => void;
	onLeaveSuccess?: () => void;
	onError?: (message: string) => void;
	errorMessages?: {
		updateRole?: string;
		remove?: string;
		leave?: string;
	};
	removeMemberFn?: (memberIdOrEmail: string) => Promise<unknown>;
}) {
	const authClient = useAuthClient();
	const { invalidateActiveOrg, invalidateActiveMember, invalidateAll } =
		useInvalidateOrg();
	const [actingId, setActingId] = useState<string | null>(null);

	const handleUpdateRole = async (memberId: string, role: string) => {
		setActingId(memberId);
		await authMutation({
			mutationFn: () =>
				authClient.organization.updateMemberRole({ memberId, role }),
			errorMessage: errorMessages?.updateRole ?? "Failed to update role",
			onSuccess: async () => {
				await Promise.all([invalidateActiveOrg(), invalidateActiveMember()]);
				await onUpdateRoleSuccess?.();
			},
			setLoading: (v) => {
				if (!v) setActingId(null);
			},
			onError,
		});
	};

	const handleRemove = async (memberIdOrEmail: string) => {
		setActingId(memberIdOrEmail);
		const mutationFn = removeMemberFn
			? async () => {
					try {
						await removeMemberFn(memberIdOrEmail);
						return { data: null, error: null };
					} catch (e) {
						return {
							data: null,
							error: {
								message: e instanceof Error ? e.message : "Unknown error",
							},
						};
					}
				}
			: () => authClient.organization.removeMember({ memberIdOrEmail });
		await authMutation({
			mutationFn,
			errorMessage: errorMessages?.remove ?? "Failed to remove member",
			onSuccess: async () => {
				await invalidateActiveOrg();
				await onRemoveSuccess?.();
			},
			setLoading: (v) => {
				if (!v) setActingId(null);
			},
			onError,
		});
	};

	const handleLeave = async (memberId: string) => {
		setActingId(memberId);
		await authMutation({
			mutationFn: () =>
				authClient.organization.removeMember({
					memberIdOrEmail: memberId,
				}),
			errorMessage: errorMessages?.leave ?? "Failed to leave organization",
			onSuccess: async () => {
				await invalidateAll();
				await onLeaveSuccess?.();
			},
			setLoading: (v) => {
				if (!v) setActingId(null);
			},
			onError,
		});
	};

	return { handleUpdateRole, handleRemove, handleLeave, actingId };
}
