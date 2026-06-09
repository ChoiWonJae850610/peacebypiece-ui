import type { ButtonHTMLAttributes, ReactNode } from "react";

import { WaflActionButton, getWaflActionButtonClassName, type WaflActionButtonSize, type WaflActionButtonTone } from "@/components/common/ui";
import { cn } from "@/lib/utils";

export type WorkOrderActionTone = WaflActionButtonTone;

const activeActionClassName =
  "border-white/20 bg-white/10 text-white hover:border-white/30 hover:bg-white/15 focus-visible:ring-white/50 focus-visible:ring-offset-stone-950";

export function getWorkOrderActionButtonClassName({
  active = false,
  tone = "neutral",
  size = "sm",
  compact = false,
  className = "",
}: {
  active?: boolean;
  tone?: WorkOrderActionTone;
  size?: WaflActionButtonSize;
  compact?: boolean;
  className?: string;
} = {}) {
  return getWaflActionButtonClassName({
    tone,
    size,
    compact,
    className: cn(active ? activeActionClassName : "", className),
  });
}

type WorkOrderActionButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children"> & {
  label: string;
  tone?: WorkOrderActionTone;
  size?: WaflActionButtonSize;
  compact?: boolean;
  active?: boolean;
  showSrLabel?: boolean;
  children: ReactNode;
};

export function WorkOrderActionButton({
  label,
  tone = "neutral",
  size = "sm",
  compact = false,
  active = false,
  showSrLabel = true,
  className = "",
  children,
  ...props
}: WorkOrderActionButtonProps) {
  return (
    <WaflActionButton
      label={label}
      tone={tone}
      size={size}
      compact={compact}
      showSrLabel={showSrLabel}
      className={cn(active ? activeActionClassName : "", className)}
      {...props}
    >
      {children}
    </WaflActionButton>
  );
}

export function WorkOrderMiniActionButton({
  label,
  tone = "neutral",
  className = "",
  children,
  ...props
}: Omit<WorkOrderActionButtonProps, "size" | "compact" | "active" | "showSrLabel">) {
  return (
    <WaflActionButton
      label={label}
      tone={tone}
      size="sm"
      showSrLabel
      className={cn("h-5 min-h-5 w-5 min-w-5 text-[13px] leading-none [&>svg]:h-3 [&>svg]:w-3", className)}
      {...props}
    >
      {children}
    </WaflActionButton>
  );
}
