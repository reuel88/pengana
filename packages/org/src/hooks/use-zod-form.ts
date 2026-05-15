import { useForm } from "@tanstack/react-form";
import type { z } from "zod";

export interface UseZodFormOptions<T extends Record<string, unknown>> {
	// biome-ignore lint/suspicious/noExplicitAny: relax constraint position to keep tsc from unfolding zod's mapped types per callsite (TS2589 with zod 4.4 + tanstack-form). T stays pinned via defaultValues and onSubmit value.
	schema: z.ZodType<any, any, any>;
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
