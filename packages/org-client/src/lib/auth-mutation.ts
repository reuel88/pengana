import type { AuthMutationOptions } from "../types";

export type { AuthMutationOptions, NotifyFn } from "../types";

export async function authMutation<T>({
	mutationFn,
	successMessage,
	errorMessage,
	onSuccess,
	setLoading,
	notify,
	onError,
}: AuthMutationOptions<T>) {
	setLoading?.(true);
	try {
		const { data, error } = await mutationFn();
		if (error) {
			const msg = error.message || errorMessage;
			notify ? notify.error(msg) : onError?.(msg);
			return;
		}
		if (successMessage) {
			notify?.success(successMessage);
		}
		await onSuccess?.(data ?? null);
	} catch {
		notify ? notify.error(errorMessage) : onError?.(errorMessage);
	} finally {
		setLoading?.(false);
	}
}
