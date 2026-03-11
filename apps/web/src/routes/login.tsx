import { createFileRoute } from "@tanstack/react-router";
import { SignInForm } from "@/features/auth/sign-in-form";
import { AuthLayout } from "@/widgets/auth-layout";

export const Route = createFileRoute("/login")({
	component: LoginPage,
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
