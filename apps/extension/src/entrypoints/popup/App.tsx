import { env } from "@pengana/env/web";
import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/features/i18n/language-switcher.tsx";
import { ModeToggle } from "@/features/theme/mode-toggle";
import { OrgDesignPresetSync } from "@/features/theme/org-design-preset-sync";
import { authClient } from "@/shared/lib/auth-client";
import { TodoPage } from "@/widgets/todo-page";

function LoadingState() {
	const { t } = useTranslation();
	return (
		<div className="flex items-center justify-center p-8">
			<p className="text-muted-foreground text-sm">{t("status.loading")}</p>
		</div>
	);
}

type ActionPromptProps = {
	messageKey: "loginPrompt" | "onboardingPrompt" | "common:error.generic";
	buttonKey: "loginButton" | "onboardingButton" | "common:error.retry";
} & ({ url: string; onAction?: never } | { onAction: () => void; url?: never });

function ActionPrompt({
	messageKey,
	buttonKey,
	url,
	onAction,
}: ActionPromptProps) {
	const { t } = useTranslation();
	const handleClick = onAction ?? (() => browser.tabs.create({ url }));
	return (
		<>
			<header className="flex w-full justify-end p-2">
				<div className="flex items-center gap-2">
					<ModeToggle />
					<LanguageSwitcher />
				</div>
			</header>
			<div className="flex flex-col items-center justify-center gap-4 p-8">
				<p className="text-muted-foreground text-sm">{t(messageKey)}</p>
				<Button onClick={handleClick}>{t(buttonKey)}</Button>
			</div>
		</>
	);
}

function App() {
	const { data: session, isPending } = authClient.useSession();
	const {
		data: orgs,
		isPending: isOrgsPending,
		error: orgsError,
		refetch: refetchOrgs,
	} = authClient.useListOrganizations();

	let content: ReactNode;

	if (isPending) {
		content = <LoadingState />;
	} else if (!session) {
		content = (
			<ActionPrompt
				messageKey="loginPrompt"
				buttonKey="loginButton"
				url={`${env.VITE_WEB_URL}/login`}
			/>
		);
	} else if (isOrgsPending) {
		content = <LoadingState />;
	} else if (orgsError) {
		content = (
			<ActionPrompt
				messageKey="common:error.generic"
				buttonKey="common:error.retry"
				onAction={() => refetchOrgs()}
			/>
		);
	} else if (!Array.isArray(orgs) || orgs.length === 0) {
		content = (
			<ActionPrompt
				messageKey="onboardingPrompt"
				buttonKey="onboardingButton"
				url={`${env.VITE_WEB_URL}/onboarding`}
			/>
		);
	} else {
		content = (
			<TodoPage
				userId={session.user.id}
				organizationId={session.session.activeOrganizationId ?? undefined}
			/>
		);
	}

	return (
		<>
			<OrgDesignPresetSync />
			{content}
		</>
	);
}

export default App;
