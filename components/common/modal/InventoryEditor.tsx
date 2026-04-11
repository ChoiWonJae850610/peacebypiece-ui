"use client";

import { useEffect, useMemo, useState } from "react";
import type { InventoryChangeTypeValue } from "@/lib/constants/workorderDomain";
import ModalShell from "@/components/common/modal/ModalShell";
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
      if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
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
        layout: "split",
        secondary: { label: MODAL_ACTION_LABELS.cancel, onClick: onClose, width: "fill", className: "rounded-2xl text-stone-800" },
        primary: { label: MODAL_ACTION_LABELS.apply, onClick: handleApply, disabled: applyDisabled, tone: "primary", width: "fill", className: "rounded-2xl disabled:opacity-50" },
      })}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
          <div className="text-xs text-stone-500">{copy.currentStockLabel}</div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-stone-900">{copy.quantityFormat.replace("{count}", String(currentStock))}</div>
        </div>
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-3">
          <div className="text-xs text-cyan-700">{copy.nextStockLabel}</div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-cyan-900">{copy.quantityFormat.replace("{count}", String(nextStock))}</div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">{copy.inboundQuantityLabel}</label>
            <input
              type="number"
              min={0}
              value={inboundQuantity}
              onChange={(event) => setInboundQuantity(event.target.value)}
              placeholder={copy.inboundQuantityPlaceholder}
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 md:text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">{copy.adjustmentQuantityLabel}</label>
            <input
              type="number"
              min={0}
              value={adjustmentQuantity}
              onChange={(event) => setAdjustmentQuantity(event.target.value)}
              placeholder={copy.adjustmentQuantityPlaceholder}
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 md:text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">{copy.deductionQuantityLabel}</label>
            <input
              type="number"
              min={0}
              value={deductionQuantity}
              onChange={(event) => setDeductionQuantity(event.target.value)}
              placeholder={copy.deductionQuantityPlaceholder}
              className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 md:text-sm"
            />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">{copy.memoLabel}</label>
          <textarea
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            placeholder={copy.memoPlaceholder}
            rows={3}
            className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-500 md:text-sm"
          />
        </div>
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-700">
          <div>
            {copy.editorLabel}: <span className="font-medium text-stone-900">{currentUserName}</span>
          </div>
          <div className="mt-1 text-xs text-stone-500">{copy.localTestNotice}</div>
        </div>
      </div>

      {showRecentLogs ? (
        <div className="mt-5 border-t border-stone-200 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-stone-900">{copy.recentLogsTitle}</div>
            <span className="text-xs text-stone-500">{copy.recentLogsCountFormat.replace("{count}", String(Math.min(logs.length, 3)))}</span>
          </div>
          <div className="mt-3 space-y-2">
            {logs.length > 0 ? (
              logs.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-2xl border border-stone-200 bg-white p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-stone-900">{item.summary}</span>
                    <span className="text-xs text-stone-500">{item.time}</span>
                  </div>
                  <div className="mt-1 text-xs text-stone-500">{item.user}</div>
                  <div className="mt-1 text-sm text-stone-700">{item.memo || copy.noMemo}</div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-3 text-sm text-stone-500">{copy.emptyLogs}</div>
            )}
          </div>
        </div>
      ) : null}
    </ModalShell>
  );
}
