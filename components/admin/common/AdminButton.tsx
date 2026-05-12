import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

export type AdminButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type AdminButtonSize = "sm" | "md";

type AdminButtonBaseProps = {
  children: ReactNode;
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  className?: string;
};

type AdminButtonProps = AdminButtonBaseProps & ButtonHTMLAttributes<HTMLButtonElement>;
type AdminLinkButtonProps = AdminButtonBaseProps & AnchorHTMLAttributes<HTMLAnchorElement>;

const variantClassNames: Record<AdminButtonVariant, string> = {
  primary: "border-transparent bg-stone-950 text-white hover:bg-stone-800",
  secondary: "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50",
  danger: "border-transparent bg-rose-500 text-white hover:bg-rose-600",
  ghost: "border-transparent bg-transparent text-stone-600 hover:bg-stone-100 hover:text-stone-900",
};

const sizeClassNames: Record<AdminButtonSize, string> = {
  sm: "min-h-9 px-4 py-2 text-sm",
  md: "min-h-10 px-5 py-2.5 text-sm",
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
  return `inline-flex shrink-0 items-center justify-center rounded-full border font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${sizeClassNames[size]} ${variantClassNames[variant]} ${className}`.trim();
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
