"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import type { InventoryChangeTypeValue } from "@/lib/constants/workorderDomain";
import ModalShell from "@/components/common/modal/ModalShell";
import { blurActiveModalElement } from "@/components/common/modal/modalUtils";
import { MODAL_INPUT_CLASS, MODAL_TEXTAREA_CLASS } from "@/components/common/modal/modalFieldClassNames";
import { MODAL_CONTENT_EMPTY_STATE_CLASS, MODAL_CONTENT_LABEL_CLASS, MODAL_CONTENT_MUTED_PANEL_CLASS, MODAL_CONTENT_READONLY_PANEL_CLASS, MODAL_CONTENT_SECTION_PANEL_CLASS, MODAL_CONTENT_SUBTEXT_CLASS, MODAL_CONTENT_VALUE_CLASS } from "@/components/common/modal/modalContentClassNames";
import { MODAL_ACTION_LABELS, createModalActionHandler, getModalActionDisabledState, renderModalFooterActions } from "@/components/common/modal/modalActions";
import { useI18n } from "@/lib/i18n";

type InventoryMode = InventoryChangeTypeValue;

type InventoryLog = {
  id: string;
  summary: string;
  delta: number;
  memo: string;
  user: string;
  time: string;
  changes: Array<{
    type: InventoryMode;
    quantity: number;
  }>;
};

