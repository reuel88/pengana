import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { MagicLinkPending } from "@/features/auth/magic-link-pending";
import { AuthLayout } from "@/widgets/auth-layout";

export const Route = createFileRoute("/(auth)/magic-link/pending")({
	component: MagicLinkPendingPage,
	validateSearch: z.object({
		email: z.string().optional(),
	}),
	head: () => ({
		meta: [
			{ title: "Check Your Email | pengana" },
			{
				name: "description",
				content: "Check your email for a magic link to sign in.",
			},
		],
	}),
});

function MagicLinkPendingPage() {
	return (
		<AuthLayout>
			<MagicLinkPending />
		</AuthLayout>
	);
}
