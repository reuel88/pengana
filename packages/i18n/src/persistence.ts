import type { i18n } from "i18next";

export const LOCALE_STORAGE_KEY_WEB = "i18nextLng";
export const LOCALE_STORAGE_KEY_EXTENSION = "locale";

export function persistLocale(
	i18nInstance: i18n,
	locale: string,
	storageKey: string,
) {
	localStorage.setItem(storageKey, locale);
	void i18nInstance.changeLanguage(locale);
}
