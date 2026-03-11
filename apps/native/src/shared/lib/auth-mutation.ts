import type {
	AuthMutationOptions,
	NotifyFn,
} from "@pengana/org-client/lib/auth-mutation";
import { authMutation as coreAuthMutation } from "@pengana/org-client/lib/auth-mutation";
import { Alert } from "react-native";

const notify: NotifyFn = {
	success: (message) => Alert.alert("", message),
	error: (message) => Alert.alert("", message),
};

export async function authMutation<T>(
	opts: Omit<AuthMutationOptions<T>, "notify">,
) {
	return coreAuthMutation<T>({ ...opts, notify });
}
