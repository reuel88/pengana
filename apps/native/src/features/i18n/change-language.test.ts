import { describe, expect, it, vi } from "vitest";

import { changeLanguage } from "./change-language";

describe("changeLanguage", () => {
	it("does nothing when the locale does not change", async () => {
		const persistLocale = vi.fn();
		const reload = vi.fn();
		const allowRTL = vi.fn();
		const forceRTL = vi.fn();
		const showRestartAlert = vi.fn();
		const i18n = { changeLanguage: vi.fn() };

		await changeLanguage({
			currentLocale: "en-US",
			nextLocale: "en-US",
			i18n,
			isWeb: false,
			persistLocale,
			reload,
			allowRTL,
			forceRTL,
			showRestartAlert,
		});

		expect(persistLocale).not.toHaveBeenCalled();
		expect(reload).not.toHaveBeenCalled();
		expect(i18n.changeLanguage).not.toHaveBeenCalled();
		expect(showRestartAlert).not.toHaveBeenCalled();
	});

	it("persists and reloads on web without changing the in-memory locale", async () => {
		const persistLocale = vi.fn().mockResolvedValue(undefined);
		const reload = vi.fn();
		const allowRTL = vi.fn();
		const forceRTL = vi.fn();
		const showRestartAlert = vi.fn();
		const i18n = { changeLanguage: vi.fn() };

		await changeLanguage({
			currentLocale: "en-US",
			nextLocale: "fr",
			i18n,
			isWeb: true,
			persistLocale,
			reload,
			allowRTL,
			forceRTL,
			showRestartAlert,
		});

		expect(persistLocale).toHaveBeenCalledWith("fr");
		expect(reload).toHaveBeenCalledTimes(1);
		expect(i18n.changeLanguage).not.toHaveBeenCalled();
		expect(allowRTL).not.toHaveBeenCalled();
		expect(forceRTL).not.toHaveBeenCalled();
		expect(showRestartAlert).not.toHaveBeenCalled();
	});

	it("persists and changes language without restart when direction stays the same", async () => {
		const persistLocale = vi.fn().mockResolvedValue(undefined);
		const reload = vi.fn();
		const allowRTL = vi.fn();
		const forceRTL = vi.fn();
		const showRestartAlert = vi.fn();
		const i18n = { changeLanguage: vi.fn().mockResolvedValue(undefined) };

		await changeLanguage({
			currentLocale: "en-US",
			nextLocale: "fr",
			i18n,
			isWeb: false,
			persistLocale,
			reload,
			allowRTL,
			forceRTL,
			showRestartAlert,
		});

		expect(persistLocale).toHaveBeenCalledWith("fr");
		expect(i18n.changeLanguage).toHaveBeenCalledWith("fr");
		expect(reload).not.toHaveBeenCalled();
		expect(allowRTL).not.toHaveBeenCalled();
		expect(forceRTL).not.toHaveBeenCalled();
		expect(showRestartAlert).not.toHaveBeenCalled();
	});

	it("triggers restart behavior when switching between LTR and RTL locales", async () => {
		const persistLocale = vi.fn().mockResolvedValue(undefined);
		const reload = vi.fn();
		const allowRTL = vi.fn();
		const forceRTL = vi.fn();
		const showRestartAlert = vi.fn();
		const i18n = { changeLanguage: vi.fn().mockResolvedValue(undefined) };

		await changeLanguage({
			currentLocale: "en-US",
			nextLocale: "ar",
			i18n,
			isWeb: false,
			persistLocale,
			reload,
			allowRTL,
			forceRTL,
			showRestartAlert,
		});

		expect(persistLocale).toHaveBeenCalledWith("ar");
		expect(allowRTL).toHaveBeenCalledWith(true);
		expect(forceRTL).toHaveBeenCalledWith(true);
		expect(showRestartAlert).toHaveBeenCalledTimes(1);
		expect(i18n.changeLanguage).toHaveBeenCalledWith("ar");
	});
});
