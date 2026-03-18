import { env } from "@pengana/env/native";
import { Platform } from "react-native";

/**
 * On web, replace the hostname with localhost so requests are same-site
 * and SameSite=Lax cookies work in development.
 * Native keeps the original IP (needed to reach dev machine from device).
 */
export function getServerUrl(): string {
	const url = new URL(env.EXPO_PUBLIC_SERVER_URL);

	if (Platform.OS === "web") {
		url.hostname = "localhost";
		return url.origin;
	}

	if (Platform.OS === "android" && url.hostname === "localhost") {
		url.hostname = "10.0.2.2";
	}

	return url.origin;
}
