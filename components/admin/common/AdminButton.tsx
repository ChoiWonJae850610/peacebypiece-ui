import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import { WaflButton, WaflLinkButton, getWaflButtonClassName, type WaflButtonVariant } from "@/components/common/ui";

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
  return size;
}

function mapAdminButtonVariant(variant: AdminButtonVariant): WaflButtonVariant {
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
  return getWaflButtonClassName({
    variant: mapAdminButtonVariant(variant),
    size: mapAdminButtonSize(size),
    className,
  });
}

export function AdminButton({ children, variant = "secondary", size = "sm", className = "", type = "button", ...props }: AdminButtonProps) {
  return (
    <WaflButton type={type} variant={mapAdminButtonVariant(variant)} size={mapAdminButtonSize(size)} className={className} {...props}>
      {children}
    </WaflButton>
  );
}

export function AdminLinkButton({ children, variant = "secondary", size = "sm", className = "", ...props }: AdminLinkButtonProps) {
  return (
    <WaflLinkButton variant={mapAdminButtonVariant(variant)} size={mapAdminButtonSize(size)} className={className} {...props}>
      {children}
    </WaflLinkButton>
  );
}
