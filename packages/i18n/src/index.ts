export type { TFunction } from "i18next";
export { default as i18next } from "i18next";
export { I18nextProvider, Trans, useTranslation } from "react-i18next";
export {
	DEFAULT_LOCALE,
	isSupportedLocale,
	NAMESPACES,
	type Namespace,
	RTL_LOCALES,
	resolveLocale,
	SUPPORTED_LOCALES,
	type SupportedLocale,
} from "./config";
export { getDirection, isRtlLocale } from "./rtl";
