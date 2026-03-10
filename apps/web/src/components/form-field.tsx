import { Input } from "@pengana/ui/components/input";
import { Label } from "@pengana/ui/components/label";
import type { AnyFieldApi } from "@tanstack/react-form";

export function FormField({
	field,
	label,
	id,
	type,
	placeholder,
	required,
}: {
	field: AnyFieldApi;
	label: string;
	id?: string;
	type?: string;
	placeholder?: string;
	required?: boolean;
}) {
	const fieldId = id ?? field.name;

	return (
		<div className="flex flex-col gap-1">
			<Label htmlFor={fieldId}>{label}</Label>
			<Input
				id={fieldId}
				name={field.name}
				type={type}
				value={field.state.value as string}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e.target.value)}
				placeholder={placeholder}
				required={required}
			/>
			{field.state.meta.errors.map((error) => (
				<p key={error?.message} className="text-red-500 text-xs">
					{error?.message}
				</p>
			))}
		</div>
	);
}
