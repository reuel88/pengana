import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { MagicLinkCallback } from "@/features/auth/magic-link-callback";

export const Route = createFileRoute("/(auth)/magic-link/verify")({
	component: MagicLinkCallback,
	validateSearch: z.object({
		token: z.string().optional(),
	}),
	head: () => ({
		meta: [
			{ title: "Sign In | pengana" },
			{
				name: "description",
				content: "Completing magic link sign in.",
			},
		],
	}),
});
