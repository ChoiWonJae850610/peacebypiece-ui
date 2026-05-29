import { createElement, type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type AppCardVariant =
  | "surface"
  | "elevated"
  | "flat"
  | "interactive"
  | "compact"
  | "default"
  | "subtle";
export type AppCardPadding = "none" | "sm" | "md" | "lg";
type AppCardElement = "div" | "section" | "article" | "header";

const variantClassMap: Record<AppCardVariant, string> = {
  surface: "rounded-[28px]",
  elevated: "rounded-[28px] shadow-[0_18px_42px_rgba(28,25,23,0.09)]",
  flat: "rounded-3xl shadow-none",
  interactive:
    "rounded-[28px] transition duration-150 ease-out hover:-translate-y-0.5 hover:border-[var(--pbp-border-strong)] hover:shadow-[0_10px_24px_rgba(28,25,23,0.08)]",
  compact: "rounded-3xl",
  default: "rounded-[28px]",
  subtle: "rounded-[28px] pbp-card-muted",
};

const paddingClassMap: Record<AppCardPadding, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

type AppCardProps = HTMLAttributes<HTMLElement> & {
  as?: AppCardElement;
  variant?: AppCardVariant;
  padding?: AppCardPadding;
};

export default function AppCard({ as: Component = "div", className, variant = "surface", padding = "md", ...props }: AppCardProps) {
  return createElement(Component, {
    className: cn("pbp-card min-w-0", variantClassMap[variant], paddingClassMap[padding], className),
    ...props,
  });
}
