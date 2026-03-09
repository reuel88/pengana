import { useTheme } from "@/lib/theme";

export function useThemedScreenOptions() {
	const { theme } = useTheme();

	return {
		headerStyle: { backgroundColor: theme.background },
		headerTitleStyle: { color: theme.text },
		headerTintColor: theme.text,
	} as const;
}
