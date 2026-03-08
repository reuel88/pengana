import type { NotifyFn } from "@pengana/org-client/auth-mutation";
import { authMutation as coreAuthMutation } from "@pengana/org-client/auth-mutation";
import { toast } from "sonner";

const notify: NotifyFn = {
	success: (message) => toast.success(message),
	error: (message) => toast.error(message),
};

export async function authMutation<T>(
	opts: Parameters<typeof coreAuthMutation<T>>[0] extends infer O
		? Omit<O, "notify">
		: never,
) {
	return coreAuthMutation<T>({ ...opts, notify });
}
