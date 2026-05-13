import { useI18n } from "@/lib/i18n";
import { calculateOrderEntryTotals } from "@/lib/workorder/detail/detailCalculations";
import { formatOrderSummary } from "@/lib/workorder/detail/detailFormatting";
import { getInspectionStatusTone } from "@/lib/workorder/presentation/statusPresentation";
import { translateInspectionStatusLabel, translateWorkOrderDisplayText } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import { DeleteButton, SectionHeader } from "@/components/workorder/detail/shared/detailEditorShared";
import type { WorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

type OrderInfoProps = WorkOrderDetailViewModel["orderInfoProps"];

export default function WorkOrderDetailMobileOrderInfoSection({
  orderEntries,
  open,
  onToggle,
  onAdd,
  onRemove,
  canOpenInspectionModal,
  onOpenInspectionModal,
  locked = false,
}: OrderInfoProps) {
  const { i18n, locale } = useI18n();
  const copy = i18n.workorder.ui.sections.orderInfo;
  const common = i18n.workorder.ui.common;
  const totals = calculateOrderEntryTotals(orderEntries);

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl bg-stone-50 p-3 sm:p-3.5">
      <SectionHeader
        title={copy.title}
        summary={formatOrderSummary(orderEntries, i18n)}
        open={open}
        onToggle={onToggle}
        rightSlot={
          canOpenInspectionModal ? (
            <button
              type="button"
              onClick={onOpenInspectionModal}
              className="pbp-interactive-button rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 w-full sm:w-auto"
            >
              {copy.inspectionAction}
            </button>
          ) : null
        }
      />

      {open ? (
        <div className="mt-3 grid gap-3">
          {orderEntries.map((item, index) => (
            <article key={item.id} className="min-w-0 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-sm sm:p-4">
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <div>
                  <div className="text-sm font-semibold text-stone-900">{item.factory || copy.fallbackItem.replace("{index}", String(index + 1))}</div>
                  <div className="mt-1 text-xs text-stone-500">{translateWorkOrderDisplayText(item.type, locale)} · {item.dueDate || "-"}</div>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${getInspectionStatusTone(item.inspectionStatus)}`}>
                  {translateInspectionStatusLabel(item.inspectionStatus, i18n)}
                </span>
              </div>

              <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-sm min-[360px]:grid-cols-2">
                <div>
                  <dt className="text-xs text-stone-500">{copy.fields.quantity}</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-stone-900">{item.quantity.toLocaleString()}{common.quantitySuffix}</dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-500">{copy.fields.laborCost}</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-stone-900">{item.laborCost.toLocaleString()}{common.currencySuffix}</dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-500">{copy.fields.lossCost}</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-stone-900">{item.lossCost.toLocaleString()}{common.currencySuffix}</dd>
                </div>
              </dl>

              {!locked ? (
                <div className="mt-3 flex justify-end">
                  <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.factory || copy.fallbackItem.replace("{index}", String(index + 1))} ${common.deleteSuffix}`} disabled={locked} />
                </div>
              ) : null}
            </article>
          ))}

          <div className="rounded-2xl border border-stone-200 bg-white p-3.5 sm:p-4">
            <div className="text-xs font-medium text-stone-500">{copy.totalRow}</div>
            <div className="mt-2 grid grid-cols-1 gap-2 text-sm min-[360px]:grid-cols-3">
              <div>
                <div className="text-xs text-stone-500">{copy.fields.quantity}</div>
                <div className="mt-1 font-semibold tabular-nums text-stone-900">{totals.quantity.toLocaleString()}{common.quantitySuffix}</div>
              </div>
              <div>
                <div className="text-xs text-stone-500">{copy.fields.laborCost}</div>
                <div className="mt-1 font-semibold tabular-nums text-stone-900">{totals.laborCost.toLocaleString()}{common.currencySuffix}</div>
              </div>
              <div>
                <div className="text-xs text-stone-500">{copy.fields.lossCost}</div>
                <div className="mt-1 font-semibold tabular-nums text-stone-900">{totals.lossCost.toLocaleString()}{common.currencySuffix}</div>
              </div>
            </div>
          </div>

          {!locked ? (
            <button
              type="button"
              onClick={onAdd}
              className="pbp-interactive-button flex w-full items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white px-3 py-3 text-sm font-medium text-stone-700"
            >
              {copy.addButton}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
