import { useInvitationActions as useInvitationActionsBase } from "@pengana/org-client";
import { toast } from "sonner";

export function useInvitationActions({
	successMessage,
	errorMessage,
	rejectSuccessMessage,
	rejectErrorMessage,
	onAcceptSuccess,
	onRejectSuccess,
}: {
	successMessage: string;
	errorMessage: string;
	rejectSuccessMessage?: string;
	rejectErrorMessage?: string;
	onAcceptSuccess?: (invitationId: string) => void | Promise<void>;
	onRejectSuccess?: () => void | Promise<void>;
}) {
	return useInvitationActionsBase({
		onAcceptSuccess: async (invitationId) => {
			toast.success(successMessage);
			await onAcceptSuccess?.(invitationId);
		},
		onRejectSuccess: async () => {
			toast.success(rejectSuccessMessage ?? successMessage);
			await onRejectSuccess?.();
		},
		onError: (message) =>
			toast.error(message || rejectErrorMessage || errorMessage),
	});
}
