import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type AppButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type AppButtonSize = "sm" | "md" | "lg";
type AppButtonWidth = "auto" | "full";

const variantClassMap: Record<AppButtonVariant, string> = {
  primary: "pbp-action-primary shadow-sm",
  secondary: "pbp-action-secondary shadow-sm",
  ghost: "pbp-action-ghost",
  danger: "pbp-action-danger shadow-sm",
};

const sizeClassMap: Record<AppButtonSize, string> = {
  sm: "min-h-8 rounded-xl px-3 py-1.5 text-xs",
  md: "min-h-10 rounded-2xl px-4 py-2 text-sm",
  lg: "min-h-12 rounded-[20px] px-5 py-3 text-base",
};

const widthClassMap: Record<AppButtonWidth, string> = {
  auto: "",
  full: "w-full",
};

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
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pbp-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--pbp-surface)]",
        variantClassMap[variant],
        sizeClassMap[size],
        widthClassMap[width],
        className,
      )}
      {...props}
    />
  );
}
