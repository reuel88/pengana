import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import {
	DEFAULT_LOCALE,
	isSupportedLocale,
	NAMESPACES,
	SUPPORTED_LOCALES,
} from "./config";
import arAuth from "./locales/ar/auth.json";
import arCommon from "./locales/ar/common.json";
import arDashboard from "./locales/ar/dashboard.json";
import arErrors from "./locales/ar/errors.json";
import arOrganization from "./locales/ar/organization.json";
import arSync from "./locales/ar/sync.json";
import arTodos from "./locales/ar/todos.json";
import enAUAuth from "./locales/en-AU/auth.json";
import enAUCommon from "./locales/en-AU/common.json";
import enAUDashboard from "./locales/en-AU/dashboard.json";
import enAUErrors from "./locales/en-AU/errors.json";
import enAUOrganization from "./locales/en-AU/organization.json";
import enAUSync from "./locales/en-AU/sync.json";
import enAUTodos from "./locales/en-AU/todos.json";
import enUSAuth from "./locales/en-US/auth.json";
import enUSCommon from "./locales/en-US/common.json";
import enUSDashboard from "./locales/en-US/dashboard.json";
import enUSErrors from "./locales/en-US/errors.json";
import enUSOrganization from "./locales/en-US/organization.json";
import enUSSync from "./locales/en-US/sync.json";
import enUSTodos from "./locales/en-US/todos.json";
import esAuth from "./locales/es/auth.json";
import esCommon from "./locales/es/common.json";
import esDashboard from "./locales/es/dashboard.json";
import esErrors from "./locales/es/errors.json";
import esOrganization from "./locales/es/organization.json";
import esSync from "./locales/es/sync.json";
import esTodos from "./locales/es/todos.json";
import frAuth from "./locales/fr/auth.json";
import frCommon from "./locales/fr/common.json";
import frDashboard from "./locales/fr/dashboard.json";
import frErrors from "./locales/fr/errors.json";
import frOrganization from "./locales/fr/organization.json";
import frSync from "./locales/fr/sync.json";
import frTodos from "./locales/fr/todos.json";
import koAuth from "./locales/ko/auth.json";
import koCommon from "./locales/ko/common.json";
import koDashboard from "./locales/ko/dashboard.json";
import koErrors from "./locales/ko/errors.json";
import koOrganization from "./locales/ko/organization.json";
import koSync from "./locales/ko/sync.json";
import koTodos from "./locales/ko/todos.json";
import ptBRAuth from "./locales/pt-BR/auth.json";
import ptBRCommon from "./locales/pt-BR/common.json";
import ptBRDashboard from "./locales/pt-BR/dashboard.json";
import ptBRErrors from "./locales/pt-BR/errors.json";
import ptBROrganization from "./locales/pt-BR/organization.json";
import ptBRSync from "./locales/pt-BR/sync.json";
import ptBRTodos from "./locales/pt-BR/todos.json";
import ruAuth from "./locales/ru/auth.json";
import ruCommon from "./locales/ru/common.json";
import ruDashboard from "./locales/ru/dashboard.json";
import ruErrors from "./locales/ru/errors.json";
import ruOrganization from "./locales/ru/organization.json";
import ruSync from "./locales/ru/sync.json";
import ruTodos from "./locales/ru/todos.json";
import tlAuth from "./locales/tl/auth.json";
import tlCommon from "./locales/tl/common.json";
import tlDashboard from "./locales/tl/dashboard.json";
import tlErrors from "./locales/tl/errors.json";
import tlOrganization from "./locales/tl/organization.json";
import tlSync from "./locales/tl/sync.json";
import tlTodos from "./locales/tl/todos.json";
import viAuth from "./locales/vi/auth.json";
import viCommon from "./locales/vi/common.json";
import viDashboard from "./locales/vi/dashboard.json";
import viErrors from "./locales/vi/errors.json";
import viOrganization from "./locales/vi/organization.json";
import viSync from "./locales/vi/sync.json";
import viTodos from "./locales/vi/todos.json";
import zhAuth from "./locales/zh/auth.json";
import zhCommon from "./locales/zh/common.json";
import zhDashboard from "./locales/zh/dashboard.json";
import zhErrors from "./locales/zh/errors.json";
import zhOrganization from "./locales/zh/organization.json";
import zhSync from "./locales/zh/sync.json";
import zhTodos from "./locales/zh/todos.json";

const resources = {
	"en-US": {
		common: enUSCommon,
		auth: enUSAuth,
		todos: enUSTodos,
		sync: enUSSync,
		dashboard: enUSDashboard,
		errors: enUSErrors,
		organization: enUSOrganization,
	},
	es: {
		common: esCommon,
		auth: esAuth,
		todos: esTodos,
		sync: esSync,
		dashboard: esDashboard,
		errors: esErrors,
		organization: esOrganization,
	},
	ar: {
		common: arCommon,
		auth: arAuth,
		todos: arTodos,
		sync: arSync,
		dashboard: arDashboard,
		errors: arErrors,
		organization: arOrganization,
	},
	"en-AU": {
		common: enAUCommon,
		auth: enAUAuth,
		todos: enAUTodos,
		sync: enAUSync,
		dashboard: enAUDashboard,
		errors: enAUErrors,
		organization: enAUOrganization,
	},
	zh: {
		common: zhCommon,
		auth: zhAuth,
		todos: zhTodos,
		sync: zhSync,
		dashboard: zhDashboard,
		errors: zhErrors,
		organization: zhOrganization,
	},
	tl: {
		common: tlCommon,
		auth: tlAuth,
		todos: tlTodos,
		sync: tlSync,
		dashboard: tlDashboard,
		errors: tlErrors,
		organization: tlOrganization,
	},
	vi: {
		common: viCommon,
		auth: viAuth,
		todos: viTodos,
		sync: viSync,
		dashboard: viDashboard,
		errors: viErrors,
		organization: viOrganization,
	},
	fr: {
		common: frCommon,
		auth: frAuth,
		todos: frTodos,
		sync: frSync,
		dashboard: frDashboard,
		errors: frErrors,
		organization: frOrganization,
	},
	ko: {
		common: koCommon,
		auth: koAuth,
		todos: koTodos,
		sync: koSync,
		dashboard: koDashboard,
		errors: koErrors,
		organization: koOrganization,
	},
	ru: {
		common: ruCommon,
		auth: ruAuth,
		todos: ruTodos,
		sync: ruSync,
		dashboard: ruDashboard,
		errors: ruErrors,
		organization: ruOrganization,
	},
	"pt-BR": {
		common: ptBRCommon,
		auth: ptBRAuth,
		todos: ptBRTodos,
		sync: ptBRSync,
		dashboard: ptBRDashboard,
		errors: ptBRErrors,
		organization: ptBROrganization,
	},
} as const;

export async function initNativeI18n(deviceLocale?: string) {
	const resolvedLocale =
		deviceLocale && isSupportedLocale(deviceLocale)
			? deviceLocale
			: DEFAULT_LOCALE;

	await i18next.use(initReactI18next).init({
		lng: resolvedLocale,
		fallbackLng: {
			"en-AU": ["en-US"],
			default: [DEFAULT_LOCALE],
		},
		supportedLngs: SUPPORTED_LOCALES as unknown as string[],
		ns: NAMESPACES as unknown as string[],
		defaultNS: "common",
		resources,
		interpolation: {
			escapeValue: false,
		},
	});

	return i18next;
}
