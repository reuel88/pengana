import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "@/components/auth-layout";
import { SignUpForm } from "@/components/sign-up-form";

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
