import { cn } from "@workerSmtp/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
	"inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap",
	{
		variants: {
			variant: {
				default: "bg-muted text-muted-foreground",
				success: "bg-emerald-500/10 text-emerald-500",
				error: "bg-red-500/10 text-red-500",
				warning: "bg-amber-500/10 text-amber-500",
				info: "bg-sky-500/10 text-sky-500",
				queued: "bg-zinc-500/10 text-zinc-400",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

function Badge({
	className,
	variant = "default",
	...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
	return (
		<span
			data-slot="badge"
			data-variant={variant}
			className={cn(badgeVariants({ variant, className }))}
			{...props}
		/>
	);
}

export { Badge, badgeVariants };
