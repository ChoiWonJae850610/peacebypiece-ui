"use client";

import * as Tooltip from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AppTooltipSide = "top" | "right" | "bottom" | "left";

type AppTooltipProps = {
  content: ReactNode;
  children: ReactNode;
  side?: AppTooltipSide;
  delayDuration?: number;
  disabled?: boolean;
  className?: string;
};

export default function AppTooltip({
  content,
  children,
  side = "top",
  delayDuration = 250,
  disabled = false,
  className,
}: AppTooltipProps) {
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
              "z-[80] max-w-xs rounded-xl border border-[var(--pbp-border)] bg-[var(--pbp-text-primary)] px-3 py-2 text-xs font-semibold leading-5 text-[var(--pbp-surface)] shadow-xl",
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
