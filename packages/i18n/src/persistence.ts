import type { i18n } from "i18next";

export const LOCALE_STORAGE_KEY_WEB = "i18nextLng";
export const LOCALE_STORAGE_KEY_EXTENSION = "locale";
export const LOCALE_STORAGE_KEY_NATIVE = "appLocale";

export function persistLocale(
	i18nInstance: i18n,
	locale: string,
	storageKey: string,
) {
	if (typeof window !== "undefined" && window.localStorage) {
		try {
			window.localStorage.setItem(storageKey, locale);
		} catch {
			// Ignore storage failures and still switch the in-memory language.
		}
	}
	void i18nInstance.changeLanguage(locale);
}
