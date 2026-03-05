import { env } from "@finance-tool-poc/env/native";
import { Platform } from "react-native";

/**
 * On web, replace the hostname with localhost so requests are same-site
 * and SameSite=Lax cookies work in development.
 * Native keeps the original IP (needed to reach dev machine from device).
 */
export function getServerUrl(): string {
	if (Platform.OS === "web") {
		const url = new URL(env.EXPO_PUBLIC_SERVER_URL);
		url.hostname = "localhost";
		return url.origin;
	}
	return env.EXPO_PUBLIC_SERVER_URL;
}
