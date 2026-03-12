import { createFileRoute } from "@tanstack/react-router";
import { MagicLinkForm } from "@/features/auth/magic-link-form";
import { AuthLayout } from "@/widgets/auth-layout";

export const Route = createFileRoute("/(auth)/magic-link/")({
	component: MagicLinkPage,
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

function MagicLinkPage() {
	return (
		<AuthLayout>
			<MagicLinkForm />
		</AuthLayout>
	);
}
