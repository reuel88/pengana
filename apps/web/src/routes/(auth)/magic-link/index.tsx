import { createFileRoute } from "@tanstack/react-router";
import { MagicLinkForm } from "@/features/auth/magic-link-form";

export const Route = createFileRoute("/(auth)/magic-link/")({
	component: MagicLinkForm,
	head: () => ({
		meta: [
			{ title: "Magic Link | pengana" },
			{
				name: "description",
				content: "Sign in to pengana with a magic link.",
			},
		],
	}),
});
