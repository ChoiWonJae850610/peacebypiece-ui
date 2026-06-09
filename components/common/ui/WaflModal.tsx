"use client";

import type { ReactNode } from "react";

import { WaflButton } from "@/components/common/ui/WaflButton";
import { cn } from "@/lib/utils";

export type WaflModalSize = "sm" | "md" | "lg" | "xl";

export const WAFL_MODAL_OVERLAY_CLASS = "pbp-modal-overlay";
export const WAFL_MODAL_CHROME_CLASS = "pbp-modal-chrome";
export const WAFL_MODAL_BODY_CLASS = "pbp-modal-body";
export const WAFL_MODAL_SECTION_CLASS = "pbp-modal-section";
export const WAFL_MODAL_SECTION_MUTED_CLASS = "pbp-modal-section-muted";

const modalSizeClassMap: Record<WaflModalSize, string> = {
  sm: "md:max-w-xl",
  md: "md:max-w-2xl",
  lg: "md:max-w-3xl",
  xl: "md:max-w-5xl",
};

export function getWaflModalMaxWidthClassName(size: WaflModalSize = "lg") {
  return modalSizeClassMap[size];
}

export function getWaflModalPanelClassName({
  className,
  minHeightClassName = "md:min-h-[360px]",
}: {
  className?: string;
  minHeightClassName?: string;
} = {}) {
  return cn("overflow-hidden rounded-[var(--pbp-radius-wafl)]", minHeightClassName, className);
}

export function getWaflModalHeaderClassName(className?: string) {
  return cn(
    "sticky top-0 z-20 shrink-0 border-b px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] shadow-[0_1px_0_rgba(0,0,0,0.06)] md:px-6 md:pb-4 md:pt-4",
    WAFL_MODAL_CHROME_CLASS,
    className,
  );
}

export function getWaflModalBodyClassName(className?: string) {
  return cn(
    "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6 md:py-5 md:pb-6",
    WAFL_MODAL_BODY_CLASS,
    className,
  );
}

export function getWaflModalFooterClassName(className?: string) {
  return cn(
    "shrink-0 border-t px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:px-6 md:pb-4",
    WAFL_MODAL_CHROME_CLASS,
    className,
  );
}

export function WaflModalCloseButton({ label, onClose }: { label: string; onClose: () => void }) {
  return (
    <WaflButton variant="secondary" size="sm" onClick={onClose} className="rounded-xl px-4">
      {label}
    </WaflButton>
  );
}

export function WaflModalSection({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section data-wafl-component="modal-section" className={cn("rounded-[var(--pbp-radius-wafl)] border p-4", WAFL_MODAL_SECTION_CLASS, className)}>
      {title || description ? (
        <div className="mb-4">
          {title ? <h3 className="text-sm font-semibold pbp-text-primary">{title}</h3> : null}
          {description ? <p className="mt-1 text-xs leading-5 pbp-text-muted">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
