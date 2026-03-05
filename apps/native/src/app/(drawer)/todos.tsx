import { Redirect } from "expo-router";

import { Container } from "@/components/container";
import { authClient } from "@/lib/auth-client";
import { TodoPage } from "@/widgets/todo-page";

export default function TodosScreen() {
	const { data: session } = authClient.useSession();
	const userId = session?.user?.id;

	if (!session) {
		return <Redirect href="/" />;
	}

	if (!userId) return null;

	return (
		<Container>
			<TodoPage userId={userId} />
		</Container>
	);
}
