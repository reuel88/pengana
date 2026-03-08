import { Redirect } from "expo-router";

import { Container } from "@/components/container";
import { authClient } from "@/lib/auth-client";
import { TodoPage } from "@/widgets/todo-page";

export default function TodosScreen() {
	const { data: session, isPending } = authClient.useSession();
	const userId = session?.user?.id;

	if (isPending) {
		return null;
	}

	if (!session || !userId) {
		return <Redirect href="/" />;
	}

	return (
		<Container>
			<TodoPage userId={userId} />
		</Container>
	);
}
