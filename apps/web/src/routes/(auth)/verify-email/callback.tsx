import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { VerifyEmailCallback } from "@/features/auth/verify-email-callback";
import { AuthLayout } from "@/widgets/auth-layout";

export const Route = createFileRoute("/(auth)/verify-email/callback")({
	component: VerifyEmailCallbackPage,
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

function VerifyEmailCallbackPage() {
	return (
		<AuthLayout>
			<VerifyEmailCallback />
		</AuthLayout>
	);
}
