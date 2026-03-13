import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export const Route = createFileRoute("/(auth)/forgot-password")({
	component: ForgotPasswordPage,
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
