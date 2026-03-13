import { Redirect } from "expo-router";
import { authClient } from "@/shared/lib/auth-client";
import { Container } from "@/shared/ui/container";
import { TodoPage } from "@/widgets/todo-page";

export default function TodosScreen() {
	const { data: session, isPending } = authClient.useSession();
	const userId = session?.user?.id;
	const organizationId = session?.session?.activeOrganizationId ?? undefined;

	if (isPending) {
		return null;
	}

	if (!session || !userId) {
		return <Redirect href="/" />;
	}

	return (
		<Container>
			<TodoPage userId={userId} organizationId={organizationId} />
		</Container>
	);
}
