import {
	DEFAULT_LOCALE,
	isSupportedLocale,
	type SupportedLocale,
} from "@pengana/i18n";
import { initExtensionI18n } from "@pengana/i18n/extension";
import { getDirection } from "@pengana/i18n/rtl";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./style.css";

async function main() {
	const i18n = await initExtensionI18n({
		getStoredLocale: async () => {
			return localStorage.getItem("locale") ?? undefined;
		},
	});

	const locale: SupportedLocale = isSupportedLocale(i18n.language)
		? i18n.language
		: DEFAULT_LOCALE;
	document.documentElement.lang = locale;
	document.documentElement.dir = getDirection(locale);

	const root = document.getElementById("root");
	if (!root) {
		throw new Error("Root element #root not found");
	}

	ReactDOM.createRoot(root).render(
		<React.StrictMode>
			<App />
		</React.StrictMode>,
	);
}

main();
