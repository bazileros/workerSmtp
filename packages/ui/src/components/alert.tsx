import { cn } from "@workerSmtp/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const alertVariants = cva(
	"flex items-start gap-2 rounded-none px-3 py-2 text-xs leading-relaxed",
	{
		variants: {
			variant: {
				default: "bg-muted text-muted-foreground",
				success: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/15",
				error: "bg-red-500/10 text-red-500 border border-red-500/15",
				warning: "bg-amber-500/10 text-amber-500 border border-amber-500/15",
				info: "bg-sky-500/10 text-sky-500 border border-sky-500/15",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

function Alert({
	className,
	variant = "default",
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
	return (
		<div
			data-slot="alert"
			data-variant={variant}
			className={cn(alertVariants({ variant, className }))}
			{...props}
		/>
	);
}

function AlertTitle({ className, ...props }: React.ComponentProps<"strong">) {
	return (
		<strong
			data-slot="alert-title"
			className={cn("font-medium", className)}
			{...props}
		/>
	);
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="alert-description"
			className={cn("text-[10px] opacity-80", className)}
			{...props}
		/>
	);
}

export { Alert, AlertTitle, AlertDescription };
