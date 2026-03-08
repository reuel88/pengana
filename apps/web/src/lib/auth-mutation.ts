import { toast } from "sonner";

interface AuthMutationOptions<T> {
	mutationFn: () => Promise<{
		data?: T | null;
		error?: { message?: string } | null;
	}>;
	successMessage: string;
	errorMessage: string;
	onSuccess?: (data: T | null) => undefined | Promise<unknown>;
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
			toast.error(error.message || errorMessage);
			return;
		}
		toast.success(successMessage);
		await onSuccess?.(data as T);
	} catch {
		toast.error(errorMessage);
	} finally {
		setLoading?.(false);
	}
}
