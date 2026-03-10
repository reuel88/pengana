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
}: AuthMutationOptions<T>): Promise<boolean> {
	setLoading?.(true);
	try {
		const { data, error } = await mutationFn();
		if (error) {
			const msg = error.message || errorMessage;
			notify ? notify.error(msg) : onError?.(msg);
			return false;
		}
		if (successMessage) {
			notify?.success(successMessage);
		}
		await onSuccess?.(data ?? null);
		return true;
	} catch {
		notify ? notify.error(errorMessage) : onError?.(errorMessage);
		return false;
	} finally {
		setLoading?.(false);
	}
}
