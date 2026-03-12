import { useNavigate } from "@tanstack/react-router";
import { queryClient } from "@/shared/api/orpc";
import { authClient } from "@/shared/lib/auth-client";

export function useSignOut(redirectTo = "/") {
	const navigate = useNavigate();

	return () => {
		authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					queryClient.clear();
					navigate({ to: redirectTo });
				},
			},
		});
	};
}
