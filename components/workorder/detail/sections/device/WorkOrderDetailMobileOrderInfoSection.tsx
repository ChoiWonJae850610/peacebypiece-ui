import type { ReactNode } from "react";

import { useI18n } from "@/lib/i18n";
import { calculateOrderEntryAmount, calculateOrderEntryTotals, calculateOutsourcingAmount } from "@/lib/workorder/detail/detailCalculations";
import { formatCurrencySummary, formatOrderSummary } from "@/lib/workorder/detail/detailFormatting";
import { getTranslatedWorkOrderSelectDisplayValue } from "@/lib/workorder/detail/selectDisplayPresentation";
import { getInspectionStatusTone } from "@/lib/workorder/presentation/statusPresentation";
import { translateInspectionStatusLabel, translateWorkOrderDisplayText } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import { DeleteButton, EditableValue, SectionHeader } from "@/components/workorder/detail/shared/detailEditorShared";
import type { WorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

type OrderInfoProps = WorkOrderDetailViewModel["orderInfoProps"];

function MobileDetailField({
  label,
  children,
  span = false,
}: {
  label: string;
  children: ReactNode;
  span?: boolean;
}) {
  return (
    <div className={`min-w-0 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 ${span ? "min-[360px]:col-span-2" : ""}`}>
      <div className="mb-1 text-xs text-stone-500">{label}</div>
      <div className="min-h-8 text-sm font-medium text-stone-900">{children}</div>
    </div>
  );
}

function MobileReadOnlyAmount({ value, suffix }: { value: number; suffix: string }) {
  return (
    <div className="flex min-h-8 items-center justify-end rounded-xl bg-white px-3 text-sm font-semibold tabular-nums text-stone-900">
      {value.toLocaleString()}{suffix}
    </div>
  );
}

export default function WorkOrderDetailMobileOrderInfoSection({
  orderEntries,
  factoryOptions,
  orderTypeOptions,
  outsourcing,
  outsourcingVendorOptionsById,
  outsourcingProcessOptions,
  open,
  onToggle,
  onAdd,
  onRemove,
  onAddOutsourcing,
  onRemoveOutsourcing,
  editingCell,
  editingValue,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  canOpenInspectionModal,
  onOpenInspectionModal,
  locked = false,
}: OrderInfoProps) {
  const { i18n, locale } = useI18n();
  const copy = i18n.workorder.ui.sections.orderInfo;
  const outsourcingCopy = i18n.workorder.ui.sections.outsourcing;
  const common = i18n.workorder.ui.common;
  void onRemove;

  const visibleOrderEntries = orderEntries.slice(0, 1);
  const totals = calculateOrderEntryTotals(visibleOrderEntries);
  const outsourcingTotals = outsourcing.reduce(
    (acc, item) => {
      const quantity = Math.max(0, Number(item.quantity) || 0);
      const unitCost = Math.max(0, Number(item.unitCost) || 0);
      const lossCost = Math.max(0, Number(item.lossCost) || 0);
      acc.quantity += quantity;
      acc.unitCost += quantity * unitCost;
      acc.lossCost += quantity * lossCost;
      acc.totalCost += Number(item.totalCost) || quantity * (unitCost + lossCost);
      return acc;
    },
    { quantity: 0, unitCost: 0, lossCost: 0, totalCost: 0 },
  );
  const combinedTotal = totals.totalCost + outsourcingTotals.totalCost;
  const hasRows = visibleOrderEntries.length > 0 || outsourcing.length > 0;

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl bg-stone-50 p-3 sm:p-3.5">
      <SectionHeader
        title={copy.title}
        summary={formatOrderSummary(visibleOrderEntries, i18n)}
        open={open}
        onToggle={onToggle}
        rightSlot={
          canOpenInspectionModal ? (
            <button
              type="button"
              onClick={onOpenInspectionModal}
              className="pbp-interactive-button pbp-action-secondary w-full rounded-xl px-3 py-2 text-xs font-medium sm:w-auto"
            >
              {copy.inspectionAction}
            </button>
          ) : null
        }
      />

      {open ? (
        <div className="mt-3 grid gap-3">
          {!hasRows ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-7 text-center text-sm text-stone-500">
              {copy.empty}
            </div>
          ) : null}

          {visibleOrderEntries.map((item) => {
            const orderLineAmount = calculateOrderEntryAmount(item);

            return (
              <article key={item.id} className="min-w-0 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm sm:p-4">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <div>
                    <div className="text-[11px] font-semibold text-stone-500">{copy.fields.lineType}</div>
                    <div className="mt-0.5 text-sm font-semibold text-stone-900">{copy.sewingLineTypeLabel}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-stone-900 px-2.5 py-1 text-xs font-semibold tabular-nums text-white">
                      {orderLineAmount.toLocaleString()}{common.currencySuffix}
                    </span>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${getInspectionStatusTone(item.inspectionStatus)}`}>
                      {translateInspectionStatusLabel(item.inspectionStatus, i18n)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 text-sm min-[360px]:grid-cols-2">
                  <MobileDetailField label={copy.fields.item}>
                    <EditableValue section="order" rowId={item.id} field="type" value={item.type} displayValue={translateWorkOrderDisplayText(item.type, locale)} options={orderTypeOptions} centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
                  </MobileDetailField>
                  <MobileDetailField label={copy.fields.vendor}>
                    <EditableValue section="order" rowId={item.id} field="factory" value={item.factory} displayValue={translateWorkOrderDisplayText(item.factory, locale)} options={factoryOptions} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
                  </MobileDetailField>
                  <MobileDetailField label={copy.fields.quantity}>
                    <EditableValue section="order" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} alignRight compact editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
                  </MobileDetailField>
                  <MobileDetailField label={copy.fields.laborCost}>
                    <EditableValue section="order" rowId={item.id} field="laborCost" value={item.laborCost.toLocaleString()} alignRight compact editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
                  </MobileDetailField>
                  <MobileDetailField label={copy.fields.lossCost}>
                    <EditableValue section="order" rowId={item.id} field="lossCost" value={item.lossCost.toLocaleString()} alignRight compact editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
                  </MobileDetailField>
                  <MobileDetailField label={copy.fields.amount}>
                    <MobileReadOnlyAmount value={orderLineAmount} suffix={common.currencySuffix} />
                  </MobileDetailField>
                </div>
              </article>
            );
          })}

          {outsourcing.map((item, rowIndex) => {
            const outsourcingLineAmount = calculateOutsourcingAmount(item);

            return (
              <article key={item.id} className="min-w-0 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm sm:p-4">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold text-stone-500">{copy.fields.lineType}</div>
                    <div className="mt-0.5 text-sm font-semibold text-stone-900">
                      {copy.outsourcingLineTypeLabelPrefix} {copy.outsourcingLineTypeLabelSuffix}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-stone-900 px-2.5 py-1 text-xs font-semibold tabular-nums text-white">
                      {outsourcingLineAmount.toLocaleString()}{common.currencySuffix}
                    </span>
                    <DeleteButton onClick={() => onRemoveOutsourcing(item.id)} srLabel={`${item.process || outsourcingCopy.fallbackItem.replace("{index}", String(rowIndex + 1))} ${common.deleteSuffix}`} disabled={locked} />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 text-sm min-[360px]:grid-cols-2">
                  <MobileDetailField label={copy.fields.item}>
                    <EditableValue section="outsourcing" rowId={item.id} field="process" value={item.process} displayValue={getTranslatedWorkOrderSelectDisplayValue(item.process, (value) => translateWorkOrderDisplayText(value, locale))} options={outsourcingProcessOptions} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
                  </MobileDetailField>
                  <MobileDetailField label={copy.fields.vendor}>
                    <EditableValue section="outsourcing" rowId={item.id} field="vendor" value={item.vendor} displayValue={getTranslatedWorkOrderSelectDisplayValue(item.vendor, (value) => translateWorkOrderDisplayText(value, locale))} options={outsourcingVendorOptionsById[item.id] ?? []} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
                  </MobileDetailField>
                  <MobileDetailField label={copy.fields.quantity}>
                    <EditableValue section="outsourcing" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} alignRight compact editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
                  </MobileDetailField>
                  <MobileDetailField label={copy.fields.laborCost}>
                    <EditableValue section="outsourcing" rowId={item.id} field="unitCost" value={item.unitCost.toLocaleString()} alignRight compact editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
                  </MobileDetailField>
                  <MobileDetailField label={copy.fields.lossCost}>
                    <EditableValue section="outsourcing" rowId={item.id} field="lossCost" value={(item.lossCost ?? 0).toLocaleString()} alignRight compact editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
                  </MobileDetailField>
                  <MobileDetailField label={copy.fields.amount}>
                    <MobileReadOnlyAmount value={outsourcingLineAmount} suffix={common.currencySuffix} />
                  </MobileDetailField>
                </div>
              </article>
            );
          })}

          {hasRows ? (
            <div className="rounded-2xl border border-stone-200 bg-stone-950 p-3.5 text-white sm:p-4">
              <div className="text-xs font-medium text-white/55">{copy.totalRow}</div>
              <div className="mt-2 grid grid-cols-1 gap-2 text-sm min-[360px]:grid-cols-2 sm:grid-cols-4">
                <div>
                  <div className="text-xs text-white/55">{copy.fields.quantity}</div>
                  <div className="mt-1 font-semibold tabular-nums">{(totals.quantity + outsourcingTotals.quantity).toLocaleString()}{common.quantitySuffix}</div>
                </div>
                <div>
                  <div className="text-xs text-white/55">{copy.fields.laborCost}</div>
                  <div className="mt-1 font-semibold tabular-nums">{(totals.laborCost + outsourcingTotals.unitCost).toLocaleString()}{common.currencySuffix}</div>
                </div>
                <div>
                  <div className="text-xs text-white/55">{copy.fields.lossCost}</div>
                  <div className="mt-1 font-semibold tabular-nums">{(totals.lossCost + outsourcingTotals.lossCost).toLocaleString()}{common.currencySuffix}</div>
                </div>
                <div>
                  <div className="text-xs text-white/55">{copy.totalRow}</div>
                  <div className="mt-1 font-semibold tabular-nums">{formatCurrencySummary(combinedTotal, i18n)}</div>
                </div>
              </div>
            </div>
          ) : null}

          {!locked && visibleOrderEntries.length === 0 ? (
            <button type="button" onClick={onAdd} className="pbp-interactive-button pbp-action-add flex w-full items-center justify-center rounded-xl px-3 py-3 text-sm font-medium">
              {copy.factoryAddButton}
            </button>
          ) : null}
          {!locked ? (
            <button type="button" onClick={onAddOutsourcing} className="pbp-interactive-button pbp-action-secondary flex w-full items-center justify-center rounded-xl border border-dashed px-3 py-3 text-sm font-medium">
              {copy.outsourcingOrder.addButton}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
