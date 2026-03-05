import { authClient } from "@/lib/auth-client";
import { TodoPage } from "@/widgets/todo-page";

function App() {
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return (
			<div className="flex items-center justify-center p-8">
				<p className="text-muted-foreground text-sm">Loading...</p>
			</div>
		);
	}

	if (!session) {
		return (
			<div className="flex items-center justify-center p-8">
				<p className="text-muted-foreground text-sm">
					Please log in at the web app first.
				</p>
			</div>
		);
	}

	return <TodoPage userId={session.user.id} />;
}

export default App;
