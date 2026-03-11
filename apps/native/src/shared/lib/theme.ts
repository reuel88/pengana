import { NAV_THEME } from "@/shared/lib/constants";
import { useColorScheme } from "@/shared/lib/use-color-scheme";

export function useTheme() {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;

	return { theme, colorScheme };
}
