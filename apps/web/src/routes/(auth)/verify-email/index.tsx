import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { VerifyEmailPending } from "@/features/auth/verify-email-pending";

export const Route = createFileRoute("/(auth)/verify-email/")({
	component: VerifyEmailPending,
	validateSearch: z.object({
		email: z.string().optional(),
		invitationId: z.string().optional(),
	}),
	head: () => ({
		meta: [
			{ title: "Verify Email | pengana" },
			{
				name: "description",
				content: "Verify your pengana account email address.",
			},
		],
	}),
});
