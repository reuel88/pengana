import { ALLOWED_MIME_TYPES } from "@pengana/sync-engine";
import { type DragEvent, useCallback, useRef, useState } from "react";

interface DropZoneProps {
	onFiles: (files: File[]) => void;
	idleLabel: string;
	activeLabel: string;
}

export function DropZone({ onFiles, idleLabel, activeLabel }: DropZoneProps) {
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
		(e: DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragOver(false);
			const files = Array.from(e.dataTransfer.files);
			if (files.length > 0) onFiles(files);
		},
		[onFiles],
	);

	const handleClick = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = Array.from(e.target.files ?? []);
			if (files.length > 0) onFiles(files);
			e.target.value = "";
		},
		[onFiles],
	);

	return (
		<button
			type="button"
			className={`flex min-h-32 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
				isDragOver
					? "border-blue-500 bg-blue-50 dark:bg-blue-950"
					: "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
			}`}
			onDragEnter={handleDragEnter}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			onClick={handleClick}
		>
			<span className="text-sm opacity-70">
				{isDragOver ? activeLabel : idleLabel}
			</span>
			<input
				ref={fileInputRef}
				type="file"
				accept={ALLOWED_MIME_TYPES.join(",")}
				multiple
				className="hidden"
				onChange={handleFileChange}
			/>
		</button>
	);
}
