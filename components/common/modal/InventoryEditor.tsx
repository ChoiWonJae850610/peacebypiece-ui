"use client";

import { useEffect, useMemo, useState } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import {
  MODAL_CONTENT_LABEL_CLASS,
  MODAL_CONTENT_VALUE_CLASS,
} from "@/components/common/modal/modalContentClassNames";
import {
  MODAL_ACTION_LABELS,
  createModalActionHandler,
  getModalActionDisabledState,
  renderModalFooterActions,
} from "@/components/common/modal/modalActions";
import { useI18n } from "@/lib/i18n";
import {
  WaflNumberInput,
  WAFL_FIELD_INPUT_CLASS,
  WaflInfoBox,
} from "@/components/common/ui";

export default function InventoryEditor({
  open,
  onClose,
  currentStock,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  currentStock: number;
  onApply: (payload: {
    inboundQuantity: number;
    adjustmentQuantity: number;
    deductionQuantity: number;
    memo: string;
  }) => void;
}) {
  const { i18n } = useI18n();
  const copy = i18n.common.ui.modal.inventoryEditor;
  const [inboundQuantity, setInboundQuantity] = useState(0);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0);
  const [deductionQuantity, setDeductionQuantity] = useState(0);

  useEffect(() => {
    if (!open) {
      setInboundQuantity(0);
      setAdjustmentQuantity(0);
      setDeductionQuantity(0);
    }
  }, [open]);


  const parsedInboundQuantity = inboundQuantity;
  const parsedAdjustmentQuantity = adjustmentQuantity;
  const parsedDeductionQuantity = deductionQuantity;
  const hasAnyChange =
    parsedInboundQuantity > 0 ||
    parsedAdjustmentQuantity > 0 ||
    parsedDeductionQuantity > 0;
  const applyDisabled = getModalActionDisabledState(!hasAnyChange);

  const nextStock = useMemo(() => {
    let next = currentStock;
    if (parsedInboundQuantity > 0) next += parsedInboundQuantity;
    if (parsedDeductionQuantity > 0)
      next = Math.max(0, next - parsedDeductionQuantity);
    if (parsedAdjustmentQuantity > 0) next = parsedAdjustmentQuantity;
    return next;
  }, [
    currentStock,
    parsedInboundQuantity,
    parsedAdjustmentQuantity,
    parsedDeductionQuantity,
  ]);

  const handleApply = createModalActionHandler({
    shouldProceed: !applyDisabled,
    action: () => {
      onApply({
        inboundQuantity: parsedInboundQuantity,
        adjustmentQuantity: parsedAdjustmentQuantity,
        deductionQuantity: parsedDeductionQuantity,
        memo: "",
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
        primary: {
          label: MODAL_ACTION_LABELS.apply,
          onClick: handleApply,
          disabled: applyDisabled,
          tone: "primary",
          className: "disabled:opacity-50",
        },
      })}
    >
      <div className="grid grid-cols-2 gap-3">
        <WaflInfoBox
          tone="neutral"
          component="readonly-card"
          shape="control"
          className="pbp-workorder-calculated-panel"
        >
          <div className={MODAL_CONTENT_LABEL_CLASS}>
            {copy.currentStockLabel}
          </div>
          <div className={`mt-1 tabular-nums ${MODAL_CONTENT_VALUE_CLASS}`}>
            {copy.quantityFormat.replace("{count}", String(currentStock))}
          </div>
        </WaflInfoBox>
        <WaflInfoBox tone="selected" shape="control" component="readonly-card" state="selected">
          <div className="text-xs text-[var(--pbp-selected-text)]">
            {copy.nextStockLabel}
          </div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-[var(--pbp-selected-text)]">
            {copy.quantityFormat.replace("{count}", String(nextStock))}
          </div>
        </WaflInfoBox>
      </div>

      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--pbp-text-secondary)]">
              {copy.inboundQuantityLabel}
            </label>
            <WaflNumberInput
              inputMode="numeric"
              min={0}
              value={inboundQuantity}
              onValueChange={setInboundQuantity}
              ariaLabel={copy.inboundQuantityPlaceholder}
              className={WAFL_FIELD_INPUT_CLASS}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--pbp-text-secondary)]">
              {copy.adjustmentQuantityLabel}
            </label>
            <WaflNumberInput
              inputMode="numeric"
              min={0}
              value={adjustmentQuantity}
              onValueChange={setAdjustmentQuantity}
              ariaLabel={copy.adjustmentQuantityPlaceholder}
              className={WAFL_FIELD_INPUT_CLASS}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--pbp-text-secondary)]">
              {copy.deductionQuantityLabel}
            </label>
            <WaflNumberInput
              inputMode="numeric"
              min={0}
              value={deductionQuantity}
              onValueChange={setDeductionQuantity}
              ariaLabel={copy.deductionQuantityPlaceholder}
              className={WAFL_FIELD_INPUT_CLASS}
            />
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
