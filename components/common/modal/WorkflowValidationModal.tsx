"use client";

import { cn } from "@/lib/utils";
import { WaflButton } from "@/components/common/ui";
import ModalShell from "@/components/common/modal/ModalShell";
import type { WorkflowValidationIssue } from "@/lib/workorder/workflowValidationIssues";

type WorkflowValidationModalProps = {
  open: boolean;
  title: string;
  description: string;
  blockingLabel: string;
  warningLabel: string;
  confirmLabel: string;
  fixLabel: string;
  issues: WorkflowValidationIssue[];
  onClose: () => void;
  onConfirm: () => void;
};

export default function WorkflowValidationModal({
  open,
  title,
  description,
  blockingLabel,
  warningLabel,
  confirmLabel,
  fixLabel,
  issues,
  onClose,
  onConfirm,
}: WorkflowValidationModalProps) {
  const hasBlockingIssue = issues.some((issue) => issue.level === "blocking");
  const blockingIssues = issues.filter((issue) => issue.level === "blocking");
  const warningIssues = issues.filter((issue) => issue.level === "warning");

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      maxWidthClass="md:max-w-xl"
      overlayClassName="pbp-modal-overlay"
      bodyClassName="bg-[var(--pbp-modal-section-muted)]"
      footer={
        <div className="flex items-center justify-end">
          {hasBlockingIssue ? (
            <WaflButton type="button" variant="primary" onClick={onClose}>
              {fixLabel}
            </WaflButton>
          ) : (
            <WaflButton type="button" variant="primary" onClick={onConfirm}>
              {confirmLabel}
            </WaflButton>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {blockingIssues.length > 0 ? (
          <section className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-red-950">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" aria-hidden="true" />
              {blockingLabel}
            </div>
            <ul className="space-y-2 text-sm font-medium leading-6">
              {blockingIssues.map((issue) => (
                <li key={issue.id} className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  <span>{issue.message}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {warningIssues.length > 0 ? (
          <section
            className={cn(
              "rounded-2xl border p-4",
              hasBlockingIssue
                ? "border-amber-200 bg-amber-50/70 text-amber-950"
                : "border-amber-300 bg-amber-50 text-amber-950",
            )}
          >
            <div className="mb-3 flex items-center gap-2 text-sm font-bold">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" aria-hidden="true" />
              {warningLabel}
            </div>
            <ul className="space-y-2 text-sm font-medium leading-6">
              {warningIssues.map((issue) => (
                <li key={issue.id} className="flex gap-2">
                  <span aria-hidden="true">•</span>
                  <span>{issue.message}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </ModalShell>
  );
}
