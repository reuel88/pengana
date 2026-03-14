import { describe, expect, it, vi } from "vitest";

import { changeLanguage } from "./change-language";

describe("changeLanguage", () => {
	it("does nothing when the locale does not change", async () => {
		const storeLocale = vi.fn();
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
			storeLocale,
			reload,
			allowRTL,
			forceRTL,
			showRestartAlert,
		});

		expect(storeLocale).not.toHaveBeenCalled();
		expect(reload).not.toHaveBeenCalled();
		expect(i18n.changeLanguage).not.toHaveBeenCalled();
		expect(showRestartAlert).not.toHaveBeenCalled();
	});

	it("stores and reloads on web without changing the in-memory locale", async () => {
		const storeLocale = vi.fn().mockResolvedValue(true);
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
			storeLocale,
			reload,
			allowRTL,
			forceRTL,
			showRestartAlert,
		});

		expect(storeLocale).toHaveBeenCalledWith("fr");
		expect(reload).toHaveBeenCalledTimes(1);
		expect(i18n.changeLanguage).not.toHaveBeenCalled();
		expect(allowRTL).not.toHaveBeenCalled();
		expect(forceRTL).not.toHaveBeenCalled();
		expect(showRestartAlert).not.toHaveBeenCalled();
	});

	it("stores and changes language without restart when direction stays the same", async () => {
		const storeLocale = vi.fn().mockResolvedValue(true);
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
			storeLocale,
			reload,
			allowRTL,
			forceRTL,
			showRestartAlert,
		});

		expect(storeLocale).toHaveBeenCalledWith("fr");
		expect(i18n.changeLanguage).toHaveBeenCalledWith("fr");
		expect(reload).not.toHaveBeenCalled();
		expect(allowRTL).not.toHaveBeenCalled();
		expect(forceRTL).not.toHaveBeenCalled();
		expect(showRestartAlert).not.toHaveBeenCalled();
	});

	it("triggers restart behavior when switching between LTR and RTL locales", async () => {
		const storeLocale = vi.fn().mockResolvedValue(true);
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
			storeLocale,
			reload,
			allowRTL,
			forceRTL,
			showRestartAlert,
		});

		expect(storeLocale).toHaveBeenCalledWith("ar");
		expect(allowRTL).toHaveBeenCalledWith(true);
		expect(forceRTL).toHaveBeenCalledWith(true);
		expect(showRestartAlert).toHaveBeenCalledTimes(1);
		expect(i18n.changeLanguage).toHaveBeenCalledWith("ar");
	});

	it("reloads on web even when locale storage reports failure", async () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		const storeLocale = vi.fn().mockResolvedValue(false);
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
			storeLocale,
			reload,
			allowRTL,
			forceRTL,
			showRestartAlert,
		});

		expect(storeLocale).toHaveBeenCalledWith("fr");
		expect(reload).toHaveBeenCalledTimes(1);
		expect(i18n.changeLanguage).not.toHaveBeenCalled();
		expect(warnSpy).toHaveBeenCalledWith(
			"[i18n] failed to persist locale preference",
			{ locale: "fr" },
		);

		warnSpy.mockRestore();
	});

	it("changes language on native even when locale storage rejects", async () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		const storeLocale = vi.fn().mockRejectedValue(new Error("store failed"));
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
			storeLocale,
			reload,
			allowRTL,
			forceRTL,
			showRestartAlert,
		});

		expect(storeLocale).toHaveBeenCalledWith("fr");
		expect(i18n.changeLanguage).toHaveBeenCalledWith("fr");
		expect(reload).not.toHaveBeenCalled();
		expect(warnSpy).toHaveBeenCalledWith(
			"[i18n] failed to persist locale preference",
			{ locale: "fr" },
		);

		warnSpy.mockRestore();
	});
});
