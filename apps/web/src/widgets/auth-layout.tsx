import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/features/i18n/language-switcher";

export function AuthLayout({ children }: { children: ReactNode }) {
	return (
		<>
			<header className="flex w-full justify-end p-2">
				<LanguageSwitcher />
			</header>
			{children}
		</>
	);
}
