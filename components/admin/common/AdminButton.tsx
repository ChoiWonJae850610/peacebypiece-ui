import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import { AppButton, AppLinkButton, getAppButtonClassName, type AppButtonVariant } from "@/components/common/ui";

export type AdminButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "subtle" | "icon";
export type AdminButtonSize = "sm" | "md" | "lg";

type AdminButtonBaseProps = {
  children: ReactNode;
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  className?: string;
};

type AdminButtonProps = AdminButtonBaseProps & ButtonHTMLAttributes<HTMLButtonElement>;
type AdminLinkButtonProps = AdminButtonBaseProps & AnchorHTMLAttributes<HTMLAnchorElement>;

function mapAdminButtonSize(size: AdminButtonSize) {
  if (size === "lg") {
    return "lg";
  }

  if (size === "md") {
    return "md";
  }

  return "md";
}

function mapAdminButtonVariant(variant: AdminButtonVariant): AppButtonVariant {
  return variant;
}

export function getAdminButtonClassName({
  variant = "secondary",
  size = "sm",
  className = "",
}: {
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  className?: string;
} = {}) {
  return getAppButtonClassName({
    variant: mapAdminButtonVariant(variant),
    size: mapAdminButtonSize(size),
    className,
  });
}

export function AdminButton({ children, variant = "secondary", size = "sm", className = "", type = "button", ...props }: AdminButtonProps) {
  return (
    <AppButton type={type} variant={mapAdminButtonVariant(variant)} size={mapAdminButtonSize(size)} className={className} {...props}>
      {children}
    </AppButton>
  );
}

export function AdminLinkButton({ children, variant = "secondary", size = "sm", className = "", ...props }: AdminLinkButtonProps) {
  return (
    <AppLinkButton variant={mapAdminButtonVariant(variant)} size={mapAdminButtonSize(size)} className={className} {...props}>
      {children}
    </AppLinkButton>
  );
}
