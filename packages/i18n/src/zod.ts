import type { TFunction } from "i18next";
import { z } from "zod";

export function makeSignInSchema(t: TFunction) {
	return z.object({
		email: z.email(t("auth:validation.invalidEmail")),
		password: z.string().min(8, t("auth:validation.passwordMin")),
	});
}

export function makeSignUpSchema(t: TFunction) {
	return z.object({
		name: z.string().min(2, t("auth:validation.nameMin")),
		email: z.email(t("auth:validation.invalidEmail")),
		password: z.string().min(8, t("auth:validation.passwordMin")),
	});
}

export function makeNativeSignInSchema(t: TFunction) {
	return z.object({
		email: z
			.string()
			.trim()
			.min(1, t("auth:validation.emailRequired"))
			.email(t("auth:validation.validEmail")),
		password: z
			.string()
			.min(1, t("auth:validation.passwordRequired"))
			.min(8, t("auth:validation.useAtLeast8")),
	});
}

export function makeNativeSignUpSchema(t: TFunction) {
	return z.object({
		name: z
			.string()
			.trim()
			.min(1, t("auth:validation.nameRequired"))
			.min(2, t("auth:validation.nameMin")),
		email: z
			.string()
			.trim()
			.min(1, t("auth:validation.emailRequired"))
			.email(t("auth:validation.validEmail")),
		password: z
			.string()
			.min(1, t("auth:validation.passwordRequired"))
			.min(8, t("auth:validation.useAtLeast8")),
	});
}
