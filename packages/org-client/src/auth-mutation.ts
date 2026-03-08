export interface NotifyFn {
	success: (message: string) => void;
	error: (message: string) => void;
}

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
	notify,
}: AuthMutationOptions<T> & { notify: NotifyFn }) {
	setLoading?.(true);
	try {
		const { data, error } = await mutationFn();
		if (error) {
			notify.error(error.message || errorMessage);
			return;
		}
		if (successMessage) {
			notify.success(successMessage);
		}
		await onSuccess?.(data ?? null);
	} catch {
		notify.error(errorMessage);
	} finally {
		setLoading?.(false);
	}
}
