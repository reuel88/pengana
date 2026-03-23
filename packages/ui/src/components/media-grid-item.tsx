import { useTranslation } from "@pengana/i18n";
import type { MediaListItem } from "@pengana/local-db/media";
import { Skeleton } from "@pengana/ui/components/skeleton";
import { SyncDot } from "@pengana/ui/components/sync-dot";

export interface MediaGridItemProps {
	item: MediaListItem;
	onDelete: () => void;
}

function isPdf(mimeType: string) {
	return mimeType === "application/pdf";
}

function sourceBadge(
	attachments: MediaListItem["attachments"],
	t: (key: string) => string,
) {
	if (attachments.length === 0) return t("source.standalone");
	return attachments
		.map((attachment) => {
			const key = `source.${attachment.entityType}`;
			const translated = t(key);
			return translated === key ? attachment.entityType : translated;
		})
		.join(", ");
}

export function ItemPreview({ item }: { item: MediaListItem }) {
	if (isPdf(item.mimeType)) {
		return (
			<div className="flex h-24 w-full items-center justify-center rounded bg-gray-100 text-2xl dark:bg-gray-800">
				PDF
			</div>
		);
	}

	if (item.url) {
		return (
			<img src={item.url} alt="" className="h-24 w-full rounded object-cover" />
		);
	}

	return <Skeleton className="h-24 w-full" />;
}
export function MediaGridItem({ item, onDelete }: MediaGridItemProps) {
	const { t } = useTranslation("media");

	return (
		<div className="group relative flex flex-col items-center gap-1 rounded-lg border p-2">
			<ItemPreview item={item} />

			<div className="flex w-full items-center gap-1.5 text-xs">
				<SyncDot status={item.status} />

				<span className="truncate opacity-60">
					{sourceBadge(item.attachments, t)}
				</span>
			</div>

			{!item.isLocalOnly && (
				<button
					type="button"
					className="absolute top-1 right-1 hidden rounded bg-red-500 px-1.5 py-0.5 text-white text-xs group-hover:block"
					onClick={onDelete}
				>
					{t("actions.delete")}
				</button>
			)}
		</div>
	);
}
