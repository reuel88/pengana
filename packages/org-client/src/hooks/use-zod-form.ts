import { useForm } from "@tanstack/react-form";
import type { z } from "zod";

export interface UseZodFormOptions<T extends Record<string, unknown>> {
	// biome-ignore lint/suspicious/noExplicitAny: schema validator accepts a complex generic type
	schema: z.ZodType<T, any, any>;
	defaultValues?: T;
	onSubmit?: (props: { value: T }) => Promise<void> | void;
}

export function useZodForm<T extends Record<string, unknown>>({
	schema,
	defaultValues,
	onSubmit,
}: UseZodFormOptions<T>) {
	return useForm({
		defaultValues,
		onSubmit,
		validators: {
			// biome-ignore lint/suspicious/noExplicitAny: zod v4 schema types are not assignable without cast
			onSubmit: schema as any,
		},
	});
}
