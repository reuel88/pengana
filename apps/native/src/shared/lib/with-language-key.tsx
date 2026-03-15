import { useTranslation } from "@pengana/i18n";
import type { ComponentType } from "react";

/**
 * HOC that forces a remount when the i18n language changes.
 * This ensures forms re-initialize their validation schemas
 * with the correct locale.
 */
export function withLanguageKey<P extends object>(
	Component: ComponentType<P>,
): ComponentType<P> {
	function Wrapper(props: P) {
		const { i18n } = useTranslation();
		return <Component key={i18n.language} {...props} />;
	}

	Wrapper.displayName = `withLanguageKey(${Component.displayName || Component.name || "Component"})`;
	return Wrapper;
}
