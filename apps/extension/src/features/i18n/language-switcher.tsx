import {
	resolveLocale,
	type SupportedLocale,
	useTranslation,
} from "@pengana/i18n";
import { LanguageSwitcher as LanguageSwitcherBase } from "@pengana/ui/components/language-switcher";

export function LanguageSwitcher() {
	const { i18n } = useTranslation();

	const handleChange = (locale: SupportedLocale) => {
		localStorage.setItem("locale", locale);
		void i18n.changeLanguage(locale);
	};

	return (
		<LanguageSwitcherBase
			currentLocale={resolveLocale(i18n.language)}
			onLocaleChange={handleChange}
		/>
	);
}
