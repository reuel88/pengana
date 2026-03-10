import type { AnyFieldApi } from "@tanstack/react-form";

import { FormField } from "@/components/form-field";

export function AuthFormField({
	field,
	label,
	type,
}: {
	field: AnyFieldApi;
	label: string;
	type?: string;
}) {
	return <FormField field={field} label={label} type={type} />;
}