export default function InventoryEditor({
  open,
  onClose,
  currentStock,
  currentUserName,
  logs,
  showRecentLogs,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  currentStock: number;
  currentUserName: string;
  logs: InventoryLog[];
  showRecentLogs: boolean;
  onApply: (payload: {
    inboundQuantity: number;
    adjustmentQuantity: number;
    deductionQuantity: number;
    memo: string;
  }) => void;
}) {
  const { i18n } = useI18n();
  const copy = i18n.common.ui.modal.inventoryEditor;
  const [inboundQuantity, setInboundQuantity] = useState<string>("");
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<string>("");
  const [deductionQuantity, setDeductionQuantity] = useState<string>("");
  const [memo, setMemo] = useState("");

  useEffect(() => {
    if (!open) {
      setInboundQuantity("");
      setAdjustmentQuantity("");
      setDeductionQuantity("");
      setMemo("");
    }
  }, [open]);

  const handleNumericFieldKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    event.currentTarget.blur();
  };

  const parsedInboundQuantity = Number(inboundQuantity || 0);
  const parsedAdjustmentQuantity = Number(adjustmentQuantity || 0);
  const parsedDeductionQuantity = Number(deductionQuantity || 0);
  const hasAnyChange = parsedInboundQuantity > 0 || parsedAdjustmentQuantity > 0 || parsedDeductionQuantity > 0;
  const applyDisabled = getModalActionDisabledState(!hasAnyChange);

  const nextStock = useMemo(() => {
    let next = currentStock;
    if (parsedInboundQuantity > 0) next += parsedInboundQuantity;
    if (parsedDeductionQuantity > 0) next = Math.max(0, next - parsedDeductionQuantity);
    if (parsedAdjustmentQuantity > 0) next = parsedAdjustmentQuantity;
    return next;
  }, [currentStock, parsedInboundQuantity, parsedAdjustmentQuantity, parsedDeductionQuantity]);

  const handleApply = createModalActionHandler({
    shouldProceed: !applyDisabled,
    beforeAction: () => {
      blurActiveModalElement();
    },
    action: () => {
      onApply({
        inboundQuantity: parsedInboundQuantity,
        adjustmentQuantity: parsedAdjustmentQuantity,
        deductionQuantity: parsedDeductionQuantity,
        memo: memo.trim(),
      });
    },
    onClose,
    closeAfterAction: true,
  });

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={copy.title}
      maxWidthClass="md:max-w-lg"
      footer={renderModalFooterActions({
        layout: "end",
        primary: { label: MODAL_ACTION_LABELS.apply, onClick: handleApply, disabled: applyDisabled, tone: "primary", className: "rounded-2xl disabled:opacity-50" },
      })}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className={MODAL_CONTENT_READONLY_PANEL_CLASS}>
          <div className={MODAL_CONTENT_LABEL_CLASS}>{copy.currentStockLabel}</div>
          <div className={`mt-1 tabular-nums ${MODAL_CONTENT_VALUE_CLASS}`}>{copy.quantityFormat.replace("{count}", String(currentStock))}</div>
        </div>
        <div className="rounded-2xl border border-[var(--pbp-selected-border)] bg-[var(--pbp-selected-surface)] p-3">
          <div className="text-xs text-[var(--pbp-selected-text)]">{copy.nextStockLabel}</div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-[var(--pbp-selected-text)]">{copy.quantityFormat.replace("{count}", String(nextStock))}</div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--pbp-text-secondary)]">{copy.inboundQuantityLabel}</label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={inboundQuantity}
              onChange={(event) => setInboundQuantity(event.target.value)}
              onKeyDown={handleNumericFieldKeyDown}
              placeholder={copy.inboundQuantityPlaceholder}
              className={MODAL_INPUT_CLASS}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--pbp-text-secondary)]">{copy.adjustmentQuantityLabel}</label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={adjustmentQuantity}
              onChange={(event) => setAdjustmentQuantity(event.target.value)}
              onKeyDown={handleNumericFieldKeyDown}
              placeholder={copy.adjustmentQuantityPlaceholder}
              className={MODAL_INPUT_CLASS}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--pbp-text-secondary)]">{copy.deductionQuantityLabel}</label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={deductionQuantity}
              onChange={(event) => setDeductionQuantity(event.target.value)}
              onKeyDown={handleNumericFieldKeyDown}
              placeholder={copy.deductionQuantityPlaceholder}
              className={MODAL_INPUT_CLASS}
            />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--pbp-text-secondary)]">{copy.memoLabel}</label>
          <textarea
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            placeholder={copy.memoPlaceholder}
            rows={3}
            className={MODAL_TEXTAREA_CLASS}
          />
        </div>
        <div className={`${MODAL_CONTENT_MUTED_PANEL_CLASS} text-sm text-[var(--pbp-text-secondary)]`}>
          <div>
            {copy.editorLabel}: <span className="font-medium text-[var(--pbp-text-primary)]">{currentUserName}</span>
          </div>
          <div className={`mt-1 ${MODAL_CONTENT_SUBTEXT_CLASS}`}>{copy.localTestNotice}</div>
        </div>
      </div>

      {showRecentLogs ? (
        <div className="mt-5 border-t border-[var(--pbp-border)] pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-[var(--pbp-text-primary)]">{copy.recentLogsTitle}</div>
            <span className={MODAL_CONTENT_LABEL_CLASS}>{copy.recentLogsCountFormat.replace("{count}", String(Math.min(logs.length, 3)))}</span>
          </div>
          <div className="mt-3 space-y-2">
            {logs.length > 0 ? (
              logs.slice(0, 3).map((item) => (
                <div key={item.id} className={`${MODAL_CONTENT_SECTION_PANEL_CLASS} text-sm`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-[var(--pbp-text-primary)]">{item.summary}</span>
                    <span className={MODAL_CONTENT_LABEL_CLASS}>{item.time}</span>
                  </div>
                  <div className={`mt-1 ${MODAL_CONTENT_SUBTEXT_CLASS}`}>{item.user}</div>
                  <div className="mt-1 text-sm text-[var(--pbp-text-secondary)]">{item.memo || copy.noMemo}</div>
                </div>
              ))
            ) : (
              <div className={MODAL_CONTENT_EMPTY_STATE_CLASS}>{copy.emptyLogs}</div>
            )}
          </div>
        </div>
      ) : null}
    </ModalShell>
  );
}
