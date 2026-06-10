import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type WaflButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "subtle" | "icon";
export type WaflButtonSize = "sm" | "md" | "lg";
export type WaflButtonWidth = "auto" | "full";

const variantClassMap: Record<WaflButtonVariant, string> = {
  primary: "pbp-action-primary border-transparent hover:bg-[var(--pbp-action-primary-surface-hover)]",
  secondary: "pbp-action-secondary border-[var(--pbp-border)] hover:border-[var(--pbp-border-strong)] hover:bg-[var(--pbp-action-secondary-surface-hover)]",
  ghost: "pbp-action-ghost border-transparent shadow-none hover:bg-[var(--pbp-surface-muted)]",
  danger: "pbp-action-danger border-transparent hover:bg-[var(--pbp-action-danger-surface-hover)]",
  subtle: "pbp-action-add border-[var(--pbp-border)] shadow-none hover:border-[var(--pbp-border-strong)] hover:bg-[var(--pbp-surface-muted)]",
  icon: "pbp-action-ghost border-transparent shadow-none hover:bg-[var(--pbp-surface-muted)]",
};

const sizeClassMap: Record<WaflButtonSize, string> = {
  sm: "min-h-8 wafl-shape-control px-3 py-1.5 text-xs",
  md: "min-h-10 wafl-shape-control px-4 py-2 text-sm",
  lg: "min-h-12 wafl-shape-control px-5 py-3 text-base",
};

const iconSizeClassMap: Record<WaflButtonSize, string> = {
  sm: "h-8 min-h-8 w-8 wafl-shape-icon p-0 text-xs",
  md: "h-10 min-h-10 w-10 wafl-shape-icon p-0 text-sm",
  lg: "h-12 min-h-12 w-12 wafl-shape-icon p-0 text-base",
};

const widthClassMap: Record<WaflButtonWidth, string> = {
  auto: "",
  full: "w-full",
};

export const WAFL_BUTTON_BASE_CLASS =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap border font-semibold transition disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pbp-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pbp-surface)] [&>svg]:pointer-events-none [&>svg]:shrink-0";

export function getWaflButtonClassName({
  className,
  variant = "secondary",
  size = "md",
  width = "auto",
}: {
  className?: string;
  variant?: WaflButtonVariant;
  size?: WaflButtonSize;
  width?: WaflButtonWidth;
} = {}) {
  return cn(
    WAFL_BUTTON_BASE_CLASS,
    variantClassMap[variant],
    variant === "icon" ? iconSizeClassMap[size] : sizeClassMap[size],
    widthClassMap[width],
    className,
  );
}

type WaflButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: WaflButtonVariant;
  size?: WaflButtonSize;
  width?: WaflButtonWidth;
  children?: ReactNode;
};

export function WaflButton({
  className,
  variant = "secondary",
  size = "md",
  width = "auto",
  type = "button",
  ...props
}: WaflButtonProps) {
  return <button type={type} data-wafl-component="button" className={getWaflButtonClassName({ variant, size, width, className })} {...props} />;
}

type WaflLinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: WaflButtonVariant;
  size?: WaflButtonSize;
  width?: WaflButtonWidth;
  children?: ReactNode;
};

export function WaflLinkButton({ className, variant = "secondary", size = "md", width = "auto", ...props }: WaflLinkButtonProps) {
  return <a data-wafl-component="button" className={getWaflButtonClassName({ variant, size, width, className })} {...props} />;
}
