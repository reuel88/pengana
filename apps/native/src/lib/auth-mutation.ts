import { Alert } from "react-native";

interface AuthMutationOptions<T> {
	mutationFn: () => Promise<{
		data?: T | null;
		error?: { message?: string } | null;
	}>;
	successMessage?: string;
	errorMessage: string;
	// biome-ignore lint/suspicious/noConfusingVoidType: callbacks may return void or a Promise
	onSuccess?: (data: T | null) => void | Promise<unknown>;
	setLoading?: (loading: boolean) => void;
}

export async function authMutation<T>({
	mutationFn,
	successMessage,
	errorMessage,
	onSuccess,
	setLoading,
}: AuthMutationOptions<T>) {
	setLoading?.(true);
	try {
		const { data, error } = await mutationFn();
		if (error) {
			Alert.alert(error.message || errorMessage);
			return;
		}
		if (successMessage) {
			Alert.alert(successMessage);
		}
		await onSuccess?.(data as T);
	} catch {
		Alert.alert(errorMessage);
	} finally {
		setLoading?.(false);
	}
}
