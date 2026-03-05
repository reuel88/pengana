import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

export function useTheme() {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;

	return { theme, colorScheme };
}
