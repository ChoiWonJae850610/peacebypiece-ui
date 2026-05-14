import OrderInfoHubDebugPanel from "@/components/debug/OrderInfoHubDebugPanel";
import { useI18n } from "@/lib/i18n";
import type { OrderInfoHubPolicy } from "@/lib/workorder/orderInfoHubPolicy";
import { calculateOrderEntryTotals } from "@/lib/workorder/detail/detailCalculations";
import { formatOrderSummary } from "@/lib/workorder/detail/detailFormatting";
import { getInspectionStatusTone } from "@/lib/workorder/presentation/statusPresentation";
import { translateInspectionStatusLabel, translateWorkOrderDisplayText } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import {
  DeleteButton,
  EditableValue,
  SectionHeader,
  TABLE_BODY_CELL_CLASS,
  TABLE_HEADER_CELL_CLASS,
  type EditableCell,
  type EditableSectionKey,
  type OrderEntryState,
} from "@/components/workorder/detail/shared/detailEditorShared";

export default function OrderInfoSection({
  orderEntries,
  factoryOptions,
  orderTypeOptions,
  open,
  onToggle,
  editingCell,
  editingValue,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onAdd,
  onRemove,
  canOpenInspectionModal,
  locked = false,
  orderHubPolicy,
  onOpenInspectionModal,
  showDebugPanel = false,
}: {
  orderEntries: OrderEntryState[];
  factoryOptions: readonly string[];
  orderTypeOptions: readonly string[];
  open: boolean;
  onToggle: () => void;
  editingCell: EditableCell;
  editingValue: string;
  onStartEdit: (section: EditableSectionKey, rowId: string, field: string, value: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  canOpenInspectionModal: boolean;
  locked?: boolean;
  orderHubPolicy: OrderInfoHubPolicy;
  onOpenInspectionModal: () => void;
  showDebugPanel?: boolean;
}) {
  const { i18n, locale } = useI18n();
  const copy = i18n.workorder.ui.sections.orderInfo;
  const common = i18n.workorder.ui.common;
  const totals = calculateOrderEntryTotals(orderEntries);
  const inspectionStatusCounts = orderEntries.reduce<Record<string, { label: string; tone: string; count: number }>>((acc, item) => {
    const key = item.inspectionStatus ?? "__pending";
    const current = acc[key] ?? {
      label: translateInspectionStatusLabel(item.inspectionStatus, i18n),
      tone: getInspectionStatusTone(item.inspectionStatus),
      count: 0,
    };
    current.count += 1;
    acc[key] = current;
    return acc;
  }, {});
  const inspectionStatusSummary = Object.values(inspectionStatusCounts);
  const orderSummary = formatOrderSummary(orderEntries, i18n);
  const inspectionButton = canOpenInspectionModal ? (
    <button
      type="button"
      onClick={onOpenInspectionModal}
      className="pbp-interactive-button inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
    >
      {copy.inspectionAction}
    </button>
  ) : null;

  return (
    <div className="overflow-hidden rounded-[24px] border border-stone-200 bg-white p-3.5 shadow-sm xl:p-4">
      <SectionHeader title={copy.title} summary={orderSummary} open={open} onToggle={onToggle} rightSlot={inspectionButton} />
      {open ? (
        <>
          {showDebugPanel ? <OrderInfoHubDebugPanel policy={orderHubPolicy} /> : null}
          {inspectionStatusSummary.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-2xl border border-stone-200 bg-stone-50/80 px-3 py-2">
              <span className="mr-1 text-[11px] font-semibold text-stone-500">{copy.statusSummaryLabel}</span>
              {inspectionStatusSummary.map((status) => (
                <span key={status.label} className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium leading-none ${status.tone}`}>
                  {status.label} {status.count}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-3 max-w-full overflow-x-auto rounded-xl border border-stone-200 bg-white">
            <table className="min-w-[720px] w-full table-fixed text-left">
              <colgroup>
                <col className="w-[13%]" />
                <col className="w-[19%]" />
                <col className="w-[18%]" />
                <col className="w-[13%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[9%]" />
              </colgroup>
              <thead className="text-stone-500">
                <tr className="border-b border-stone-200">
                  {[copy.fields.type, copy.fields.factory, copy.fields.dueDate, copy.fields.quantity, copy.fields.laborCost, copy.fields.lossCost, ""].map((header, index) => (
                    <th key={`${header}-${index}`} className={TABLE_HEADER_CELL_CLASS}>
                      <span className="block w-full whitespace-nowrap leading-4">{header}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orderEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-sm text-stone-500">{copy.empty}</td>
                  </tr>
                ) : null}
                {orderEntries.map((item, rowIndex) => (
                  <tr key={item.id} className={`border-b border-stone-100 ${rowIndex % 2 === 0 ? "bg-white" : "bg-stone-50/70"} hover:bg-stone-50`}>
                    <td className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap`}><EditableValue section="order" rowId={item.id} field="type" value={item.type} displayValue={translateWorkOrderDisplayText(item.type, locale)} options={orderTypeOptions} centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="order" rowId={item.id} field="factory" value={item.factory} displayValue={translateWorkOrderDisplayText(item.factory, locale)} options={factoryOptions} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap`}><EditableValue section="order" rowId={item.id} field="dueDate" value={item.dueDate} centered editingCell={editingCell} editingValue={editingValue} inputType="date" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap`}><EditableValue section="order" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap`}><EditableValue section="order" rowId={item.id} field="laborCost" value={item.laborCost.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap`}><EditableValue section="order" rowId={item.id} field="lossCost" value={item.lossCost.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className="px-1.5 py-2 text-center align-middle lg:px-2">
                      <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.factory || copy.fallbackItem.replace("{index}", String(rowIndex + 1))} ${common.deleteSuffix}`} disabled={locked} />
                    </td>
                  </tr>
                ))}
                <tr className="bg-stone-50/70">
                  <td className="px-3 py-2 text-xs font-medium text-stone-500" colSpan={3}>{copy.totalRow}</td>
                  <td className="px-3 py-2 text-center text-[11px] font-semibold text-stone-900 tabular-nums lg:text-[11px]">{totals.quantity.toLocaleString()}{common.quantitySuffix}</td>
                  <td className="px-3 py-2 text-center text-[11px] font-semibold text-stone-900 tabular-nums lg:text-[11px]">{totals.laborCost.toLocaleString()}{common.currencySuffix}</td>
                  <td className="px-3 py-2 text-center text-[11px] font-semibold text-stone-900 tabular-nums lg:text-[11px]">{totals.lossCost.toLocaleString()}{common.currencySuffix}</td>
                  <td />
                </tr>
                {locked ? null : (
                  <tr>
                    <td colSpan={7} className="px-3 pb-2 pt-2">
                      <button
                        type="button"
                        onClick={onAdd}
                        className="pbp-interactive-button flex w-full items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white px-3 py-2.5 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
                      >
                        {copy.addButton}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
