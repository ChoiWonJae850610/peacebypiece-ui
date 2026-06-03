"use client";

import { AdminButton, getAdminButtonClassName } from "@/components/admin/common/AdminButton";
import ModalShell from "@/components/common/modal/ModalShell";
import {
  WAFL_MODAL_OVERLAY_CLASS,
  WaflModalSection,
  getWaflModalPanelClassName,
} from "@/components/common/ui/WaflModal";
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
      panelClassName={getWaflModalPanelClassName({ minHeightClassName })}
      overlayClassName={WAFL_MODAL_OVERLAY_CLASS}
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

export function AdminModalSection(props: AdminModalSectionProps) {
  return <WaflModalSection {...props} />;
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
      <div className="flex w-full shrink-0 flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
        {secondaryLabel && onSecondary ? (
          <AdminButton variant="secondary" width="full" onClick={onSecondary} disabled={secondaryDisabled} className="sm:w-auto">
            {secondaryLabel}
          </AdminButton>
        ) : null}
        <AdminButton variant="primary" width="full" onClick={onPrimary} disabled={primaryDisabled} className="sm:w-auto">
          {primaryLabel}
        </AdminButton>
      </div>
    </div>
  );
}
