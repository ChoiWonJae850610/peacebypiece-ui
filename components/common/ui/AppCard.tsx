import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type AppCardVariant = "default" | "compact" | "flat" | "subtle";
type AppCardPadding = "none" | "sm" | "md" | "lg";

const variantClassMap: Record<AppCardVariant, string> = {
  default: "rounded-[28px]",
  compact: "rounded-3xl",
  flat: "rounded-3xl shadow-none",
  subtle: "rounded-[28px] pbp-card-muted",
};

const paddingClassMap: Record<AppCardPadding, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

type AppCardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: AppCardVariant;
  padding?: AppCardPadding;
};

export default function AppCard({ className, variant = "default", padding = "md", ...props }: AppCardProps) {
  return <div className={cn("pbp-card min-w-0", variantClassMap[variant], paddingClassMap[padding], className)} {...props} />;
}
