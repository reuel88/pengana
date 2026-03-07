import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@pengana/ui/lib/utils";
import { XIcon } from "lucide-react";

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
	return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
	return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
	return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogBackdrop({
	className,
	...props
}: DialogPrimitive.Backdrop.Props) {
	return (
		<DialogPrimitive.Backdrop
			data-slot="dialog-backdrop"
			className={cn(
				"data-closed:fade-out-0 data-open:fade-in-0 fixed inset-0 z-50 bg-black/50 data-closed:animate-out data-open:animate-in",
				className,
			)}
			{...props}
		/>
	);
}

function DialogPopup({ className, ...props }: DialogPrimitive.Popup.Props) {
	return (
		<DialogPrimitive.Portal>
			<DialogBackdrop />
			<DialogPrimitive.Popup
				data-slot="dialog-popup"
				className={cn(
					"data-closed:fade-out-0 data-closed:zoom-out-95 data-open:fade-in-0 data-open:zoom-in-95 fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-card p-6 text-card-foreground shadow-lg ring-1 ring-foreground/10 data-closed:animate-out data-open:animate-in",
					className,
				)}
				{...props}
			/>
		</DialogPrimitive.Portal>
	);
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
	return (
		<DialogPrimitive.Title
			data-slot="dialog-title"
			className={cn("font-medium text-sm", className)}
			{...props}
		/>
	);
}

function DialogDescription({
	className,
	...props
}: DialogPrimitive.Description.Props) {
	return (
		<DialogPrimitive.Description
			data-slot="dialog-description"
			className={cn("text-muted-foreground text-xs", className)}
			{...props}
		/>
	);
}

function DialogCloseButton({
	className,
	...props
}: DialogPrimitive.Close.Props) {
	return (
		<DialogPrimitive.Close
			data-slot="dialog-close-button"
			className={cn(
				"absolute top-4 right-4 inline-flex size-6 items-center justify-center text-muted-foreground hover:text-foreground",
				className,
			)}
			{...props}
		>
			<XIcon className="size-4" />
		</DialogPrimitive.Close>
	);
}

export {
	Dialog,
	DialogTrigger,
	DialogClose,
	DialogBackdrop,
	DialogPopup,
	DialogTitle,
	DialogDescription,
	DialogCloseButton,
};
