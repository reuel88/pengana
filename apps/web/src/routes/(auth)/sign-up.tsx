import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SignUpForm } from "@/features/auth/sign-up-form";
import { redirectIfAuthenticated } from "@/shared/lib/auth-client";
import { AuthLayout } from "@/widgets/auth-layout";

export const Route = createFileRoute("/(auth)/sign-up")({
	component: SignUpPage,
	beforeLoad: redirectIfAuthenticated,
	validateSearch: z.object({
		invitationId: z.string().optional(),
	}),
	head: () => ({
		meta: [
			{ title: "Sign Up | pengana" },
			{
				name: "description",
				content: "Create a new pengana account.",
			},
		],
	}),
});

function SignUpPage() {
	return (
		<AuthLayout>
			<SignUpForm />
		</AuthLayout>
	);
}
