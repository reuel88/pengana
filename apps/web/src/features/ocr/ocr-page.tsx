import { Button } from "@pengana/ui/components/button";
import { DropZone } from "@pengana/ui/components/drop-zone";
import { Spinner } from "@pengana/ui/components/spinner";
import { toast } from "sonner";

import { OCR_ACCEPTED_MIME_TYPES } from "./constants";
import { OcrResultView } from "./ocr-result-view";
import { useOcrPipeline } from "./use-ocr-pipeline";

export function OcrPage() {
	const { state, startOcr, reset } = useOcrPipeline();

	return (
		<div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
			<h1 className="font-bold text-xl">OCR</h1>

			{state.status === "idle" && (
				<DropZone
					accept={[...OCR_ACCEPTED_MIME_TYPES]}
					onFiles={async (files) => {
						const file = files[0];
						if (file) {
							await startOcr(file);
						}
					}}
					onError={() => {
						toast.error("Failed to process file");
					}}
				/>
			)}

			{(state.status === "uploading" || state.status === "processing") && (
				<div className="flex flex-col items-center gap-3 py-12">
					<Spinner className="size-6" />
					<p className="text-muted-foreground text-sm">
						{state.status === "uploading"
							? "Uploading file..."
							: "Extracting text..."}
					</p>
					<p className="text-muted-foreground text-xs">{state.fileName}</p>
				</div>
			)}

			{state.status === "error" && (
				<div className="flex flex-col items-center gap-3 py-12">
					<p className="text-destructive text-sm">{state.error}</p>
					<Button variant="outline" onClick={reset}>
						Try again
					</Button>
				</div>
			)}

			{state.status === "done" && (
				<>
					<OcrResultView result={state.result} fileName={state.fileName} />
					<Button variant="outline" onClick={reset}>
						Process another file
					</Button>
				</>
			)}
		</div>
	);
}
