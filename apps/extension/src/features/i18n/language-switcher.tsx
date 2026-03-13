import {
	resolveLocale,
	type SupportedLocale,
	useTranslation,
} from "@pengana/i18n";
import {
	LOCALE_STORAGE_KEY_EXTENSION,
	persistLocale,
} from "@pengana/i18n/persistence";
import { getDirection } from "@pengana/i18n/rtl";
import { LanguageSwitcher as LanguageSwitcherBase } from "@pengana/ui/components/language-switcher";

export function LanguageSwitcher() {
	const { i18n } = useTranslation();

	const currentLocale = resolveLocale(i18n.language);

	const handleChange = (locale: SupportedLocale) => {
		persistLocale(i18n, locale, LOCALE_STORAGE_KEY_EXTENSION);
		document.documentElement.dir = getDirection(locale);
		document.documentElement.lang = locale;
	};

	return (
		<LanguageSwitcherBase
			currentLocale={currentLocale}
			onLocaleChange={handleChange}
		/>
	);
}
