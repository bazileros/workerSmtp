"use client";

import { cn } from "@workerSmtp/ui/lib/utils";
import { MenuIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";

function Sidebar({
	className,
	children,
	open,
	collapsed,
	...props
}: React.ComponentProps<"aside"> & { open?: boolean; collapsed?: boolean }) {
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	return (
		<aside
			data-slot="sidebar"
			data-open={open || undefined}
			data-collapsed={collapsed || undefined}
			data-mounted={mounted || undefined}
			className={cn(
				"flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-30",
				"transition-[transform] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
				"data-[mounted=false]:-translate-x-full",
				"backdrop-blur-2xl",
				"w-[var(--sidebar-w)]",
				"max-lg:-translate-x-full max-lg:data-[open=true]:translate-x-0",
				className,
			)}
			{...props}
		>
			{children}
		</aside>
	);
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sidebar-header"
			className={cn(
				"flex flex-col gap-1 border-b border-sidebar-border px-5 py-5",
				"transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
				className,
			)}
			{...props}
		/>
	);
}

function SidebarContent({ className, ...props }: React.ComponentProps<"nav">) {
	return (
		<nav
			data-slot="sidebar-content"
			className={cn(
				"flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4",
				"*:data-[slot=sidebar-item]:animate-fade-up *:data-[slot=sidebar-item]:opacity-0",
				className,
			)}
			{...props}
		/>
	);
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="sidebar-footer"
			className={cn(
				"border-t border-sidebar-border px-5 py-3 text-xs text-sidebar-foreground/60",
				className,
			)}
			{...props}
		/>
	);
}

function SidebarItem({
	className,
	active,
	icon,
	children,
	...props
}: React.ComponentProps<"div"> & { active?: boolean; icon?: React.ReactNode }) {
	return (
		<div
			data-slot="sidebar-item"
			data-active={active || undefined}
			className={cn(
				"flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
				"transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
				"text-sidebar-foreground/50 hover:text-sidebar-foreground",
				"hover:bg-sidebar-accent/40 hover:backdrop-blur-xl",
				"data-[active]:bg-sidebar-accent/30 data-[active]:text-sidebar-accent-foreground data-[active]:backdrop-blur-xl",
				"active:scale-[0.98]",
				className,
			)}
			{...props}
		>
			{icon && <span className="shrink-0 [&_svg]:size-4 transition-transform duration-300 group-hover:scale-105">{icon}</span>}
			{children}
		</div>
	);
}

function SidebarTrigger({
	className,
	open,
	onToggle,
	...props
}: React.ComponentProps<"button"> & {
	open?: boolean;
	onToggle?: () => void;
}) {
	return (
		<button
			data-slot="sidebar-trigger"
			onClick={onToggle}
			className={cn(
				"fixed top-4 left-4 z-40 flex size-10 items-center justify-center",
				"rounded-full glass backdrop-blur-2xl",
				"shadow-diffuse",
				"transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
				"hover:scale-105 active:scale-95",
				"lg:hidden",
				className,
			)}
			{...props}
		>
			<span className="relative flex items-center justify-center size-4">
				<span className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "opacity-0 rotate-45 scale-75" : "opacity-100"}`}>
					<MenuIcon className="size-4" />
				</span>
				<span className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? "opacity-100" : "opacity-0 -rotate-45 scale-75"}`}>
					<XIcon className="size-4" />
				</span>
			</span>
		</button>
	);
}

function useSidebar(initialOpen = false) {
	const [open, setOpen] = useState(initialOpen);
	const [collapsed, setCollapsed] = useState(false);
	return {
		open,
		collapsed,
		toggle: () => setOpen((prev) => !prev),
		close: () => setOpen(false),
		toggleCollapse: () => setCollapsed((prev) => !prev),
	};
}

export {
	Sidebar,
	SidebarHeader,
	SidebarContent,
	SidebarFooter,
	SidebarItem,
	SidebarTrigger,
	useSidebar,
};
