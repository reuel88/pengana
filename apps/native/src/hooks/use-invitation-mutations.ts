import { useTranslation } from "@pengana/i18n";
import { useMutation } from "@tanstack/react-query";
import { Alert } from "react-native";

import { useInvalidateOrg } from "@/hooks/use-org-queries";
import { authClient } from "@/lib/auth-client";

export function useInvitationMutations() {
	const { t } = useTranslation("organization");
	const { invalidateUserInvitations, invalidateActiveOrg } = useInvalidateOrg();

	const makeMutationFn = (
		action: (params: { invitationId: string }) => Promise<{ error: unknown }>,
	) => {
		return async (invitationId: string) => {
			const { error } = await action({ invitationId });
			if (error) throw error;
		};
	};

	const onError = (error: unknown) => {
		const msg =
			error instanceof Error
				? error.message
				: typeof error === "string"
					? error
					: t("invitations.unknownError");
		Alert.alert(t("invitations.error"), msg);
	};

	const acceptMutation = useMutation({
		mutationFn: makeMutationFn(authClient.organization.acceptInvitation),
		onSuccess: () => {
			Alert.alert(t("invitations.acceptSuccess"));
			invalidateUserInvitations();
		},
		onError,
	});

	const rejectMutation = useMutation({
		mutationFn: makeMutationFn(authClient.organization.rejectInvitation),
		onSuccess: () => {
			Alert.alert(t("invitations.rejectSuccess"));
			invalidateUserInvitations();
		},
		onError,
	});

	const cancelMutation = useMutation({
		mutationFn: makeMutationFn(authClient.organization.cancelInvitation),
		onSuccess: () => {
			Alert.alert(t("invitations.cancelSuccess"));
			invalidateActiveOrg();
		},
		onError,
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
