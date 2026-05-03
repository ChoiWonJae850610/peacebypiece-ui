"use client";

import ModalShell from "@/components/common/modal/ModalShell";
import type { ReactNode } from "react";

type AdminModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  description?: string;
  maxWidthClass?: string;
  footer?: ReactNode;
  bodyClassName?: string;
};

export function AdminModal({
  open,
  title,
  onClose,
  children,
  description,
  maxWidthClass = "md:max-w-3xl",
  footer,
  bodyClassName = "space-y-4 bg-stone-50/60 [scrollbar-gutter:stable]",
}: AdminModalProps) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      maxWidthClass={maxWidthClass}
      bodyClassName={bodyClassName}
      footerClassName="border-t border-stone-200 bg-white/95 px-5 py-4"
      panelClassName="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-2xl shadow-stone-950/10 md:min-h-[360px]"
      overlayClassName="bg-stone-950/35 backdrop-blur-sm"
      footer={footer}
    >
      {children}
    </ModalShell>
  );
}

type AdminModalSectionProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function AdminModalSection({ title, description, children, className = "" }: AdminModalSectionProps) {
  return (
    <section className={`rounded-3xl border border-stone-200 bg-white p-4 shadow-sm ${className}`}>
      {title || description ? (
        <div className="mb-4">
          {title ? <h3 className="text-sm font-semibold text-stone-950">{title}</h3> : null}
          {description ? <p className="mt-1 text-xs leading-5 text-stone-500">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export const adminModalInputClassName =
  "w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100";

export const adminModalLabelClassName = "text-xs font-semibold uppercase tracking-[0.14em] text-stone-500";
export const adminModalSecondaryButtonClassName =
  "inline-flex min-h-9 items-center justify-center rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50";
export const adminModalPrimaryButtonClassName =
  "inline-flex min-h-9 items-center justify-center rounded-full bg-stone-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50";
export const adminModalDangerButtonClassName =
  "inline-flex min-h-9 items-center justify-center rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50";


type AdminModalFooterActionsProps = {
  secondaryLabel?: string;
  primaryLabel: string;
  onSecondary?: () => void;
  onPrimary: () => void;
  secondaryDisabled?: boolean;
  primaryDisabled?: boolean;
  statusMessage?: string;
  statusTone?: "neutral" | "danger";
};

export function AdminModalFooterActions({
  secondaryLabel,
  primaryLabel,
  onSecondary,
  onPrimary,
  secondaryDisabled = false,
  primaryDisabled = false,
  statusMessage = "",
  statusTone = "neutral",
}: AdminModalFooterActionsProps) {
  const statusClassName = statusTone === "danger" ? "text-rose-600" : "text-stone-500";

  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-h-[20px] min-w-0 flex-1">
        {statusMessage ? <p className={`text-xs font-semibold ${statusClassName}`}>{statusMessage}</p> : null}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2">
        {secondaryLabel && onSecondary ? (
          <button
            type="button"
            onClick={onSecondary}
            disabled={secondaryDisabled}
            className={adminModalSecondaryButtonClassName}
          >
            {secondaryLabel}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onPrimary}
          disabled={primaryDisabled}
          className={adminModalPrimaryButtonClassName}
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}
