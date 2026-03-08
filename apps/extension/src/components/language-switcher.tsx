import { type SupportedLocale, useTranslation } from "@pengana/i18n";
import { LanguageSwitcher as LanguageSwitcherBase } from "@pengana/ui/components/language-switcher";

export function LanguageSwitcher() {
	const { i18n } = useTranslation();

	const handleChange = (locale: SupportedLocale) => {
		localStorage.setItem("locale", locale);
		window.location.reload();
	};

	return (
		<LanguageSwitcherBase
			currentLocale={i18n.language as SupportedLocale}
			onLocaleChange={handleChange}
		/>
	);
}
