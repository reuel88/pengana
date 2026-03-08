import type { NotifyFn } from "@pengana/org-client/auth-mutation";
import { authMutation as coreAuthMutation } from "@pengana/org-client/auth-mutation";
import { Alert } from "react-native";

const notify: NotifyFn = {
	success: (message) => Alert.alert(message),
	error: (message) => Alert.alert(message),
};

export async function authMutation<T>(
	opts: Parameters<typeof coreAuthMutation<T>>[0] extends infer O
		? Omit<O, "notify">
		: never,
) {
	return coreAuthMutation<T>({ ...opts, notify });
}
