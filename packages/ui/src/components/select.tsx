"use client";

import { Select } from "@base-ui/react/select";
import { cn } from "@workerSmtp/ui/lib/utils";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import * as React from "react";

function SelectRoot({ ...props }: Select.Root.Props<string, false>) {
	return <Select.Root data-slot="select" {...props} />;
}

const SelectTrigger = React.forwardRef<
	HTMLButtonElement,
	Select.Trigger.Props
>(function SelectTrigger({ className, children, ...props }, ref) {
	return (
		<Select.Trigger
			ref={ref}
			data-slot="select-trigger"
			className={cn(
				"flex h-8 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-transparent px-2.5 py-1 text-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 dark:bg-input/30 [&_svg]:pointer-events-none [&_svg]:shrink-0",
				className,
			)}
			{...props}
		>
			{children}
			<ChevronDownIcon className="size-3.5 opacity-50" />
		</Select.Trigger>
	);
});

function SelectPopup({
	className,
	...props
}: Select.Popup.Props) {
	return (
		<Select.Portal>
			<Select.Positioner className="isolate z-50">
				<Select.Popup
					data-slot="select-popup"
					className={cn(
						"min-w-[var(--anchor-width)] origin-(--transform-origin) overflow-hidden rounded-md bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
						className,
					)}
					{...props}
				/>
			</Select.Positioner>
		</Select.Portal>
	);
}

function SelectItem({
	className,
	children,
	...props
}: Select.Item.Props) {
	return (
		<Select.Item
			data-slot="select-item"
			className={cn(
				"relative flex cursor-default items-center gap-2 rounded-md py-1.5 pr-8 pl-2 text-xs outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-accent data-highlighted:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0",
				className,
			)}
			{...props}
		>
			<Select.ItemText>{children}</Select.ItemText>
			<Select.ItemIndicator className="absolute right-2 inline-flex items-center">
				<CheckIcon className="size-3.5" />
			</Select.ItemIndicator>
		</Select.Item>
	);
}

const Select_ = SelectRoot;

export {
	Select_ as Select,
	SelectRoot,
	SelectTrigger,
	SelectPopup,
	SelectItem,
};
