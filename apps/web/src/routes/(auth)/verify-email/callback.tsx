import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { VerifyEmailCallback } from "@/features/auth/verify-email-callback";

export const Route = createFileRoute("/(auth)/verify-email/callback")({
	component: VerifyEmailCallback,
	validateSearch: z.object({
		token: z.string().optional(),
	}),
	head: () => ({
		meta: [
			{ title: "Verify Email | pengana" },
			{
				name: "description",
				content: "Verifying your email address.",
			},
		],
	}),
});
