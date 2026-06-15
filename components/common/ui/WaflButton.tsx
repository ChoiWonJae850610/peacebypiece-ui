import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";
import {
  waflControlDensityClassMap,
  waflIconDensityClassMap,
  waflInteractiveClass,
} from "./WaflPrimitive";

export type WaflButtonVariant =
  | "primary"
  | "secondary"
  | "neutral"
  | "ghost"
  | "danger"
  | "subtle"
  | "icon";
export type WaflButtonSize = "sm" | "md" | "lg";
export type WaflButtonWidth = "auto" | "full";

const variantClassMap: Record<WaflButtonVariant, string> = {
  primary:
    "pbp-action-primary border-transparent hover:bg-[var(--pbp-action-primary-surface-hover)]",
  secondary:
    "pbp-action-secondary border-[var(--pbp-border)] hover:border-[var(--pbp-border-strong)] hover:bg-[var(--pbp-action-secondary-surface-hover)]",
  neutral:
    "border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-[var(--pbp-text-primary)] hover:border-[var(--pbp-border-strong)] hover:bg-[var(--pbp-surface-muted)]",
  ghost:
    "pbp-action-ghost border-transparent shadow-none hover:bg-[var(--pbp-surface-muted)]",
  danger:
    "pbp-action-danger border-transparent hover:bg-[var(--pbp-action-danger-surface-hover)]",
  subtle:
    "pbp-action-add border-[var(--pbp-border)] shadow-none hover:border-[var(--pbp-border-strong)] hover:bg-[var(--pbp-surface-muted)]",
  icon: "pbp-action-ghost border-transparent shadow-none hover:bg-[var(--pbp-surface-muted)]",
};

const sizeClassMap: Record<WaflButtonSize, string> = {
  sm: cn("wafl-shape-control", waflControlDensityClassMap.compact),
  md: cn("wafl-shape-control", waflControlDensityClassMap.default),
  lg: cn("wafl-shape-control", waflControlDensityClassMap.spacious),
};

const iconSizeClassMap: Record<WaflButtonSize, string> = {
  sm: cn("wafl-shape-icon", waflIconDensityClassMap.compact),
  md: cn("wafl-shape-icon", waflIconDensityClassMap.default),
  lg: cn("wafl-shape-icon", waflIconDensityClassMap.spacious),
};

const widthClassMap: Record<WaflButtonWidth, string> = {
  auto: "",
  full: "w-full",
};

export const WAFL_BUTTON_BASE_CLASS = cn(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap border font-semibold [&>svg]:pointer-events-none [&>svg]:shrink-0",
  waflInteractiveClass,
);

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
  return (
    <button
      type={type}
      data-wafl-component="button"
      data-wafl-foundation={variant === "icon" ? "icon" : "control"}
      data-wafl-variant={variant}
      data-wafl-density={size}
      className={getWaflButtonClassName({ variant, size, width, className })}
      {...props}
    />
  );
}

export function WaflCardButton({
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      data-wafl-component="card-button"
      data-wafl-foundation="control"
      className={cn(
        "pbp-touch-target pbp-press-subtle block w-full min-w-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--pbp-selected-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pbp-surface)]",
        className,
      )}
      {...props}
    />
  );
}

type WaflLinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: WaflButtonVariant;
  size?: WaflButtonSize;
  width?: WaflButtonWidth;
  children?: ReactNode;
};

export function WaflLinkButton({
  className,
  variant = "secondary",
  size = "md",
  width = "auto",
  ...props
}: WaflLinkButtonProps) {
  return (
    <a
      data-wafl-component="button"
      data-wafl-foundation={variant === "icon" ? "icon" : "control"}
      data-wafl-variant={variant}
      data-wafl-density={size}
      className={getWaflButtonClassName({ variant, size, width, className })}
      {...props}
    />
  );
}
