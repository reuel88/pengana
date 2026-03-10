import { cn } from "@pengana/ui/lib/utils";
import type * as React from "react";

function Select({ className, ...props }: React.ComponentProps<"select">) {
	return (
		<select
			data-slot="select"
			className={cn(
				"h-8 rounded-none border border-input bg-transparent px-2.5 text-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		/>
	);
}

export { Select };
