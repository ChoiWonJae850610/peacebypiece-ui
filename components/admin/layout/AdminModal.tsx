"use client";

import { AdminButton, getAdminButtonClassName } from "@/components/admin/common/AdminButton";
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
  minHeightClassName?: string;
};

export function AdminModal({
  open,
  title,
  onClose,
  children,
  description,
  maxWidthClass = "md:max-w-3xl",
  footer,
  bodyClassName = "space-y-4 [scrollbar-gutter:stable]",
  minHeightClassName = "md:min-h-[360px]",
}: AdminModalProps) {
  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      maxWidthClass={maxWidthClass}
      bodyClassName={bodyClassName}
      footerClassName="px-5 py-4"
      panelClassName={`overflow-hidden rounded-[28px] ${minHeightClassName}`}
      overlayClassName="pbp-modal-overlay"
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
    <section className={`rounded-3xl border p-4 pbp-modal-section ${className}`}>
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

export const adminModalInputClassName =
  "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition pbp-field-search";

export const adminModalLabelClassName = "text-xs font-semibold uppercase tracking-[0.14em] pbp-text-muted";
export const adminModalSecondaryButtonClassName = getAdminButtonClassName({ variant: "secondary" });
export const adminModalPrimaryButtonClassName = getAdminButtonClassName({ variant: "primary" });
export const adminModalDangerButtonClassName = getAdminButtonClassName({ variant: "danger" });


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
  const statusClassName = statusTone === "danger" ? "text-[color:var(--pbp-danger)]" : "pbp-text-muted";

  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-h-[20px] min-w-0 flex-1">
        {statusMessage ? <p className={`text-xs font-semibold ${statusClassName}`}>{statusMessage}</p> : null}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2">
        {secondaryLabel && onSecondary ? (
          <AdminButton variant="secondary" onClick={onSecondary} disabled={secondaryDisabled}>
            {secondaryLabel}
          </AdminButton>
        ) : null}
        <AdminButton variant="primary" onClick={onPrimary} disabled={primaryDisabled}>
          {primaryLabel}
        </AdminButton>
      </div>
    </div>
  );
}
