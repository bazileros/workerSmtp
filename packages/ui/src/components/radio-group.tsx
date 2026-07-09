"use client";

import { cn } from "@workerSmtp/ui/lib/utils";
import * as React from "react";

const RadioGroupContext = React.createContext<{
	value?: string;
	onValueChange?: (value: string) => void;
}>({});

function RadioGroup({
	className,
	value,
	onValueChange,
	children,
	...props
}: React.ComponentProps<"div"> & {
	value?: string;
	onValueChange?: (value: string) => void;
}) {
	return (
		<RadioGroupContext.Provider value={{ value, onValueChange }}>
			<div
				data-slot="radio-group"
				role="radiogroup"
				className={cn("flex flex-wrap gap-1", className)}
				{...props}
			>
				{children}
			</div>
		</RadioGroupContext.Provider>
	);
}

function RadioGroupItem({
	className,
	value,
	checked: explicitChecked,
	onClick,
	children,
	...props
}: Omit<React.ComponentProps<"label">, "onChange"> & {
	value: string;
	checked?: boolean;
	onClick?: () => void;
}) {
	const ctx = React.useContext(RadioGroupContext);
	const isChecked = explicitChecked ?? ctx.value === value;
	const handleClick = onClick ?? (() => ctx.onValueChange?.(value));

	return (
		<label
			data-slot="radio-group-item"
			data-checked={isChecked || undefined}
			onClick={handleClick}
			className={cn(
				"relative flex cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-2 text-xs font-medium transition-all select-none",
				"hover:border-ring hover:bg-accent/50",
				"data-[checked]:border-primary data-[checked]:bg-primary/10 data-[checked]:text-primary",
				"has-[:focus-visible]:ring-1 has-[:focus-visible]:ring-ring",
				className,
			)}
			{...props}
		>
			<input type="radio" value={value} checked={isChecked} readOnly className="sr-only" />
			<span
				data-checked={isChecked || undefined}
				className="flex size-3.5 shrink-0 items-center justify-center rounded-full border border-input data-[checked]:border-primary data-[checked]:bg-primary"
			>
				{isChecked && <span className="size-1.5 rounded-full bg-primary-foreground" />}
			</span>
			{children}
		</label>
	);
}

export { RadioGroup, RadioGroupItem };
