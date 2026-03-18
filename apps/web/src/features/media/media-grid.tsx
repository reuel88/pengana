import {
	ItemPreview,
	MediaGridItem,
} from "@pengana/ui/components/media-grid-item";
import { MediaGridList } from "@pengana/ui/components/media-grid-list";
import { SyncDot } from "@pengana/ui/components/sync-dot";
import type { MediaListItem } from "@pengana/upload-client";
import { useCallback, useState } from "react";

interface MediaGridProps {
	media: MediaListItem[];
	t: (key: string) => string;
	onDelete: (mediaId: string) => Promise<void>;
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

export function MediaGrid({ media, t, onDelete }: MediaGridProps) {
	const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

	const handleDelete = useCallback(
		async (mediaId: string) => {
			setDeletingIds((prev) => new Set(prev).add(mediaId));
			try {
				await onDelete(mediaId);
			} finally {
				setDeletingIds((prev) => {
					const next = new Set(prev);
					next.delete(mediaId);
					return next;
				});
			}
		},
		[onDelete],
	);

	const visibleItems = media.filter((item) => !deletingIds.has(item.id));

	if (visibleItems.length === 0) {
		return (
			<p className="py-8 text-center text-sm opacity-60">{t("grid.empty")}</p>
		);
	}

	return <MediaGridList media={visibleItems} onDelete={handleDelete} />;
}
