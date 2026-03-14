import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";
import { redirectIfAuthenticated } from "@/shared/lib/auth-client";

export const Route = createFileRoute("/(auth)/forgot-password")({
	component: ForgotPasswordPage,
	beforeLoad: redirectIfAuthenticated,
	validateSearch: z.object({
		invitationId: z.string().optional(),
	}),
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
