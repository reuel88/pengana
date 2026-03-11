import { type SupportedLocale, useTranslation } from "@pengana/i18n";
import { deLocalizeUrl, localizeUrl } from "@pengana/i18n/web";
import { LanguageSwitcher as LanguageSwitcherBase } from "@pengana/ui/components/language-switcher";
import { useRouterState } from "@tanstack/react-router";

export function LanguageSwitcher() {
	const { i18n } = useTranslation();
	const routerState = useRouterState();

	const handleChange = (locale: SupportedLocale) => {
		i18n.changeLanguage(locale);
		localStorage.setItem("i18nextLng", locale);
		const cleanPath = deLocalizeUrl(routerState.location.pathname);
		window.location.pathname = localizeUrl(cleanPath, locale);
	};

	return (
		<LanguageSwitcherBase
			currentLocale={i18n.language as SupportedLocale}
			onLocaleChange={handleChange}
		/>
	);
}
