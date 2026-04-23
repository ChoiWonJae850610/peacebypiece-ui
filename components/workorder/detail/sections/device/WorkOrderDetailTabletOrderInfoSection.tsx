import { useI18n } from "@/lib/i18n";
import { calculateOrderEntryTotals } from "@/lib/workorder/detail/detailCalculations";
import { formatOrderSummary } from "@/lib/workorder/detail/detailFormatting";
import { getInspectionStatusLabel, getInspectionStatusTone } from "@/lib/workorder/presentation/statusPresentation";
import { DeleteButton, SectionHeader } from "@/components/workorder/detail/shared/detailEditorShared";
import type { WorkOrderDetailViewModel } from "@/components/workorder/detail/views/detailViewTypes";

type OrderInfoProps = WorkOrderDetailViewModel["orderInfoProps"];

export default function WorkOrderDetailTabletOrderInfoSection({
  orderEntries,
  open,
  onToggle,
  onAdd,
  onRemove,
  canOpenInspectionModal,
  onOpenInspectionModal,
  locked = false,
}: OrderInfoProps) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.sections.orderInfo;
  const common = i18n.workorder.ui.common;
  const totals = calculateOrderEntryTotals(orderEntries);

  return (
    <section className="overflow-hidden rounded-2xl bg-stone-50 p-4">
      <SectionHeader
        title={copy.title}
        summary={formatOrderSummary(orderEntries)}
        open={open}
        onToggle={onToggle}
        rightSlot={
          canOpenInspectionModal ? (
            <button
              type="button"
              onClick={onOpenInspectionModal}
              className="pbp-interactive-button rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700"
            >
              {copy.inspectionAction}
            </button>
          ) : null
        }
      />
      {open ? (
        <div className="mt-4 grid gap-3">
          {orderEntries.map((item, index) => (
            <article key={item.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-stone-900">{item.factory || copy.fallbackItem.replace("{index}", String(index + 1))}</div>
                  <div className="mt-1 text-sm text-stone-500">{item.type} · {item.dueDate || "-"}</div>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${getInspectionStatusTone(item.inspectionStatus ?? "order_pending")}`}>
                  {getInspectionStatusLabel(item.inspectionStatus ?? "order_pending")}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl bg-stone-50 px-3 py-3">
                  <dt className="text-xs text-stone-500">{copy.fields.quantity}</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-stone-900">{item.quantity.toLocaleString()}{common.quantitySuffix}</dd>
                </div>
                <div className="rounded-xl bg-stone-50 px-3 py-3">
                  <dt className="text-xs text-stone-500">{copy.fields.laborCost}</dt>
                  <dd className="mt-1 font-semibold tabular-nums text-stone-900">{item.laborCost.toLocaleString()}{common.currencySuffix}</dd>
                </div>
                <div className="rounded-xl bg-stone-50 px-3 py-3">
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

          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-stone-200 bg-white p-4">
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
