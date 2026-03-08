import {
	DEFAULT_LOCALE,
	isSupportedLocale,
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
			currentLocale={
				isSupportedLocale(i18n.language) ? i18n.language : DEFAULT_LOCALE
			}
			onLocaleChange={handleChange}
		/>
	);
}
