import { resolveLocale } from "@pengana/i18n";
import { initExtensionI18n } from "@pengana/i18n/extension";
import { LOCALE_STORAGE_KEY_EXTENSION } from "@pengana/i18n/persistence";
import { getDirection } from "@pengana/i18n/rtl";
import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider } from "@/features/theme/theme-provider";
import App from "./App.tsx";
import "./style.css";

async function main() {
	const i18n = await initExtensionI18n({
		getStoredLocale: async () => {
			return localStorage.getItem(LOCALE_STORAGE_KEY_EXTENSION) ?? undefined;
		},
	});

	const locale = resolveLocale(i18n.language);
	document.documentElement.lang = locale;
	document.documentElement.dir = getDirection(locale);

	const root = document.getElementById("root");
	if (!root) {
		throw new Error("Root element #root not found");
	}

	ReactDOM.createRoot(root).render(
		<React.StrictMode>
			<ThemeProvider
				attribute="class"
				defaultTheme="dark"
				storageKey="vite-ui-theme"
			>
				<App />
			</ThemeProvider>
		</React.StrictMode>,
	);
}

main();
