import { useI18n } from "@/lib/i18n";
import { calculateOrderEntryTotals } from "@/lib/workorder/detail/detailCalculations";
import { formatCurrencySummaryParts, formatOrderSummary } from "@/lib/workorder/detail/detailFormatting";
import { getInspectionStatusTone } from "@/lib/workorder/presentation/statusPresentation";
import { translateInspectionStatusLabel, translateWorkOrderDisplayText } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import { EditableValue, SectionHeader } from "@/components/workorder/detail/shared/detailEditorShared";
import type { WorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

type OrderInfoProps = WorkOrderDetailViewModel["orderInfoProps"];

export default function WorkOrderDetailTabletOrderInfoSection({
  orderEntries,
  open,
  onToggle,
  onAdd,
  onRemove,
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
  const common = i18n.workorder.ui.common;
  void onRemove;
  const visibleOrderEntries = orderEntries.slice(0, 1);
  const totals = calculateOrderEntryTotals(visibleOrderEntries);
  const totalCostSummary = formatCurrencySummaryParts(totals.totalCost, i18n);
  const dueDatePickerLabels = {
    placeholder: copy.datePicker.placeholder,
    clear: copy.datePicker.clear,
    done: copy.datePicker.done,
    selected: copy.datePicker.selected,
    calendarAria: copy.datePicker.calendarAria,
  };

  return (
    <section className="overflow-hidden rounded-2xl bg-stone-50 p-4">
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
              className="pbp-interactive-button pbp-action-secondary rounded-xl px-3 py-2 text-sm font-medium"
            >
              {copy.inspectionAction}
            </button>
          ) : null
        }
      />
      {open ? (
        <div className="mt-4 grid gap-3">
          {visibleOrderEntries.map((item, index) => (
            <article key={item.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-stone-900">{item.factory || copy.fallbackItem.replace("{index}", String(index + 1))}</div>
                  <div className="mt-1 text-sm text-stone-500">{translateWorkOrderDisplayText(item.type, locale)}</div>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${getInspectionStatusTone(item.inspectionStatus)}`}>
                  {translateInspectionStatusLabel(item.inspectionStatus, i18n)}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <div className="pbp-workorder-editable-panel rounded-xl border px-3 py-3">
                  <dt className="text-xs text-stone-500">{copy.fields.dueDate}</dt>
                  <dd className="mt-1">
                    <EditableValue
                      section="order"
                      rowId={item.id}
                      field="dueDate"
                      value={item.dueDate}
                      editingCell={editingCell}
                      editingValue={editingValue}
                      inputType="date"
                      datePickerLabels={dueDatePickerLabels}
                      datePickerLocale={locale}
                      centered
                      compact
                      onStartEdit={onStartEdit}
                      onCommit={onCommitEdit}
                      onCancel={onCancelEdit}
                      disabled={locked}
                    />
                  </dd>
                </div>
                <div className="pbp-workorder-editable-panel rounded-xl border px-3 py-3">
                  <dt className="text-xs text-stone-500">{copy.fields.quantity}</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-stone-900">{item.quantity.toLocaleString()}{common.quantitySuffix}</dd>
                </div>
                <div className="pbp-workorder-editable-panel rounded-xl border px-3 py-3">
                  <dt className="text-xs text-stone-500">{copy.fields.laborCost}</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-stone-900">{item.laborCost.toLocaleString()}{common.currencySuffix}</dd>
                </div>
                <div className="pbp-workorder-editable-panel rounded-xl border px-3 py-3">
                  <dt className="text-xs text-stone-500">{copy.fields.lossCost}</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-stone-900">{item.lossCost.toLocaleString()}{common.currencySuffix}</dd>
                </div>
              </dl>
            </article>
          ))}

          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-stone-200 bg-white p-4 md:grid-cols-4">
            <div>
              <div className="text-xs text-stone-500">{copy.fields.quantity}</div>
              <div className="mt-1 text-sm font-semibold tabular-nums text-stone-900">{totals.quantity.toLocaleString()}{common.quantitySuffix}</div>
            </div>
            <div>
              <div className="text-xs text-stone-500">{copy.fields.laborCost}</div>
              <div className="mt-1 text-sm font-semibold tabular-nums text-stone-900">{totals.laborCost.toLocaleString()}{common.currencySuffix}</div>
            </div>
            <div>
              <div className="text-xs text-stone-500">{copy.fields.lossCost}</div>
              <div className="mt-1 text-sm font-semibold tabular-nums text-stone-900">{totals.lossCost.toLocaleString()}{common.currencySuffix}</div>
            </div>
            <div>
              <div className="text-xs text-stone-500">{totalCostSummary.label}</div>
              <div className="mt-1 text-sm font-semibold tabular-nums text-stone-900">{totalCostSummary.value}</div>
            </div>
          </div>

          {!locked && visibleOrderEntries.length === 0 ? (
            <button
              type="button"
              onClick={onAdd}
              className="pbp-interactive-button pbp-action-add flex w-full items-center justify-center rounded-xl px-3 py-3 text-sm font-medium"
            >
              {copy.factoryAddButton}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
