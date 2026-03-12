import { createFileRoute } from "@tanstack/react-router";
import { SessionsList } from "@/features/auth/sessions-list";

export const Route = createFileRoute("/settings/sessions")({
	component: SessionsPage,
	head: () => ({
		meta: [
			{ title: "Sessions | pengana" },
			{
				name: "description",
				content: "View and manage your active sessions.",
			},
		],
	}),
});

function SessionsPage() {
	return <SessionsList />;
}
