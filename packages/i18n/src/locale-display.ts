import { SUPPORTED_LOCALES, type SupportedLocale } from "./config";

const LOCALE_LABELS: Record<SupportedLocale, string> = {
	"en-US": "English (US)",
	"en-AU": "English (AU)",
	es: "Español",
	zh: "中文",
	tl: "Tagalog",
	vi: "Tiếng Việt",
	ar: "العربية",
	fr: "Français",
	ko: "한국어",
	ru: "Русский",
	"pt-BR": "Português (BR)",
};

export const LOCALE_OPTIONS = SUPPORTED_LOCALES.map((locale) => ({
	value: locale,
	label: LOCALE_LABELS[locale],
})) as readonly { value: SupportedLocale; label: string }[];

export function getLocaleLabel(locale: SupportedLocale): string {
	return LOCALE_LABELS[locale];
}
