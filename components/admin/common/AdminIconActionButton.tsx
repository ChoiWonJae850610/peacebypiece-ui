import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import {
  getWaflActionButtonClassName,
  WAFL_ACTION_BUTTON_BASE_CLASS,
  WaflActionButton,
  WaflActionLink,
  type WaflActionButtonTone,
} from "@/components/common/ui";

export type AdminIconActionButtonTone = WaflActionButtonTone;

type IconActionBaseProps = {
  label: string;
  tone?: AdminIconActionButtonTone;
  className?: string;
  children: ReactNode;
};

type CompactActionBaseProps = {
  active?: boolean;
  className?: string;
  children: ReactNode;
};

export const ADMIN_ACTION_BUTTON_BASE_CLASS = WAFL_ACTION_BUTTON_BASE_CLASS;

export const ADMIN_ICON_ACTION_BUTTON_CLASS = `${WAFL_ACTION_BUTTON_BASE_CLASS} h-8 min-h-8 w-8 min-w-8 p-0 [&>svg]:h-3.5 [&>svg]:w-3.5`;

export const ADMIN_COMPACT_ACTION_BUTTON_CLASS = `${WAFL_ACTION_BUTTON_BASE_CLASS} h-8 min-h-8 min-w-10 gap-1.5 px-3 text-[11px] leading-none`;


export function getAdminIconActionButtonClassName({
  tone = "neutral",
  className = "",
}: {
  tone?: AdminIconActionButtonTone;
  className?: string;
} = {}) {
  return getWaflActionButtonClassName({ tone, className });
}

export function getAdminCompactActionButtonClassName({
  active = false,
  className = "",
}: {
  active?: boolean;
  className?: string;
} = {}) {
  return getWaflActionButtonClassName({
    tone: active ? "primary" : "neutral",
    compact: true,
    className,
  });
}

type AdminCompactActionButtonProps = CompactActionBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement>;

export function AdminCompactActionButton({
  active = false,
  className = "",
  children,
  type = "button",
  ...props
}: AdminCompactActionButtonProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={getAdminCompactActionButtonClassName({ active, className })}
      {...props}
    >
      {children}
    </button>
  );
}

type AdminIconActionButtonProps = IconActionBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children">;

export function AdminIconActionButton({
  label,
  tone = "neutral",
  className = "",
  children,
  type = "button",
  ...props
}: AdminIconActionButtonProps) {
  return (
    <WaflActionButton
      type={type}
      label={label}
      tone={tone}
      className={className}
      {...props}
    >
      {children}
    </WaflActionButton>
  );
}

type AdminIconActionLinkProps = IconActionBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "aria-label" | "children"> & {
    disabled?: boolean;
  };

export function AdminIconActionLink({
  label,
  tone = "neutral",
  className = "",
  children,
  disabled = false,
  href,
  tabIndex,
  ...props
}: AdminIconActionLinkProps) {
  return (
    <WaflActionLink
      href={href}
      label={label}
      tone={tone}
      disabled={disabled}
      tabIndex={tabIndex}
      className={className}
      {...props}
    >
      {children}
    </WaflActionLink>
  );
}
