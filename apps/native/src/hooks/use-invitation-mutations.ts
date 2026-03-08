import { useTranslation } from "@pengana/i18n";
import { useMutation } from "@tanstack/react-query";
import { Alert } from "react-native";

import { useInvalidateOrg } from "@/hooks/use-org-queries";
import { authClient } from "@/lib/auth-client";

export function useInvitationMutations() {
	const { t } = useTranslation("organization");
	const { invalidateUserInvitations } = useInvalidateOrg();

	const acceptMutation = useMutation({
		mutationFn: async (invitationId: string) => {
			const { error } = await authClient.organization.acceptInvitation({
				invitationId,
			});
			if (error) throw error;
		},
		onSuccess: () => {
			Alert.alert(t("invitations.acceptSuccess"));
			invalidateUserInvitations();
		},
		onError: (error: { message?: string }) => {
			Alert.alert(t("invitations.error"), error.message);
		},
	});

	const rejectMutation = useMutation({
		mutationFn: async (invitationId: string) => {
			const { error } = await authClient.organization.rejectInvitation({
				invitationId,
			});
			if (error) throw error;
		},
		onSuccess: () => {
			Alert.alert(t("invitations.rejectSuccess"));
			invalidateUserInvitations();
		},
		onError: (error: { message?: string }) => {
			Alert.alert(t("invitations.error"), error.message);
		},
	});

	const cancelMutation = useMutation({
		mutationFn: async (invitationId: string) => {
			const { error } = await authClient.organization.cancelInvitation({
				invitationId,
			});
			if (error) throw error;
		},
		onSuccess: () => {
			Alert.alert(t("invitations.cancelSuccess"));
		},
		onError: (error: { message?: string }) => {
			Alert.alert(t("invitations.error"), error.message);
		},
	});

	const getMutatingId = (mutation: typeof acceptMutation) =>
		mutation.isPending ? mutation.variables : null;

	const isPendingFor = (invitationId: string) =>
		getMutatingId(acceptMutation) === invitationId ||
		getMutatingId(rejectMutation) === invitationId ||
		getMutatingId(cancelMutation) === invitationId;

	return {
		acceptMutation,
		rejectMutation,
		cancelMutation,
		isPendingFor,
	};
}
