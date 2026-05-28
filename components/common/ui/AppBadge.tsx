import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const appBadgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none",
  {
    variants: {
      tone: {
        neutral: "border-[var(--pbp-border)] bg-[var(--pbp-surface-muted)] text-[var(--pbp-text-muted)]",
        strong: "border-[var(--pbp-border-strong)] bg-[var(--pbp-surface)] text-[var(--pbp-text-primary)]",
        success: "border-emerald-200 bg-emerald-50 text-emerald-700",
        warning: "border-amber-200 bg-amber-50 text-amber-700",
        danger: "border-rose-200 bg-rose-50 text-rose-700",
        brand: "border-[var(--pbp-accent)] bg-[color-mix(in_srgb,var(--pbp-accent)_12%,var(--pbp-surface))] text-[var(--pbp-accent)]",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        md: "px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: {
      tone: "neutral",
      size: "md",
    },
  },
);

type AppBadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof appBadgeVariants>;

export default function AppBadge({ className, tone, size, ...props }: AppBadgeProps) {
  return <span className={cn(appBadgeVariants({ tone, size }), className)} {...props} />;
}
