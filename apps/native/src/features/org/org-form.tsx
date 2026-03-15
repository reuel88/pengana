import { useTranslation } from "@pengana/i18n";
import { makeCreateOrgSchema } from "@pengana/i18n/zod";
import { useZodForm } from "@pengana/org-client";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { useTheme } from "@/shared/lib/theme";
import { withLanguageKey } from "@/shared/lib/with-language-key";
import {
	primaryButton,
	primaryButtonText,
	sharedStyles,
} from "@/shared/styles/shared";
import { ThemedTextInput } from "@/shared/ui/themed-text-input";

interface OrgFormValues {
	name: string;
	slug: string;
	logo: string;
}

interface OrgFormProps {
	defaultValues?: Partial<OrgFormValues>;
	onSubmit: (values: OrgFormValues) => Promise<unknown>;
	loading: boolean;
	submitLabel: string;
	inputStyle?: object;
	children?: ReactNode;
	testIDs?: {
		name?: string;
		slug?: string;
		logo?: string;
		submit?: string;
	};
}

export const OrgForm = withLanguageKey(OrgFormContent);

function OrgFormContent({
	defaultValues,
	onSubmit,
	loading,
	submitLabel,
	inputStyle,
	children,
	testIDs,
}: OrgFormProps) {
	const { t } = useTranslation("organization");
	const { theme } = useTheme();

	const form = useZodForm({
		schema: makeCreateOrgSchema(t),
		defaultValues: {
			name: defaultValues?.name ?? "",
			slug: defaultValues?.slug ?? "",
			logo: defaultValues?.logo ?? "",
		},
		onSubmit: async ({ value }) => {
			await onSubmit(value);
		},
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: only re-initialize when defaultValues identity changes
	useEffect(() => {
		if (defaultValues) {
			form.reset({
				name: defaultValues.name ?? "",
				slug: defaultValues.slug ?? "",
				logo: defaultValues.logo ?? "",
			});
		}
	}, [defaultValues?.name, defaultValues?.slug, defaultValues?.logo]);

	return (
		<>
			<form.Field name="name">
				{(field) => (
					<ThemedTextInput
						testID={testIDs?.name}
						style={inputStyle}
						value={field.state.value}
						onChangeText={field.handleChange}
						onBlur={field.handleBlur}
						label={t("create.name")}
						placeholder={t("create.namePlaceholder")}
						error={field.state.meta.errors[0]?.message}
					/>
				)}
			</form.Field>
			<form.Field name="slug">
				{(field) => (
					<ThemedTextInput
						testID={testIDs?.slug}
						style={inputStyle}
						value={field.state.value}
						onChangeText={field.handleChange}
						onBlur={field.handleBlur}
						label={t("create.slug")}
						placeholder={t("create.slugPlaceholder")}
						error={field.state.meta.errors[0]?.message}
					/>
				)}
			</form.Field>
			<form.Field name="logo">
				{(field) => (
					<ThemedTextInput
						testID={testIDs?.logo}
						style={inputStyle}
						value={field.state.value}
						onChangeText={field.handleChange}
						onBlur={field.handleBlur}
						label={t("create.logo")}
						placeholder={t("create.logoPlaceholder")}
						error={field.state.meta.errors[0]?.message}
					/>
				)}
			</form.Field>
			<form.Subscribe
				selector={(s) => ({
					isSubmitting: s.isSubmitting,
					name: s.values.name,
				})}
			>
				{({ isSubmitting, name }) => {
					const isDisabled = loading || isSubmitting || !name.trim();
					return (
						<TouchableOpacity
							testID={testIDs?.submit}
							style={[
								sharedStyles.button,
								primaryButton(theme, { disabled: isDisabled }),
							]}
							onPress={form.handleSubmit}
							disabled={isDisabled}
							accessibilityRole="button"
							accessibilityLabel={submitLabel}
						>
							{loading ? (
								<ActivityIndicator color={theme.primaryForeground} />
							) : (
								<Text style={primaryButtonText(theme)}>{submitLabel}</Text>
							)}
						</TouchableOpacity>
					);
				}}
			</form.Subscribe>
			{children}
		</>
	);
}
