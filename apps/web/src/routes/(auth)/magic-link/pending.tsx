import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { MagicLinkPending } from "@/features/auth/magic-link-pending";

export const Route = createFileRoute("/(auth)/magic-link/pending")({
	component: MagicLinkPending,
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
