"use client";

import { useRef, type ReactNode, type Ref } from "react";

import { useModalEnvironment } from "@/components/common/modal/modalUtils";
import AppSegmentedTabs, { type AppSegmentedTabItem } from "./AppSegmentedTabs";
import AppSheet, { type AppSheetSize } from "./AppSheet";

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
    <main className={cn("pbp-mobile-no-zoom min-h-screen overflow-x-hidden", mobileShellToneClassMap[tone], className)}>
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

export type WaflMobileFloatingActionButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel: string;
  title?: string;
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


export function WaflMobileFloatingActionButton({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  title,
  className,
}: WaflMobileFloatingActionButtonProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 flex justify-end px-4",
        className,
      )}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        title={title ?? ariaLabel}
        className={cn(
          "pointer-events-auto inline-flex min-h-14 min-w-14 items-center justify-center gap-2 rounded-full border border-transparent pbp-action-primary px-4 text-sm font-bold shadow-[0_18px_40px_rgba(28,25,23,0.22)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {children}
      </button>
    </div>
  );
}


export type WaflMobileListDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  closeLabel: ReactNode;
  closeOverlayAria: string;
  titleId?: string;
  children: ReactNode;
  headerContent?: ReactNode;
  footerContent?: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function WaflMobileListDrawer({
  open,
  onClose,
  title,
  subtitle,
  closeLabel,
  closeOverlayAria,
  titleId = "wafl-mobile-list-drawer-title",
  children,
  headerContent,
  footerContent,
  className,
  bodyClassName,
}: WaflMobileListDrawerProps) {
  const drawerRef = useRef<HTMLDivElement | null>(null);

  useModalEnvironment({
    open,
    dialogRef: drawerRef,
    onClose,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40" aria-modal="true" role="dialog" aria-labelledby={titleId}>
      <button type="button" aria-label={closeOverlayAria} className="absolute inset-0 bg-stone-950/45 pbp-overlay-enter" onClick={onClose} />
      <div
        ref={drawerRef}
        tabIndex={-1}
        className={cn(
          "absolute left-0 top-0 flex h-full w-[86%] max-w-sm flex-col overflow-hidden rounded-r-3xl bg-white shadow-2xl focus:outline-none pbp-drawer-enter",
          className,
        )}
      >
        <div className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 px-3 pb-2 pt-[max(env(safe-area-inset-top),0.75rem)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div id={titleId} className="truncate text-sm font-semibold leading-5 text-stone-900">{title}</div>
              {subtitle ? <div className="truncate text-[11px] text-stone-500">{subtitle}</div> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="pbp-touch-target pbp-interactive-button inline-flex h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
            >
              {closeLabel}
            </button>
          </div>
          {headerContent ? <div className="mt-2.5">{headerContent}</div> : null}
        </div>
        <div className={cn("pbp-mobile-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.875rem)]", bodyClassName)}>
          {children}
        </div>
        {footerContent ? <div className="border-t border-stone-200 bg-white/95 px-3 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">{footerContent}</div> : null}
      </div>
    </div>
  );
}

export type WaflMobileTabbedActionSheetProps<Key extends string> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  items: Array<AppSegmentedTabItem<Key>>;
  value: Key;
  onChange: (value: Key) => void;
  ariaLabel: string;
  children: ReactNode;
  size?: AppSheetSize;
  contentClassName?: string;
  bodyClassName?: string;
  itemClassName?: string;
};

export function WaflMobileTabbedActionSheet<Key extends string>({
  open,
  onOpenChange,
  title,
  description,
  items,
  value,
  onChange,
  ariaLabel,
  children,
  size = "full",
  contentClassName,
  bodyClassName,
  itemClassName = "text-xs",
}: WaflMobileTabbedActionSheetProps<Key>) {
  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      side="bottom"
      size={size}
      contentClassName={cn(`px-3 py-3 ${WAFL_MOBILE_SAFE_AREA_CLASS_NAMES.sheetBottomPadding}`, contentClassName)}
    >
      <div className={cn("space-y-3", bodyClassName)}>
        <AppSegmentedTabs
          items={items}
          value={value}
          onChange={onChange}
          ariaLabel={ariaLabel}
          itemClassName={itemClassName}
        />
        <div className="min-w-0 overflow-x-hidden">{children}</div>
      </div>
    </AppSheet>
  );
}
