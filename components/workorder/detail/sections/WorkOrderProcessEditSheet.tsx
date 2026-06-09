"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import ModalShell from "@/components/common/modal/ModalShell";
import { MODAL_ACTION_LABELS, renderModalFooterActions } from "@/components/common/modal/modalActions";
import { blurActiveModalElement } from "@/components/common/modal/modalUtils";
import { AppSelect, type AppSelectOption } from "@/components/common/ui";
import { useI18n, type Locale } from "@/lib/i18n";
import { DEFAULT_ORDER_TYPE } from "@/lib/constants/workorderOptions";
import { translateWorkOrderDisplayText } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import type { OrderEntryState } from "@/components/workorder/detail/shared/detailEditorShared";
import type { Outsourcing } from "@/types/workorder";

export type WorkOrderProcessSheetMode = "order" | "outsourcing";

export type WorkOrderOrderProcessDraft = {
  type: string;
  factory: string;
  quantity: number;
  laborCost: number;
  lossCost: number;
};

export type WorkOrderOutsourcingProcessDraft = {
  process: string;
  vendor: string;
  quantity: number;
  unitCost: number;
  lossCost: number;
};

export type WorkOrderProcessSheetDraft = WorkOrderOrderProcessDraft | WorkOrderOutsourcingProcessDraft;

type Props = {
  open: boolean;
  mode: WorkOrderProcessSheetMode;
  orderEntry: OrderEntryState | null;
  outsourcing: Outsourcing | null;
  orderTypeOptions: readonly string[];
  factoryOptions: readonly string[];
  outsourcingProcessOptions: readonly string[];
  onClose: () => void;
  onApply: (payload: {
    mode: WorkOrderProcessSheetMode;
    orderEntryId: string | null;
    outsourcingId: string | null;
    draft: WorkOrderProcessSheetDraft;
  }) => void;
};

const fieldPanelClass = "grid gap-1.5";
const labelClass = "text-xs font-semibold text-[var(--pbp-text-muted)]";
const inputClass = "min-h-11 w-full rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-4 text-base font-semibold text-[var(--pbp-text-primary)] outline-none transition focus:border-[var(--pbp-border-strong)] focus:ring-2 focus:ring-[var(--pbp-focus-ring)] focus:ring-offset-2 focus:ring-offset-[var(--pbp-surface)] md:text-sm";

function toNumber(value: string) {
  const normalized = value.replace(/,/g, "").trim();
  const next = Number(normalized);
  return Number.isFinite(next) ? Math.max(0, next) : 0;
}

function toOrderDraft(orderEntry: OrderEntryState | null): WorkOrderOrderProcessDraft {
  return {
    type: orderEntry?.type ?? DEFAULT_ORDER_TYPE,
    factory: orderEntry?.factory ?? "",
    quantity: orderEntry?.quantity ?? 0,
    laborCost: orderEntry?.laborCost ?? 0,
    lossCost: orderEntry?.lossCost ?? 0,
  };
}

function toOutsourcingDraft(outsourcing: Outsourcing | null): WorkOrderOutsourcingProcessDraft {
  return {
    process: outsourcing?.process ?? "",
    vendor: outsourcing?.vendor ?? "",
    quantity: outsourcing?.quantity ?? 0,
    unitCost: outsourcing?.unitCost ?? 0,
    lossCost: outsourcing?.lossCost ?? 0,
  };
}

function buildOptions(values: readonly string[], locale: Locale): AppSelectOption[] {
  return values.map((value) => ({ value, label: translateWorkOrderDisplayText(value, locale) }));
}

function handleProcessInputPointerDown() {
  blurActiveModalElement();
}

function handleProcessInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.blur();
}

