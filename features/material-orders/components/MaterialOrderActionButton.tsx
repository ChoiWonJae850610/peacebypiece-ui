import type { ButtonHTMLAttributes, ReactNode } from "react";

import {
  WaflActionButton,
  type WaflActionButtonSize,
  type WaflActionButtonTone,
} from "@/components/common/ui";

export type MaterialOrderActionButtonTone = WaflActionButtonTone;
export type MaterialOrderActionButtonSize = WaflActionButtonSize;

type MaterialOrderActionButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children"
> & {
  label: string;
  tone?: MaterialOrderActionButtonTone;
  size?: MaterialOrderActionButtonSize;
  compact?: boolean;
  showSrLabel?: boolean;
  children: ReactNode;
};

export function MaterialOrderActionButton({
  tone = "neutral",
  size = "sm",
  compact = false,
  showSrLabel = true,
  ...props
}: MaterialOrderActionButtonProps) {
  return (
    <WaflActionButton
      tone={tone}
      size={size}
      compact={compact}
      showSrLabel={showSrLabel}
      {...props}
    />
  );
}

export function MaterialOrderMiniActionButton(props: MaterialOrderActionButtonProps) {
  return <MaterialOrderActionButton size="sm" {...props} />;
}
