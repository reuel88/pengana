import { useTranslation } from "@pengana/i18n";
import { cn } from "@pengana/ui/lib/utils";
import {
	type ChangeEvent,
	type DragEvent,
	useCallback,
	useRef,
	useState,
} from "react";

interface DropZoneProps {
	onFiles: (files: File[]) => Promise<void>;
	onError?: (error: unknown) => void;
	accept?: string[];
}

export function DropZone({ onFiles, onError, accept }: DropZoneProps) {
	const { t } = useTranslation("media");

	const [isDragOver, setIsDragOver] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleDragEnter = useCallback((e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(true);
	}, []);

	const handleDragOver = useCallback((e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleDragLeave = useCallback((e: DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);
	}, []);

	const handleDrop = useCallback(
		async (e: DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragOver(false);
			const files = Array.from(e.dataTransfer.files);
			if (files.length === 0) return;

			try {
				await onFiles(files);
			} catch (error) {
				onError?.(error);
			}
		},
		[onFiles, onError],
	);

	const handleClick = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleFileChange = useCallback(
		async (e: ChangeEvent<HTMLInputElement>) => {
			const files = Array.from(e.target.files ?? []);
			e.target.value = "";
			if (files.length === 0) return;

			try {
				await onFiles(files);
			} catch (error) {
				onError?.(error);
			}
		},
		[onFiles, onError],
	);

	return (
		<button
			type="button"
			className={cn(
				"flex min-h-32 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors",
				isDragOver && "border-blue-500 bg-blue-50 dark:bg-blue-950",
				!isDragOver &&
					"border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500",
			)}
			onDragEnter={handleDragEnter}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			onClick={handleClick}
		>
			<span className="text-sm opacity-70">
				{isDragOver ? t("dropzone.active") : t("dropzone.idle")}
			</span>
			<input
				ref={fileInputRef}
				type="file"
				accept={accept?.join(",")}
				multiple
				className="hidden"
				onChange={handleFileChange}
			/>
		</button>
	);
}
