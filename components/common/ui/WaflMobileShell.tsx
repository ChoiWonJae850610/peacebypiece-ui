import type { ReactNode, Ref } from "react";

import { cn } from "@/lib/utils";

export type WaflMobileShellTone = "app" | "surface";

const mobileShellToneClassMap: Record<WaflMobileShellTone, string> = {
  app: "bg-[var(--pbp-bg-app)] text-[var(--pbp-text-primary)]",
  surface: "bg-[var(--pbp-surface)] text-[var(--pbp-text-primary)]",
};

export const WAFL_MOBILE_SAFE_AREA_CLASS_NAMES = {
  topPadding: "pt-[max(env(safe-area-inset-top),0.75rem)]",
  bottomPadding: "pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
  contentBottomPadding: "pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pb-[calc(5.75rem+env(safe-area-inset-bottom))]",
  sheetBottomPadding: "pb-[calc(1rem+env(safe-area-inset-bottom))]",
} as const;

export type WaflMobileShellProps = {
  children: ReactNode;
  topBar?: ReactNode;
  drawer?: ReactNode;
  actionBar?: ReactNode;
  shellRef?: Ref<HTMLDivElement>;
  tone?: WaflMobileShellTone;
  className?: string;
  contentClassName?: string;
};

export function WaflMobileShell({
  children,
  topBar,
  drawer,
  actionBar,
  shellRef,
  tone = "app",
  className,
  contentClassName,
}: WaflMobileShellProps) {
  return (
    <main className={cn("min-h-screen overflow-x-hidden", mobileShellToneClassMap[tone], className)}>
      <div ref={shellRef} className="min-h-screen overflow-x-hidden">
        {topBar}
        {drawer}
        <div
          className={cn(
            "mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-full flex-col gap-2.5 overflow-x-hidden px-2.5 py-2.5 sm:gap-3 sm:px-3 sm:py-3",
            actionBar ? WAFL_MOBILE_SAFE_AREA_CLASS_NAMES.contentBottomPadding : "pb-[calc(1rem+env(safe-area-inset-bottom))]",
            contentClassName,
          )}
        >
          {children}
        </div>
        {actionBar}
      </div>
    </main>
  );
}

export type WaflMobileContentSectionProps = {
  children: ReactNode;
  className?: string;
};

export function WaflMobileContentSection({ children, className }: WaflMobileContentSectionProps) {
  return <section className={cn("min-w-0 overflow-x-hidden", className)}>{children}</section>;
}

export type WaflMobileFixedActionBarProps = {
  children: ReactNode;
  className?: string;
};

export function WaflMobileFixedActionBar({ children, className }: WaflMobileFixedActionBarProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-[var(--pbp-border)] bg-[var(--pbp-surface)]/95 px-3 pt-3 shadow-[0_-16px_36px_rgba(28,25,23,0.12)] backdrop-blur",
        WAFL_MOBILE_SAFE_AREA_CLASS_NAMES.bottomPadding,
        className,
      )}
    >
      {children}
    </div>
  );
}
