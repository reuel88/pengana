import { type SupportedLocale, useTranslation } from "@pengana/i18n";
import {
	LOCALE_STORAGE_KEY_WEB,
	persistLocale,
} from "@pengana/i18n/persistence";
import { deLocalizeUrl, localizeUrl } from "@pengana/i18n/web";
import { LanguageSwitcher as LanguageSwitcherBase } from "@pengana/ui/components/language-switcher";
import { useRouterState } from "@tanstack/react-router";

export function LanguageSwitcher() {
	const { i18n } = useTranslation();
	const routerState = useRouterState();

	const handleChange = (locale: SupportedLocale) => {
		persistLocale(i18n, locale, LOCALE_STORAGE_KEY_WEB);
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
