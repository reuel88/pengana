import { Stack } from "expo-router";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function AuthLayout() {
	return (
		<Stack
			screenOptions={{
				headerTitle: "",
				headerTransparent: true,
				headerRight: () => <LanguageSwitcher />,
			}}
		/>
	);
}
