import type { ReactNode } from "react";

export interface Column<T> {
	header: string;
	cell: (item: T) => ReactNode;
	headerClassName?: string;
	cellClassName?: string;
}

export function DataTable<T>({
	columns,
	data,
	keyFn,
}: {
	columns: Column<T>[];
	data: T[];
	keyFn: (item: T) => string;
}) {
	return (
		<table className="w-full text-xs">
			<thead>
				<tr className="border-b text-left text-muted-foreground">
					{columns.map((col, index) => (
						<th
							key={col.header || `col-${index}`}
							className={col.headerClassName ?? "pb-2"}
						>
							{col.header}
						</th>
					))}
				</tr>
			</thead>
			<tbody>
				{data.map((item) => (
					<tr key={keyFn(item)} className="border-b">
						{columns.map((col, index) => (
							<td
								key={col.header || `col-${index}`}
								className={col.cellClassName ?? "py-2"}
							>
								{col.cell(item)}
							</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
}
