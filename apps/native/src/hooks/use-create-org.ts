import { useCreateOrg as useCreateOrgBase } from "@pengana/org-client";
import { Alert } from "react-native";

export function useCreateOrg({
	errorMessage,
	onSuccess,
}: {
	errorMessage: string;
	onSuccess?: (orgId: string) => void | Promise<void>;
}) {
	return useCreateOrgBase({
		onSuccess: async (orgId) => {
			await onSuccess?.(orgId);
		},
		onError: (message) => Alert.alert("", message || errorMessage),
	});
}
