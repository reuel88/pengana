import { cn } from "@pengana/ui/lib/utils";

function Skeleton({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			data-slot="skeleton"
			className={cn("animate-pulse rounded-none bg-muted", className)}
			{...props}
		/>
	);
}

export { Skeleton };
