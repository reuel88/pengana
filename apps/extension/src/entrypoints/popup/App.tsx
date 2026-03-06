import { useTranslation } from "@pengana/i18n";
import { authClient } from "@/lib/auth-client";
import { TodoPage } from "@/widgets/todo-page";

function App() {
	const { data: session, isPending } = authClient.useSession();
	const { t } = useTranslation();

	if (isPending) {
		return (
			<div className="flex items-center justify-center p-8">
				<p className="text-muted-foreground text-sm">{t("status.loading")}</p>
			</div>
		);
	}

	if (!session) {
		return (
			<div className="flex items-center justify-center p-8">
				<p className="text-muted-foreground text-sm">{t("loginPrompt")}</p>
			</div>
		);
	}

	return <TodoPage userId={session.user.id} />;
}

export default App;
