import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@pengana/ui/components/card";

type LineItem = {
	description: string;
	quantity: number | null;
	unitPrice: number | null;
	amount: number;
};

type FinancialDocument = {
	documentType: "invoice" | "receipt" | "statement" | "other";
	vendor: string | null;
	date: string | null;
	dueDate: string | null;
	referenceNumber: string | null;
	lineItems: LineItem[];
	subtotal: number | null;
	taxAmount: number | null;
	total: number | null;
	currency: string | null;
	notes: string | null;
};

type ExtractionResult = {
	document: FinancialDocument;
	method: "regex" | "llm" | "hybrid";
	coverage: number;
	durationMs: number;
};

function formatCurrency(
	amount: number | null,
	currency: string | null,
): string {
	if (amount === null) return "—";
	const symbol = currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
	return `${symbol}${amount.toFixed(2)}`;
}

function MethodBadge({ method }: { method: ExtractionResult["method"] }) {
	const labels = {
		regex: "Pattern Match",
		llm: "AI Extracted",
		hybrid: "AI-Assisted",
	};
	return (
		<span className="rounded bg-muted px-2 py-0.5 text-muted-foreground text-xs">
			{labels[method]}
		</span>
	);
}

function DocTypeBadge({ type }: { type: FinancialDocument["documentType"] }) {
	return (
		<span className="rounded bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs capitalize">
			{type}
		</span>
	);
}

function Field({ label, value }: { label: string; value: string | null }) {
	return (
		<div className="flex flex-col gap-0.5">
			<span className="text-muted-foreground text-xs">{label}</span>
			<span className="text-sm">
				{value ?? <span className="text-muted-foreground italic">—</span>}
			</span>
		</div>
	);
}

export function FinancialDataView({
	extraction,
}: {
	extraction: ExtractionResult;
}) {
	const { document: doc, method, coverage, durationMs } = extraction;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center gap-3 text-xs">
				<DocTypeBadge type={doc.documentType} />
				<MethodBadge method={method} />
				<span className="text-muted-foreground">
					{Math.round(coverage * 100)}% coverage
				</span>
				<span className="text-muted-foreground">
					{durationMs < 1000
						? `${durationMs}ms`
						: `${(durationMs / 1000).toFixed(1)}s`}
				</span>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Document Details</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4">
						<Field label="Vendor" value={doc.vendor} />
						<Field label="Date" value={doc.date} />
						<Field label="Due Date" value={doc.dueDate} />
						<Field label="Reference #" value={doc.referenceNumber} />
						<Field label="Currency" value={doc.currency} />
					</div>
				</CardContent>
			</Card>

			{doc.lineItems.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Line Items</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b text-left text-muted-foreground text-xs">
										<th className="pr-4 pb-2">Description</th>
										<th className="pr-4 pb-2 text-right">Qty</th>
										<th className="pr-4 pb-2 text-right">Unit Price</th>
										<th className="pb-2 text-right">Amount</th>
									</tr>
								</thead>
								<tbody>
									{doc.lineItems.map((item, i) => (
										<tr key={i} className="border-b last:border-0">
											<td className="py-2 pr-4">{item.description}</td>
											<td className="py-2 pr-4 text-right">
												{item.quantity ?? "—"}
											</td>
											<td className="py-2 pr-4 text-right">
												{item.unitPrice !== null
													? formatCurrency(item.unitPrice, doc.currency)
													: "—"}
											</td>
											<td className="py-2 text-right">
												{formatCurrency(item.amount, doc.currency)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Totals</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-2">
						{doc.subtotal !== null && (
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Subtotal</span>
								<span>{formatCurrency(doc.subtotal, doc.currency)}</span>
							</div>
						)}
						{doc.taxAmount !== null && (
							<div className="flex justify-between text-sm">
								<span className="text-muted-foreground">Tax</span>
								<span>{formatCurrency(doc.taxAmount, doc.currency)}</span>
							</div>
						)}
						<div className="flex justify-between border-t pt-2 font-medium text-sm">
							<span>Total</span>
							<span>{formatCurrency(doc.total, doc.currency)}</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{doc.notes && (
				<Card size="sm">
					<CardHeader>
						<CardTitle>Notes</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="whitespace-pre-wrap text-sm">{doc.notes}</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
