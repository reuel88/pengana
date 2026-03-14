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

export function makeForgotPasswordSchema(t: TFunction) {
	return z.object({
		email: z.email(t("auth:validation.invalidEmail")),
	});
}

export function makeNativeInviteSchema(t: TFunction) {
	return z.object({
		email: z
			.string()
			.trim()
			.min(1, t("auth:validation.emailRequired"))
			.email(t("auth:validation.validEmail")),
		role: z.enum(["member", "admin"]),
	});
}

export function makeNativeInviteMembersSchema(t: TFunction) {
	return z.object({
		members: z.array(
			z.object({
				email: z.union([
					z
						.string()
						.trim()
						.min(1, t("auth:validation.emailRequired"))
						.email(t("auth:validation.validEmail")),
					z.literal(""),
				]),
				role: z.enum(["member", "admin"]),
			}),
		),
	});
}

export function makeCreateOrgSchema(t: TFunction) {
	return z.object({
		name: z.string().trim().min(1, t("auth:validation.nameRequired")),
		slug: z.string(),
		logo: z.string(),
	});
}

export function makeTeamNameSchema(t: TFunction) {
	return z.object({
		name: z.string().trim().min(1, t("auth:validation.nameRequired")),
	});
}

export function makeAddMemberSchema(t: TFunction) {
	return z.object({
		email: z
			.string()
			.trim()
			.min(1, t("auth:validation.emailRequired"))
			.email(t("auth:validation.validEmail")),
	});
}

export function makeResetPasswordSchema(t: TFunction) {
	return z
		.object({
			password: z.string().min(8, t("auth:validation.passwordMin")),
			confirmPassword: z.string().min(8, t("auth:validation.passwordMin")),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: t("auth:validation.passwordsMustMatch"),
			path: ["confirmPassword"],
		});
}

export function makeMagicLinkSchema(t: TFunction) {
	return z.object({
		email: z.email(t("auth:validation.invalidEmail")),
	});
}

export function makeChangePasswordSchema(t: TFunction) {
	return z
		.object({
			currentPassword: z.string().min(8, t("auth:validation.passwordMin")),
			newPassword: z.string().min(8, t("auth:validation.passwordMin")),
			confirmPassword: z.string().min(8, t("auth:validation.passwordMin")),
		})
		.refine((data) => data.newPassword === data.confirmPassword, {
			message: t("auth:validation.passwordsMustMatch"),
			path: ["confirmPassword"],
		})
		.refine((data) => data.newPassword !== data.currentPassword, {
			message: t("auth:validation.passwordMustDifferFromCurrent"),
			path: ["newPassword"],
		});
}

export function makeDeleteAccountSchema(t: TFunction, confirmKeyword: string) {
	return z.object({
		confirmation: z.string().refine((val) => val === confirmKeyword, {
			message: t("auth:validation.deleteConfirmRequired", {
				keyword: confirmKeyword,
			}),
		}),
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
