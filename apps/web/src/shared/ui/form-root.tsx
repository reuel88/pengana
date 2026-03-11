import type { ComponentPropsWithoutRef } from "react";

interface FormRootProps
	extends Omit<ComponentPropsWithoutRef<"form">, "onSubmit"> {
	form: { handleSubmit: () => void };
}

export function FormRoot({ form, children, ...props }: FormRootProps) {
	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			{...props}
		>
			{children}
		</form>
	);
}
