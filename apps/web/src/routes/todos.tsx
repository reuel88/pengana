import { createFileRoute } from "@tanstack/react-router";

import { requireAuth } from "@/lib/auth-client";
import { TodoPage } from "@/widgets/todo-page";

export const Route = createFileRoute("/todos")({
	component: TodosPage,
	beforeLoad: requireAuth,
});

function TodosPage() {
	const { session } = Route.useRouteContext();
	const userId = session.data.user.id;

	return <TodoPage userId={userId} />;
}
