import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { WaflStateBlock, type WaflStateKind } from "./WaflState";

export type WaflEmptyWorkspaceStateVariant = "center-panel" | "side-panel" | "inline-section";

export type WaflEmptyWorkspaceStateProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  variant?: WaflEmptyWorkspaceStateVariant;
  kind?: WaflStateKind;
  className?: string;
};

const variantClassMap: Record<WaflEmptyWorkspaceStateVariant, string> = {
  "center-panel": "border-dashed bg-[var(--pbp-empty-state-surface)]",
  "side-panel": "border-dashed bg-[var(--pbp-empty-state-surface)]",
  "inline-section": "border-dashed bg-[var(--pbp-empty-state-surface)]",
};

const variantMinHeightClassMap: Record<WaflEmptyWorkspaceStateVariant, string> = {
  "center-panel": "min-h-[360px] md:min-h-[520px]",
  "side-panel": "min-h-[220px] md:min-h-[260px]",
  "inline-section": "min-h-[96px]",
};

export function WaflEmptyWorkspaceState({
  title,
  description,
  action,
  variant = "center-panel",
  kind = "empty",
  className,
}: WaflEmptyWorkspaceStateProps) {
  return (
    <WaflStateBlock
      kind={kind}
      title={title}
      description={description}
      action={action}
      size={variant === "center-panel" ? "lg" : "sm"}
      minHeightClassName={variantMinHeightClassMap[variant]}
      className={cn(variantClassMap[variant], className)}
    />
  );
}
