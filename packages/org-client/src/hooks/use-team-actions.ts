import { useState } from "react";

import { useAuthClient } from "../context/auth-client-context";
import { authMutation } from "../lib/auth-mutation";
import { useInvalidateOrg } from "./use-org-queries";

export function useTeamNameEditor({
	onSuccess,
	onError,
}: {
	onSuccess?: () => void;
	onError?: (message: string) => void;
}) {
	const authClient = useAuthClient();
	const { invalidateTeams } = useInvalidateOrg();
	const [editing, setEditing] = useState(false);
	const [newName, setNewName] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSave = async (teamId: string, orgId: string) => {
		const trimmed = newName.trim();
		if (!trimmed) return;

		await authMutation({
			mutationFn: () =>
				authClient.organization.updateTeam({
					teamId,
					data: { name: trimmed },
				}),
			errorMessage: "Failed to update team name",
			onSuccess: async () => {
				await invalidateTeams(orgId);
				setEditing(false);
				await onSuccess?.();
			},
			setLoading,
			onError,
		});
	};

	return { editing, setEditing, newName, setNewName, handleSave, loading };
}

export function useTeamMemberAdd({
	onSuccess,
	onError,
}: {
	onSuccess?: () => void;
	onError?: (message: string) => void;
}) {
	const authClient = useAuthClient();
	const { invalidateTeamMembers } = useInvalidateOrg();
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);

	const handleAdd = async (
		teamId: string,
		members: Array<{ userId: string; user: { email: string } }>,
	) => {
		const member = members.find((m) => m.user.email === email);
		if (!member) {
			onError?.("Member not found");
			return;
		}

		await authMutation({
			mutationFn: () =>
				authClient.organization.addTeamMember({
					teamId,
					userId: member.userId,
				}),
			errorMessage: "Failed to add team member",
			onSuccess: async () => {
				setEmail("");
				await invalidateTeamMembers(teamId);
				await onSuccess?.();
			},
			setLoading,
			onError,
		});
	};

	return { email, setEmail, handleAdd, loading };
}

export function useTeamActions({
	onDeleteSuccess,
	onRemoveMemberSuccess,
	onError,
}: {
	onDeleteSuccess?: () => void;
	onRemoveMemberSuccess?: () => void;
	onError?: (message: string) => void;
}) {
	const authClient = useAuthClient();
	const { invalidateTeams, invalidateTeamMembers } = useInvalidateOrg();
	const [actingId, setActingId] = useState<string | null>(null);

	const handleDeleteTeam = async (teamId: string, orgId: string) => {
		setActingId(teamId);
		await authMutation({
			mutationFn: () => authClient.organization.removeTeam({ teamId }),
			errorMessage: "Failed to delete team",
			onSuccess: async () => {
				await invalidateTeams(orgId);
				await onDeleteSuccess?.();
			},
			setLoading: (v) => {
				if (!v) setActingId(null);
			},
			onError,
		});
	};

	const handleRemoveMember = async (teamId: string, userId: string) => {
		setActingId(userId);
		await authMutation({
			mutationFn: () =>
				authClient.organization.removeTeamMember({ teamId, userId }),
			errorMessage: "Failed to remove team member",
			onSuccess: async () => {
				await invalidateTeamMembers(teamId);
				await onRemoveMemberSuccess?.();
			},
			setLoading: (v) => {
				if (!v) setActingId(null);
			},
			onError,
		});
	};

	return { handleDeleteTeam, handleRemoveMember, actingId };
}
