import { createFileRoute } from "@tanstack/react-router";
import { SignUpForm } from "@/features/auth/sign-up-form";
import { AuthLayout } from "@/widgets/auth-layout";

export const Route = createFileRoute("/sign-up")({
	component: SignUpPage,
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
