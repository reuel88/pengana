import { useTranslation } from "@pengana/i18n";
import type { MediaListItem } from "@pengana/local-db/media";
import { MediaGridItem } from "@pengana/ui/components/media-grid-item";

interface MediaGridList {
	media: MediaListItem[];
	onDelete: (id: string) => Promise<void>;
}

export function MediaGridList({ media, onDelete }: MediaGridList) {
	const { t } = useTranslation("media");

	if (media.length === 0) {
		return (
			<p className="py-8 text-center text-sm opacity-60">{t("grid.empty")}</p>
		);
	}

	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
			{media.map((item) => {
				return (
					<MediaGridItem
						key={item.id}
						item={item}
						onDelete={() => onDelete(item.id)}
					/>
				);
			})}
		</div>
	);
}
