import { queryClient } from "@/shared/api/orpc";
import { authClient } from "@/shared/lib/auth-client";

export function useSignOut() {
	return async () => {
		await authClient.signOut();
		queryClient.clear();
	};
}
