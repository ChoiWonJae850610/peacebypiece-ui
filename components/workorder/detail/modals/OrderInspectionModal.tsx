"use client";

import { useI18n } from "@/lib/i18n";
import { useEffect, useState } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import { MODAL_CONTENT_EMPTY_STATE_CLASS, MODAL_CONTENT_FIELD_PANEL_CLASS, MODAL_CONTENT_LABEL_CLASS, MODAL_CONTENT_READONLY_PANEL_CLASS, MODAL_CONTENT_VALUE_CLASS } from "@/components/common/modal/modalContentClassNames";
import { createModalActionHandler, getModalActionDisabledState, renderModalFooterActions } from "@/components/common/modal/modalActions";
import { translateWorkOrderDisplayText } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import { isOrderInspectionCompleted } from "@/lib/constants/workorderStates";
import { DEFAULT_FACTORY_OPTION } from "@/lib/constants/workorderOptions";
import { toNumber } from "@/lib/workorder/detail/detailSanitizers";
import { WaflSelect, WaflInput, WaflTextarea } from "@/components/common/ui";
import type { OrderEntryState } from "@/components/workorder/detail/shared/detailEditorShared";

export default function OrderInspectionModal({
  open,
  orderEntries,
  currentInventoryQuantity,
  onClose,
  onApply,
}: {
  open: boolean;
  orderEntries: OrderEntryState[];
  currentInventoryQuantity: number;
  onClose: () => void;
  onApply: (payload: { orderEntryId: string; inboundQuantity: number; nextInventoryQuantity: number; memo: string }) => void;
}) {
  const { i18n, locale } = useI18n();
  const copy = i18n.workorder.ui.modals.inspection;
  const common = i18n.workorder.ui.common;
  const pendingEntries = orderEntries.filter((item) => !isOrderInspectionCompleted(item.inspectionStatus));
  const availableEntries = pendingEntries.length > 0 ? pendingEntries : orderEntries;
  const [selectedFactory, setSelectedFactory] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [inspectionMemo, setInspectionMemo] = useState("");
  const [appliedQuantityInput, setAppliedQuantityInput] = useState("");

  const factoryOptions = Array.from(new Set(availableEntries.map((item) => item.factory || DEFAULT_FACTORY_OPTION)));
  const resolvedFactory = factoryOptions.includes(selectedFactory) ? selectedFactory : (factoryOptions[0] ?? "");
  const filteredEntries = availableEntries.filter((item) => (item.factory || DEFAULT_FACTORY_OPTION) === resolvedFactory);
  const selectedEntry = filteredEntries.find((item) => item.id === selectedOrderId) ?? filteredEntries[0] ?? null;

  useEffect(() => {
    if (!open) {
      setSelectedFactory("");
      setSelectedOrderId("");
      setInspectionMemo("");
      setAppliedQuantityInput("");
      return;
    }

    if (!resolvedFactory) return;
    if (selectedFactory !== resolvedFactory) {
      setSelectedFactory(resolvedFactory);
    }
    if (!selectedEntry) return;
    if (selectedOrderId !== selectedEntry.id) {
      setSelectedOrderId(selectedEntry.id);
    }
  }, [open, resolvedFactory, selectedFactory, selectedEntry, selectedOrderId]);

  useEffect(() => {
    if (!open || !selectedEntry) return;
    setAppliedQuantityInput(String(Math.max(0, Number(selectedEntry.quantity) || 0)));
  }, [open, selectedEntry?.id]);

  const handleFactoryChange = (factory: string) => {
    setSelectedFactory(factory);
    const nextEntries = availableEntries.filter((item) => (item.factory || DEFAULT_FACTORY_OPTION) === factory);
    setSelectedOrderId(nextEntries[0]?.id || "");
  };

  const orderedQuantity = Math.max(0, Number(selectedEntry?.quantity) || 0);
  const appliedQuantity = Math.max(0, toNumber(appliedQuantityInput));
  const nextInventoryQuantity = Math.max(0, Number(currentInventoryQuantity) || 0) + appliedQuantity;

  const submitDisabled = getModalActionDisabledState(!selectedEntry);
  const handleApply = createModalActionHandler({
    shouldProceed: !submitDisabled,
    action: () => {
      if (!selectedEntry) return;
      onApply({
        orderEntryId: selectedEntry.id,
        inboundQuantity: appliedQuantity,
        nextInventoryQuantity,
        memo: inspectionMemo,
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
      description={copy.description}
      maxWidthClass="md:max-w-lg"
      footer={renderModalFooterActions({
        layout: "split",
        secondary: { label: i18n.common.ui.common.close, onClick: onClose, width: "fill" },
        primary: { label: i18n.common.ui.modalActions.completeInspection, onClick: handleApply, disabled: submitDisabled, tone: "primary", width: "fill" },
      })}
    >
      {selectedEntry ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className={MODAL_CONTENT_FIELD_PANEL_CLASS}>
              <div className={MODAL_CONTENT_LABEL_CLASS}>{copy.factoryLabel}</div>
              <WaflSelect
                value={resolvedFactory}
                onValueChange={handleFactoryChange}
                options={factoryOptions.map((option) => ({
                  value: option,
                  label: translateWorkOrderDisplayText(option, locale),
                }))}
                ariaLabel={copy.factoryLabel}
                className="mt-2"
              />
            </label>
            <label className={MODAL_CONTENT_FIELD_PANEL_CLASS}>
              <div className={MODAL_CONTENT_LABEL_CLASS}>{copy.orderTypeLabel}</div>
              <WaflSelect
                value={selectedEntry.id}
                onValueChange={setSelectedOrderId}
                options={filteredEntries.map((item) => ({
                  value: item.id,
                  label: copy.optionFormat
                    .replace("{type}", translateWorkOrderDisplayText(item.type, locale))
                    .replace("{quantity}", `${item.quantity.toLocaleString()}${common.quantitySuffix}`),
                }))}
                ariaLabel={copy.orderTypeLabel}
                className="mt-2"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className={MODAL_CONTENT_READONLY_PANEL_CLASS}>
              <div className={MODAL_CONTENT_LABEL_CLASS}>{copy.orderedQuantityLabel}</div>
              <div className={`mt-1 ${MODAL_CONTENT_VALUE_CLASS}`}>{orderedQuantity.toLocaleString()}{common.quantitySuffix}</div>
            </div>
            <label className={MODAL_CONTENT_FIELD_PANEL_CLASS}>
              <div className={MODAL_CONTENT_LABEL_CLASS}>{copy.appliedQuantityLabel}</div>
              <WaflInput
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={appliedQuantityInput}
                onChange={(event) => setAppliedQuantityInput(event.target.value)}
                className="mt-2"
              />
            </label>
            <div className={MODAL_CONTENT_READONLY_PANEL_CLASS}>
              <div className={MODAL_CONTENT_LABEL_CLASS}>{copy.nextInventoryLabel}</div>
              <div className={`mt-1 ${MODAL_CONTENT_VALUE_CLASS}`}>{nextInventoryQuantity.toLocaleString()}{common.quantitySuffix}</div>
            </div>
          </div>

          <label className={`block ${MODAL_CONTENT_FIELD_PANEL_CLASS}`}>
            <div className={MODAL_CONTENT_LABEL_CLASS}>{copy.memoLabel}</div>
            <WaflTextarea
              value={inspectionMemo}
              onChange={(event) => setInspectionMemo(event.target.value)}
              rows={4}
              placeholder={copy.memoPlaceholder}
              className="mt-2"
            />
          </label>
        </div>
      ) : (
        <div className={MODAL_CONTENT_EMPTY_STATE_CLASS}>
          {copy.empty}
        </div>
      )}
    </ModalShell>
  );
}
