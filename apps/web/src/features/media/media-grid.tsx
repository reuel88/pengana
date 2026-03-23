import type { MediaListItem } from "@pengana/local-db/media";
import { MediaGridList } from "@pengana/ui/components/media-grid-list";
import { useCallback, useState } from "react";

interface MediaGridProps {
	media: MediaListItem[];
	t: (key: string) => string;
	onDelete: (mediaId: string) => Promise<void>;
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
