import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export const Route = createFileRoute("/(auth)/forgot-password")({
	component: ForgotPasswordPage,
	head: () => ({
		meta: [
			{ title: "Forgot Password | pengana" },
			{
				name: "description",
				content: "Reset your pengana account password.",
			},
		],
	}),
});

function ForgotPasswordPage() {
	return <ForgotPasswordForm />;
}
