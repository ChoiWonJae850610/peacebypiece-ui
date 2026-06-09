"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import AppButton from "./AppButton";

export type AppSheetSide = "right" | "left" | "bottom";
export type AppSheetSize = "sm" | "md" | "lg" | "full";

const sideClassMap: Record<AppSheetSide, string> = {
  right: "inset-y-0 right-0 h-full border-l",
  left: "inset-y-0 left-0 h-full border-r",
  bottom: "inset-x-0 bottom-0 max-h-[min(88dvh,calc(100dvh-env(safe-area-inset-top)-0.75rem))] rounded-t-[var(--pbp-radius-wafl)] border-t",
};

const sizeClassMap: Record<AppSheetSize, string> = {
  sm: "w-full sm:max-w-sm",
  md: "w-full sm:max-w-md",
  lg: "w-full sm:max-w-2xl",
  full: "w-full",
};

type AppSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  side?: AppSheetSide;
  size?: AppSheetSize;
  className?: string;
  contentClassName?: string;
};

export default function AppSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = "right",
  size = "md",
  className,
  contentClassName,
}: AppSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay data-wafl-component="sheet-overlay" className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=open]:animate-in" />
        <Dialog.Content
          data-wafl-component="sheet"
          className={cn(
            "pbp-mobile-no-zoom fixed z-50 flex flex-col border-[var(--pbp-border)] bg-[var(--pbp-surface)] text-[var(--pbp-text-primary)] shadow-none outline-none",
            sideClassMap[side],
            side === "bottom" ? "min-h-[42dvh]" : sizeClassMap[size],
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-[var(--pbp-border)] px-5 py-4">
            <div className="min-w-0 space-y-1">
              <Dialog.Title className="truncate text-base font-bold text-[var(--pbp-text-primary)]">
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description className="text-sm leading-6 text-[var(--pbp-text-muted)]">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
            <Dialog.Close asChild>
              <AppButton variant="ghost" size="sm" className="shrink-0 rounded-full px-3" aria-label="닫기">
                닫기
              </AppButton>
            </Dialog.Close>
          </div>
          <div className={cn("min-h-0 flex-1 overscroll-contain overflow-y-auto px-5 py-4", contentClassName)}>{children}</div>
          {footer ? (
            <div className="border-t border-[var(--pbp-border)] px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              {footer}
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
