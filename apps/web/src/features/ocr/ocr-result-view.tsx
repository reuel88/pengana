import { Button } from "@pengana/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@pengana/ui/components/card";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { CheckIcon } from "@/shared/lib/lucide-react-adapter";

import { FinancialDataView } from "./financial-data-view";
import type { OcrPipelineState } from "./use-ocr-pipeline";

type Tab = "structured" | "raw";

function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Failed to copy to clipboard");
		}
	}, [text]);

	return (
		<Button variant="outline" size="xs" onClick={handleCopy}>
			{copied && <CheckIcon data-icon="inline-start" />}
			{copied ? "Copied" : "Copy"}
		</Button>
	);
}

function formatDuration(ms: number): string {
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(1)}s`;
}

type DoneState = Extract<OcrPipelineState, { status: "done" }>;

export function OcrResultView({
	result,
	fileName,
}: {
	result: DoneState["result"];
	fileName: string;
}) {
	const [activeTab, setActiveTab] = useState<Tab>("structured");
	const { ocr, extraction } = result;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
				<span className="font-medium text-foreground">{fileName}</span>
				<span>{Math.round(ocr.confidence)}% OCR confidence</span>
				<span>
					{ocr.pageCount} {ocr.pageCount === 1 ? "page" : "pages"}
				</span>
				<span>{formatDuration(ocr.durationMs)}</span>
			</div>

			<div className="flex gap-2 border-b" role="tablist">
				{(
					[
						{ key: "structured" as const, label: "Structured Data" },
						{ key: "raw" as const, label: "Raw Text" },
					] as const
				).map(({ key, label }) => (
					<button
						key={key}
						type="button"
						role="tab"
						aria-selected={activeTab === key}
						className={`px-3 py-2 font-medium text-sm ${
							activeTab === key ? "border-current border-b-2" : "opacity-60"
						}`}
						onClick={() => setActiveTab(key)}
					>
						{label}
					</button>
				))}
			</div>

			{activeTab === "structured" && (
				<FinancialDataView extraction={extraction} />
			)}

			{activeTab === "raw" && (
				<Card>
					<CardHeader className="flex-row items-center justify-between">
						<CardTitle>Extracted Text</CardTitle>
						<CopyButton text={ocr.fullText} />
					</CardHeader>
					<CardContent>
						<div className="max-h-96 overflow-auto whitespace-pre-wrap text-sm">
							{ocr.fullText || (
								<span className="text-muted-foreground italic">
									No text detected
								</span>
							)}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
