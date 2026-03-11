import type {
	AuthMutationOptions,
	NotifyFn,
} from "@pengana/org-client/lib/auth-mutation";
import { authMutation as coreAuthMutation } from "@pengana/org-client/lib/auth-mutation";
import { toast } from "sonner";

const notify: NotifyFn = {
	success: (message) => toast.success(message),
	error: (message) => toast.error(message),
};

export async function authMutation<T>(
	opts: Omit<AuthMutationOptions<T>, "notify">,
) {
	return coreAuthMutation<T>({ ...opts, notify });
}
