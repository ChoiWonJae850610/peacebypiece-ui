import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { joinAdminClassNames } from "@/components/admin/common/adminComponentVariants";

export type AdminButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type AdminButtonSize = "sm" | "md" | "lg";

type AdminButtonBaseProps = {
  children: ReactNode;
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  className?: string;
};

type AdminButtonProps = AdminButtonBaseProps & ButtonHTMLAttributes<HTMLButtonElement>;
type AdminLinkButtonProps = AdminButtonBaseProps & AnchorHTMLAttributes<HTMLAnchorElement>;

const variantClassNames: Record<AdminButtonVariant, string> = {
  primary: "pbp-action-primary border-transparent",
  secondary: "pbp-action-secondary",
  danger: "pbp-action-danger border-transparent",
  ghost: "pbp-action-ghost",
};

const sizeClassNames: Record<AdminButtonSize, string> = {
  sm: "min-h-9 px-4 py-2 text-sm",
  md: "min-h-10 px-5 py-2.5 text-sm",
  lg: "min-h-12 px-6 py-3 text-sm",
};

export function getAdminButtonClassName({
  variant = "secondary",
  size = "sm",
  className = "",
}: {
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  className?: string;
} = {}) {
  return joinAdminClassNames(
    "inline-flex shrink-0 items-center justify-center rounded-full border font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
    sizeClassNames[size],
    variantClassNames[variant],
    className,
  );
}

export function AdminButton({ children, variant = "secondary", size = "sm", className = "", type = "button", ...props }: AdminButtonProps) {
  return (
    <button type={type} className={getAdminButtonClassName({ variant, size, className })} {...props}>
      {children}
    </button>
  );
}

export function AdminLinkButton({ children, variant = "secondary", size = "sm", className = "", ...props }: AdminLinkButtonProps) {
  return (
    <a className={getAdminButtonClassName({ variant, size, className })} {...props}>
      {children}
    </a>
  );
}
