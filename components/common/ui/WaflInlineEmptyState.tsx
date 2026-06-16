import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { WaflEmptyCard } from "./WaflSurface";
import { WAFL_WORKSPACE_EMPTY_CARD_CLASS } from "./waflWorkspaceSpacing";

export type WaflInlineEmptyStateProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  children: ReactNode;
};

export default function WaflInlineEmptyState({
  children,
  className,
  ...props
}: WaflInlineEmptyStateProps) {
  return (
    <WaflEmptyCard
      component="inline-empty-state"
      shape="control"
      density="default"
      className={cn(
        WAFL_WORKSPACE_EMPTY_CARD_CLASS,
        "whitespace-pre-line text-sm leading-5",
        className,
      )}
      {...props}
    >
      {children}
    </WaflEmptyCard>
  );
}