export default function WorkOrderProcessEditSheet({
  open,
  mode,
  orderEntry,
  outsourcing,
  orderTypeOptions,
  factoryOptions,
  outsourcingProcessOptions,
  onClose,
  onApply,
}: Props) {
  const { i18n, locale } = useI18n();
  const copy = i18n.workorder.ui.sections.orderInfo;
  const [orderDraft, setOrderDraft] = useState<WorkOrderOrderProcessDraft>(() => toOrderDraft(orderEntry));
  const [outsourcingDraft, setOutsourcingDraft] = useState<WorkOrderOutsourcingProcessDraft>(() => toOutsourcingDraft(outsourcing));

  useEffect(() => {
    if (!open) return;
    setOrderDraft(toOrderDraft(orderEntry));
    setOutsourcingDraft(toOutsourcingDraft(outsourcing));
  }, [open, orderEntry, outsourcing]);

  const orderTypeSelectOptions = useMemo(() => buildOptions(orderTypeOptions, locale), [locale, orderTypeOptions]);
  const factorySelectOptions = useMemo(() => buildOptions(factoryOptions, locale), [locale, factoryOptions]);
  const outsourcingProcessSelectOptions = useMemo(() => buildOptions(outsourcingProcessOptions, locale), [locale, outsourcingProcessOptions]);

  const isOrderMode = mode === "order";
  const isApplyDisabled = isOrderMode
    ? orderDraft.type.trim().length === 0
    : outsourcingDraft.process.trim().length === 0;

  const handleApply = () => {
    if (isApplyDisabled) return;

    blurActiveModalElement();

    if (isOrderMode) {
      onApply({
        mode,
        orderEntryId: orderEntry?.id ?? null,
        outsourcingId: null,
        draft: {
          ...orderDraft,
          quantity: Math.max(0, Number(orderDraft.quantity) || 0),
          laborCost: Math.max(0, Number(orderDraft.laborCost) || 0),
          lossCost: Math.max(0, Number(orderDraft.lossCost) || 0),
        },
      });
    } else {
      onApply({
        mode,
        orderEntryId: null,
        outsourcingId: outsourcing?.id ?? null,
        draft: {
          ...outsourcingDraft,
          process: outsourcingDraft.process.trim(),
          vendor: outsourcingDraft.vendor.trim(),
          quantity: Math.max(0, Number(outsourcingDraft.quantity) || 0),
          unitCost: Math.max(0, Number(outsourcingDraft.unitCost) || 0),
          lossCost: Math.max(0, Number(outsourcingDraft.lossCost) || 0),
        },
      });
    }
    onClose();
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={isOrderMode ? (orderEntry ? copy.editOrderSheetTitle : copy.addOrderSheetTitle) : (outsourcing ? copy.editOutsourcingSheetTitle : copy.addOutsourcingSheetTitle)}
      description={isOrderMode ? copy.editOrderSheetDescription : copy.editOutsourcingSheetDescription}
      maxWidthClass="md:max-w-lg"
      bodyClassName="pbp-mobile-no-zoom"
      footer={renderModalFooterActions({
        layout: "end",
        primary: { label: MODAL_ACTION_LABELS.apply, onClick: handleApply, disabled: isApplyDisabled, tone: "primary" },
      })}
    >
      {isOrderMode ? (
        <div className="grid gap-4">
          <div className={fieldPanelClass}>
            <label className={labelClass}>{copy.fields.item}</label>
            <AppSelect value={orderDraft.type} options={orderTypeSelectOptions} onValueChange={(value) => { blurActiveModalElement(); setOrderDraft((current) => ({ ...current, type: value })); }} ariaLabel={copy.fields.item} contentClassName="z-[4000]" />
          </div>
          <div className={fieldPanelClass}>
            <label className={labelClass}>{copy.fields.vendor}</label>
            <AppSelect value={orderDraft.factory} options={factorySelectOptions} onValueChange={(value) => { blurActiveModalElement(); setOrderDraft((current) => ({ ...current, factory: value })); }} ariaLabel={copy.fields.vendor} contentClassName="z-[4000]" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className={fieldPanelClass}>
              <span className={labelClass}>{copy.fields.quantity}</span>
              <input type="number" min="0" inputMode="numeric" enterKeyHint="done" onPointerDown={handleProcessInputPointerDown} onTouchStart={handleProcessInputPointerDown} onKeyDown={handleProcessInputKeyDown} value={orderDraft.quantity} onChange={(event) => setOrderDraft((current) => ({ ...current, quantity: toNumber(event.target.value) }))} className={`${inputClass} text-right tabular-nums`} />
            </label>
            <label className={fieldPanelClass}>
              <span className={labelClass}>{copy.fields.laborCost}</span>
              <input type="number" min="0" inputMode="numeric" enterKeyHint="done" onPointerDown={handleProcessInputPointerDown} onTouchStart={handleProcessInputPointerDown} onKeyDown={handleProcessInputKeyDown} value={orderDraft.laborCost} onChange={(event) => setOrderDraft((current) => ({ ...current, laborCost: toNumber(event.target.value) }))} className={`${inputClass} text-right tabular-nums`} />
            </label>
            <label className={fieldPanelClass}>
              <span className={labelClass}>{copy.fields.lossCost}</span>
              <input type="number" min="0" inputMode="numeric" enterKeyHint="done" onPointerDown={handleProcessInputPointerDown} onTouchStart={handleProcessInputPointerDown} onKeyDown={handleProcessInputKeyDown} value={orderDraft.lossCost} onChange={(event) => setOrderDraft((current) => ({ ...current, lossCost: toNumber(event.target.value) }))} className={`${inputClass} text-right tabular-nums`} />
            </label>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className={fieldPanelClass}>
            <label className={labelClass}>{copy.fields.item}</label>
            <AppSelect value={outsourcingDraft.process} options={outsourcingProcessSelectOptions} onValueChange={(value) => { blurActiveModalElement(); setOutsourcingDraft((current) => ({ ...current, process: value })); }} ariaLabel={copy.fields.item} contentClassName="z-[4000]" />
          </div>
          <label className={fieldPanelClass}>
            <span className={labelClass}>{copy.fields.vendor}</span>
            <input type="text" enterKeyHint="done" onPointerDown={handleProcessInputPointerDown} onTouchStart={handleProcessInputPointerDown} onKeyDown={handleProcessInputKeyDown} value={outsourcingDraft.vendor} onChange={(event) => setOutsourcingDraft((current) => ({ ...current, vendor: event.target.value }))} className={inputClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className={fieldPanelClass}>
              <span className={labelClass}>{copy.fields.quantity}</span>
              <input type="number" min="0" inputMode="numeric" enterKeyHint="done" onPointerDown={handleProcessInputPointerDown} onTouchStart={handleProcessInputPointerDown} onKeyDown={handleProcessInputKeyDown} value={outsourcingDraft.quantity} onChange={(event) => setOutsourcingDraft((current) => ({ ...current, quantity: toNumber(event.target.value) }))} className={`${inputClass} text-right tabular-nums`} />
            </label>
            <label className={fieldPanelClass}>
              <span className={labelClass}>{copy.fields.laborCost}</span>
              <input type="number" min="0" inputMode="numeric" enterKeyHint="done" onPointerDown={handleProcessInputPointerDown} onTouchStart={handleProcessInputPointerDown} onKeyDown={handleProcessInputKeyDown} value={outsourcingDraft.unitCost} onChange={(event) => setOutsourcingDraft((current) => ({ ...current, unitCost: toNumber(event.target.value) }))} className={`${inputClass} text-right tabular-nums`} />
            </label>
            <label className={fieldPanelClass}>
              <span className={labelClass}>{copy.fields.lossCost}</span>
              <input type="number" min="0" inputMode="numeric" enterKeyHint="done" onPointerDown={handleProcessInputPointerDown} onTouchStart={handleProcessInputPointerDown} onKeyDown={handleProcessInputKeyDown} value={outsourcingDraft.lossCost} onChange={(event) => setOutsourcingDraft((current) => ({ ...current, lossCost: toNumber(event.target.value) }))} className={`${inputClass} text-right tabular-nums`} />
            </label>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
