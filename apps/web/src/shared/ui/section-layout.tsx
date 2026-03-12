import { Link, Outlet } from "@tanstack/react-router";

export function SectionLayout({
	title,
	navLinks,
}: {
	title: string;
	navLinks: ReadonlyArray<{ to: string; label: string }>;
}) {
	return (
		<div className="flex flex-col gap-4 p-4">
			<div className="flex items-center gap-2">
				<h1 className="font-medium text-lg">{title}</h1>
			</div>
			<nav className="flex gap-4 border-b pb-2 text-sm">
				{navLinks.map(({ to, label }) => (
					<Link
						key={to}
						to={to}
						className="text-muted-foreground hover:text-foreground [&.active]:text-foreground [&.active]:underline"
						activeOptions={{ exact: true }}
					>
						{label}
					</Link>
				))}
			</nav>
			<Outlet />
		</div>
	);
}
