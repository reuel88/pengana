import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AuthErrorPage } from "@/features/auth/auth-error-page";
import { AuthLayout } from "@/widgets/auth-layout";

export const Route = createFileRoute("/(auth)/auth-error")({
	component: AuthErrorRoute,
	validateSearch: z.object({
		error: z.string().optional(),
		message: z.string().optional(),
	}),
	head: () => ({
		meta: [
			{ title: "Error | pengana" },
			{
				name: "description",
				content: "An authentication error occurred.",
			},
		],
	}),
});

function AuthErrorRoute() {
	return (
		<AuthLayout>
			<AuthErrorPage />
		</AuthLayout>
	);
}
