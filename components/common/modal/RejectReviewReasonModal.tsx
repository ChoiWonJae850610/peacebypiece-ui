"use client";

import { useEffect, useState } from "react";
import ModalShell from "@/components/common/modal/ModalShell";

type RejectReviewReasonModalProps = {
  open: boolean;
  title: string;
  description: string;
  fieldLabel: string;
  placeholder: string;
  cancelLabel: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

export default function RejectReviewReasonModal({
  open,
  title,
  description,
  fieldLabel,
  placeholder,
  cancelLabel,
  confirmLabel,
  onClose,
  onConfirm,
}: RejectReviewReasonModalProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      maxWidthClass="md:max-w-lg"
      overlayClassName="pbp-modal-overlay"
      bodyClassName="bg-[var(--pbp-modal-section-muted)]"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button type="button" onClick={onClose} className="pbp-interactive-button pbp-action-secondary inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold">
            {cancelLabel}
          </button>
          <button type="button" onClick={() => onConfirm(reason)} className="pbp-interactive-button pbp-action-primary inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold">
            {confirmLabel}
          </button>
        </div>
      }
    >
      <label className="block text-xs font-semibold text-[var(--pbp-text-muted)]" htmlFor="reject-review-reason-input">
        {fieldLabel}
      </label>
      <textarea
        id="reject-review-reason-input"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder={placeholder}
        rows={5}
        className="mt-2 w-full resize-none rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2 text-sm text-[var(--pbp-text-primary)] outline-none transition focus:border-[var(--pbp-selected-border)]"
      />
    </ModalShell>
  );
}
