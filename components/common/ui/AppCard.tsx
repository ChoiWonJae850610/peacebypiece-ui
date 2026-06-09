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
  surface: "rounded-[var(--pbp-radius-wafl)]",
  elevated: "rounded-[var(--pbp-radius-wafl)] shadow-none",
  flat: "rounded-[var(--pbp-radius-wafl)] shadow-none",
  interactive:
    "rounded-[var(--pbp-radius-wafl)] transition duration-150 ease-out hover:border-[var(--pbp-border-strong)] hover:shadow-none",
  compact: "rounded-[var(--pbp-radius-wafl)]",
  default: "rounded-[var(--pbp-radius-wafl)]",
  subtle: "rounded-[var(--pbp-radius-wafl)] pbp-card-muted",
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
