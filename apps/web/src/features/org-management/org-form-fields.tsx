import { useTranslation } from "@pengana/i18n";
import type { AnyFieldApi } from "@tanstack/react-form";

import { FormField } from "@/shared/ui/form-field";

const fieldConfig = {
	name: {
		defaultId: "org-name",
		labelKey: "create.name",
		placeholderKey: "create.namePlaceholder",
	},
	slug: {
		defaultId: "org-slug",
		labelKey: "create.slug",
		placeholderKey: "create.slugPlaceholder",
	},
	logo: {
		defaultId: "org-logo",
		labelKey: "create.logo",
		placeholderKey: "create.logoPlaceholder",
	},
} as const;

function OrgFormField({
	fieldKey,
	field,
	id,
	required,
	testId,
}: {
	fieldKey: keyof typeof fieldConfig;
	field: AnyFieldApi;
	id?: string;
	required?: boolean;
	testId?: string;
}) {
	const { t } = useTranslation("organization");
	const config = fieldConfig[fieldKey];

	return (
		<FormField
			field={field}
			label={t(config.labelKey)}
			id={id ?? config.defaultId}
			placeholder={t(config.placeholderKey)}
			required={required}
			testId={testId}
		/>
	);
}

export function OrgNameField({
	field,
	id,
	testId,
}: {
	field: AnyFieldApi;
	id?: string;
	testId?: string;
}) {
	return <OrgFormField fieldKey="name" field={field} id={id} testId={testId} />;
}

export function OrgSlugField({
	field,
	id,
	required,
	testId,
}: {
	field: AnyFieldApi;
	id?: string;
	required?: boolean;
	testId?: string;
}) {
	return (
		<OrgFormField
			fieldKey="slug"
			field={field}
			id={id}
			required={required}
			testId={testId}
		/>
	);
}

export function OrgLogoField({
	field,
	id,
	testId,
}: {
	field: AnyFieldApi;
	id?: string;
	testId?: string;
}) {
	return <OrgFormField fieldKey="logo" field={field} id={id} testId={testId} />;
}
