import { Separator } from "@pengana/ui/components/separator";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@pengana/ui/components/sidebar";
import type { ComponentProps, PropsWithChildren } from "react";

export const DashboardProvider = SidebarProvider;

export const DashboardSidebar = ({
	children,
	...props
}: ComponentProps<typeof Sidebar>) => {
	return (
		<Sidebar variant="inset" {...props}>
			{children}
		</Sidebar>
	);
};

export const DashboardSidebarHeader = ({
	children,
	...props
}: ComponentProps<typeof SidebarHeader>) => {
	return (
		<SidebarHeader className="p-0" {...props}>
			{children}
		</SidebarHeader>
	);
};

export const DashboardSidebarContent = ({
	children,
	...props
}: ComponentProps<typeof SidebarContent>) => {
	return (
		<SidebarContent className="p-0 [&>*:last-child]:mt-auto" {...props}>
			{children}
		</SidebarContent>
	);
};

export const DashboardInset = SidebarInset;

export const DashboardHeader = ({ children }: PropsWithChildren) => {
	return (
		<header className="flex h-12 shrink-0 items-center gap-2">
			<div className="flex items-center gap-2 px-4">
				<SidebarTrigger />
				<Separator orientation="vertical" className="!h-8 bg-muted" />
				{children}
			</div>
		</header>
	);
};

export const DashboardContent = ({ children }: PropsWithChildren) => {
	return (
		<div className="flex flex-1 flex-col gap-4 md:p-4 md:pt-0">
			<section className="flex min-h-[calc(100vh-64px)] flex-1 flex-col rounded-xl md:min-h-min">
				{children}
			</section>
		</div>
	);
};
