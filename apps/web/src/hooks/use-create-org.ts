import { useCreateOrg as useCreateOrgBase } from "@pengana/org-client";
import { toast } from "sonner";

export function useCreateOrg({
	successMessage,
	errorMessage,
	onSuccess,
}: {
	successMessage: string;
	errorMessage: string;
	onSuccess?: () => void | Promise<void>;
}) {
	const base = useCreateOrgBase({
		onSuccess: async () => {
			if (successMessage) toast.success(successMessage);
			await onSuccess?.();
		},
		onError: (message) => toast.error(message || errorMessage),
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await base.handleSubmit();
	};

	return { ...base, handleSubmit };
}
