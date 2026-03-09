import { useColorScheme as useRNColorScheme } from "react-native";

export function useColorScheme() {
	const systemColorScheme = useRNColorScheme();
	const colorScheme = systemColorScheme ?? "light";

	return {
		colorScheme: colorScheme as "light" | "dark",
		isDarkColorScheme: colorScheme === "dark",
	};
}
