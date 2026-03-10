import {
	resolveLocale,
	type SupportedLocale,
	useTranslation,
} from "@pengana/i18n";
import { getDirection } from "@pengana/i18n/rtl";
import { LanguageSwitcher as LanguageSwitcherBase } from "@pengana/ui/components/language-switcher";

export function LanguageSwitcher() {
	const { i18n } = useTranslation();

	const handleChange = (locale: SupportedLocale) => {
		localStorage.setItem("locale", locale);
		void i18n.changeLanguage(locale);
		document.documentElement.dir = getDirection(locale);
		document.documentElement.lang = locale;
	};

	return (
		<LanguageSwitcherBase
			currentLocale={resolveLocale(i18n.language)}
			onLocaleChange={handleChange}
		/>
	);
}
