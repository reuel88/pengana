import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "@/components/auth-layout";
import { SignInForm } from "@/components/sign-in-form";

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
