import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type AppButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "subtle" | "icon";
export type AppButtonSize = "sm" | "md" | "lg";
export type AppButtonWidth = "auto" | "full";

const variantClassMap: Record<AppButtonVariant, string> = {
  primary: "pbp-action-primary shadow-sm",
  secondary: "pbp-action-secondary shadow-sm",
  ghost: "pbp-action-ghost",
  danger: "pbp-action-danger shadow-sm",
  subtle: "pbp-action-add shadow-none",
  icon: "pbp-action-ghost rounded-full shadow-none",
};

const sizeClassMap: Record<AppButtonSize, string> = {
  sm: "min-h-8 rounded-xl px-3 py-1.5 text-xs",
  md: "min-h-10 rounded-2xl px-4 py-2 text-sm",
  lg: "min-h-12 rounded-[20px] px-5 py-3 text-base",
};

const iconSizeClassMap: Record<AppButtonSize, string> = {
  sm: "h-8 min-h-8 w-8 rounded-full p-0 text-xs",
  md: "h-10 min-h-10 w-10 rounded-full p-0 text-sm",
  lg: "h-12 min-h-12 w-12 rounded-full p-0 text-base",
};

const widthClassMap: Record<AppButtonWidth, string> = {
  auto: "",
  full: "w-full",
};

export function getAppButtonClassName({
  className,
  variant = "secondary",
  size = "md",
  width = "auto",
}: {
  className?: string;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  width?: AppButtonWidth;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pbp-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pbp-surface)]",
    variantClassMap[variant],
    variant === "icon" ? iconSizeClassMap[size] : sizeClassMap[size],
    widthClassMap[width],
    className,
  );
}

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  width?: AppButtonWidth;
};

export default function AppButton({
  className,
  variant = "secondary",
  size = "md",
  width = "auto",
  type = "button",
  ...props
}: AppButtonProps) {
  return <button type={type} className={getAppButtonClassName({ variant, size, width, className })} {...props} />;
}

type AppLinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  width?: AppButtonWidth;
};

export function AppLinkButton({ className, variant = "secondary", size = "md", width = "auto", ...props }: AppLinkButtonProps) {
  return <a className={getAppButtonClassName({ variant, size, width, className })} {...props} />;
}
