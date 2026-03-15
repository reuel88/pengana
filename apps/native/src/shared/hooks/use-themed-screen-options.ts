import { useTheme } from "@/shared/lib/theme";

export function useThemedScreenOptions() {
	const { theme } = useTheme();

	return {
		headerStyle: { backgroundColor: theme.menuBackground },
		headerTitleStyle: {
			color: theme.menuForeground,
			fontFamily: theme.fontFamily,
		},
		headerTintColor: theme.menuForeground,
	} as const;
}
