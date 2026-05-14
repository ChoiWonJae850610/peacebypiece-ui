"use client";

import { useMemo, useRef, useState } from "react";
import BaseModal from "@/components/common/modal/BaseModal";
import ModalBody from "@/components/common/modal/ModalBody";
import ModalHeader from "@/components/common/modal/ModalHeader";
import { useModalEnvironment } from "@/components/common/modal/modalUtils";
import { HISTORY_TONE_CLASS } from "@/lib/constants/display";
import { HISTORY_FILTER_OPTIONS } from "@/lib/constants/workflow";
import { isAdminRole, isDesignerRole } from "@/lib/constants/roles";
import type { HistoryFilter, HistoryLog, RoleType } from "@/types/workorder";
import { MODAL_EXCEPTION_PRESETS } from "@/components/common/modal/modalPresets";
import { MODAL_CONTENT_EMPTY_STATE_CLASS, MODAL_CONTENT_MUTED_PANEL_CLASS, MODAL_CONTENT_SECTION_PANEL_CLASS, MODAL_CONTENT_SUBTEXT_CLASS } from "@/components/common/modal/modalContentClassNames";
import { useI18n } from "@/lib/i18n";

function HistoryLogItem({ item, detailLabel, collapseLabel }: { item: HistoryLog; detailLabel: string; collapseLabel: string }) {
  const [open, setOpen] = useState(false);
  const hasDetails = Boolean(item.transition || (item.detailLines && item.detailLines.length > 0));

  return (
    <div className={MODAL_CONTENT_MUTED_PANEL_CLASS}>
      <button
        type="button"
        onClick={() => hasDetails && setOpen((prev) => !prev)}
        className={`w-full text-left ${hasDetails ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${HISTORY_TONE_CLASS[item.tone]}`}>
            {item.action}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[var(--pbp-text-muted)]">
            <span>{item.time}</span>
            {hasDetails && <span className="rounded-full bg-[var(--pbp-modal-section-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--pbp-text-secondary)]">{open ? collapseLabel : detailLabel}</span>}
          </div>
        </div>
        <div className={`mt-2 ${MODAL_CONTENT_SUBTEXT_CLASS}`}>{item.user}</div>
        <div className="mt-1 text-sm text-[var(--pbp-text-secondary)]">{item.summary}</div>
      </button>

      {hasDetails && open && (
        <div className={`${MODAL_CONTENT_SECTION_PANEL_CLASS} mt-3 space-y-2 rounded-xl p-3 text-xs text-[var(--pbp-text-secondary)]`}>
          {item.transition && (
            <div className="rounded-lg bg-[var(--pbp-modal-section-muted)] px-3 py-2 font-medium text-[var(--pbp-text-primary)]">
              {item.transition.from} <span className="px-1 text-[var(--pbp-text-subtle)]">→</span> {item.transition.to}
            </div>
          )}
          {item.detailLines?.map((detail, index) => (
            <div key={`${item.id}-detail-${index}`} className="flex items-start gap-2 leading-5">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--pbp-text-subtle)]" />
              <span>
                {detail.label ? <span className="font-medium text-[var(--pbp-text-primary)]">{detail.label}: </span> : null}
                <span className="break-words">{detail.value}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function InventoryLogModal({
  open,
  onClose,
  logs,
  role,
  filter,
}: {
  open: boolean;
  onClose: () => void;
  logs: HistoryLog[];
  role: RoleType;
  filter: HistoryFilter;
}) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.presentation.inventoryLog;
  const common = i18n.common.ui.common;
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useModalEnvironment({ open, dialogRef, onClose });
  const summaryText = useMemo(() => {
    if (isAdminRole([role])) {
      const filterLabel = HISTORY_FILTER_OPTIONS.find(([key]) => key === filter)?.[1] ?? copy.defaultFilterLabel;
      return copy.currentFilterFormat.replace("{filter}", filterLabel);
    }
    return isDesignerRole([role]) ? copy.currentRoleDesigner : copy.currentRoleInspector;
  }, [copy, filter, role]);

  return (
    <BaseModal open={open} onClose={onClose} dialogRef={dialogRef} titleId="inventory-log-modal-title" maxWidthClassName={MODAL_EXCEPTION_PRESETS.inventoryLog.maxWidthClass}>
      <ModalHeader
        titleId="inventory-log-modal-title"
        title={copy.title}
        description={undefined}
        onClose={onClose}
      />

      <ModalBody>
        <div className="mb-4 text-xs text-[var(--pbp-text-subtle)]">{summaryText}</div>

        <div className="space-y-3">
          {logs.length > 0 ? (
            logs.map((item) => <HistoryLogItem key={item.id} item={item} detailLabel={common.detail} collapseLabel={common.collapse} />)
          ) : (
            <div className={MODAL_CONTENT_EMPTY_STATE_CLASS}>
              {copy.empty}
            </div>
          )}
        </div>
      </ModalBody>
    </BaseModal>
  );
}
