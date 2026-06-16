"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type WaflTooltipSide = "top" | "right" | "bottom" | "left";

type WaflTooltipProps = {
  content: ReactNode;
  children: ReactNode;
  side?: WaflTooltipSide;
  delayDuration?: number;
  disabled?: boolean;
  className?: string;
};

export default function WaflTooltip({
  content,
  children,
  side = "top",
  delayDuration = 250,
  disabled = false,
  className,
}: WaflTooltipProps) {
  if (disabled || !content) return <>{children}</>;

  return (
    <Tooltip.Provider delayDuration={delayDuration}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side={side}
            sideOffset={8}
            className={cn(
              "z-[80] max-w-xs wafl-shape-control border border-[var(--pbp-border)] bg-[var(--pbp-text-primary)] px-3 py-2 text-xs font-semibold leading-5 text-[var(--pbp-surface)] shadow-none",
              className,
            )}
          >
            {content}
            <Tooltip.Arrow className="fill-[var(--pbp-text-primary)]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
