import { env } from "@pengana/env/web";
import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { authClient } from "@/lib/auth-client";
import { TodoPage } from "@/widgets/todo-page";

function LoadingState() {
	const { t } = useTranslation();
	return (
		<div className="flex items-center justify-center p-8">
			<p className="text-muted-foreground text-sm">{t("status.loading")}</p>
		</div>
	);
}

function ActionPrompt({
	messageKey,
	buttonKey,
	url,
}: {
	messageKey: string;
	buttonKey: string;
	url: string;
}) {
	const { t } = useTranslation();
	return (
		<>
			<header className="flex w-full justify-end p-2">
				<LanguageSwitcher />
			</header>
			<div className="flex flex-col items-center justify-center gap-4 p-8">
				<p className="text-muted-foreground text-sm">{t(messageKey)}</p>
				<Button onClick={() => browser.tabs.create({ url })}>
					{t(buttonKey)}
				</Button>
			</div>
		</>
	);
}

function App() {
	const { data: session, isPending } = authClient.useSession();
	const { data: orgs, isPending: isOrgsPending } =
		authClient.useListOrganizations();

	if (isPending) return <LoadingState />;

	if (!session) {
		return (
			<ActionPrompt
				messageKey="loginPrompt"
				buttonKey="loginButton"
				url={`${env.VITE_WEB_URL}/login`}
			/>
		);
	}

	if (isOrgsPending) return <LoadingState />;

	if (!orgs || orgs.length === 0) {
		return (
			<ActionPrompt
				messageKey="onboardingPrompt"
				buttonKey="onboardingButton"
				url={`${env.VITE_WEB_URL}/onboarding`}
			/>
		);
	}

	return <TodoPage userId={session.user.id} />;
}

export default App;
