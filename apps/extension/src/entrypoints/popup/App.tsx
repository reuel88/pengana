import { env } from "@pengana/env/web";
import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { authClient } from "@/lib/auth-client";
import { TodoPage } from "@/widgets/todo-page";

function App() {
	const { data: session, isPending } = authClient.useSession();
	const { data: orgs, isPending: isOrgsPending } =
		authClient.useListOrganizations();
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
			<>
				<header className="flex w-full justify-end p-2">
					<LanguageSwitcher />
				</header>
				<div className="flex flex-col items-center justify-center gap-4 p-8">
					<p className="text-muted-foreground text-sm">{t("loginPrompt")}</p>
					<Button
						onClick={() =>
							browser.tabs.create({ url: `${env.VITE_WEB_URL}/login` })
						}
					>
						{t("loginButton")}
					</Button>
				</div>
			</>
		);
	}

	if (isOrgsPending) {
		return (
			<div className="flex items-center justify-center p-8">
				<p className="text-muted-foreground text-sm">{t("status.loading")}</p>
			</div>
		);
	}

	if (!orgs || orgs.length === 0) {
		return (
			<>
				<header className="flex w-full justify-end p-2">
					<LanguageSwitcher />
				</header>
				<div className="flex flex-col items-center justify-center gap-4 p-8">
					<p className="text-muted-foreground text-sm">
						{t("onboardingPrompt")}
					</p>
					<Button
						onClick={() =>
							browser.tabs.create({
								url: `${env.VITE_WEB_URL}/onboarding`,
							})
						}
					>
						{t("onboardingButton")}
					</Button>
				</div>
			</>
		);
	}

	return <TodoPage userId={session.user.id} />;
}

export default App;
