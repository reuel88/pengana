import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SignInForm } from "@/features/auth/sign-in-form";
import { redirectIfAuthenticated } from "@/shared/lib/auth-client";
import { AuthLayout } from "@/widgets/auth-layout";

export const Route = createFileRoute("/(auth)/login")({
	component: LoginPage,
	beforeLoad: redirectIfAuthenticated,
	validateSearch: z.object({
		invitationId: z.string().optional(),
	}),
	head: () => ({
		meta: [
			{ title: "Sign In | pengana" },
			{
				name: "description",
				content: "Sign in to your pengana account.",
			},
		],
	}),
});

function LoginPage() {
	return (
		<AuthLayout>
			<SignInForm />
		</AuthLayout>
	);
}
