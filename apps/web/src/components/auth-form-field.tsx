import { Input } from "@pengana/ui/components/input";
import { Label } from "@pengana/ui/components/label";
import type { AnyFieldApi } from "@tanstack/react-form";

export function AuthFormField({
	field,
	label,
	type,
}: {
	field: AnyFieldApi;
	label: string;
	type?: string;
}) {
	return (
		<div className="space-y-2">
			<Label htmlFor={field.name}>{label}</Label>
			<Input
				id={field.name}
				name={field.name}
				type={type}
				value={field.state.value as string}
				onBlur={field.handleBlur}
				onChange={(e) => field.handleChange(e.target.value)}
			/>
			{field.state.meta.errors.map((error) => (
				<p key={error?.message} className="text-red-500">
					{error?.message}
				</p>
			))}
		</div>
	);
}
