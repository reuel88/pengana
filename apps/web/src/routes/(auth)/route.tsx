import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AuthLayout } from "@/widgets/auth-layout";

export const Route = createFileRoute("/(auth)")({
	component: AuthLayoutRoute,
});

function AuthLayoutRoute() {
	return (
		<AuthLayout>
			<Outlet />
		</AuthLayout>
	);
}
