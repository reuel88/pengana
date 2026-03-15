import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export const Route = createFileRoute("/(auth)/reset-password")({
	component: ResetPasswordForm,
	validateSearch: z.object({
		token: z.string().optional(),
		error: z.string().optional(),
	}),
	head: () => ({
		meta: [
			{ title: "Reset Password | pengana" },
			{
				name: "description",
				content: "Set a new password for your pengana account.",
			},
		],
	}),
});
