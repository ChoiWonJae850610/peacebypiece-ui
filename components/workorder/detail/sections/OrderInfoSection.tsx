import OrderInfoHubDebugPanel from "@/components/debug/OrderInfoHubDebugPanel";
import { useI18n } from "@/lib/i18n";
import type { OrderInfoHubPolicy } from "@/lib/workorder/orderInfoHubPolicy";
import { calculateOrderEntryTotals } from "@/lib/workorder/detail/detailCalculations";
import { formatOrderSummary } from "@/lib/workorder/detail/detailFormatting";
import { getInspectionStatusLabel, getInspectionStatusTone } from "@/lib/workorder/presentation/statusPresentation";
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
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.sections.orderInfo;
  const common = i18n.workorder.ui.common;
  const totals = calculateOrderEntryTotals(orderEntries);
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
    <div className="overflow-hidden rounded-2xl bg-stone-50 p-3.5">
      <SectionHeader title={copy.title} summary={formatOrderSummary(orderEntries)} open={open} onToggle={onToggle} rightSlot={inspectionButton} />
      {open ? (
        <>
          {showDebugPanel ? <OrderInfoHubDebugPanel policy={orderHubPolicy} /> : null}
          <div className="mt-1 max-w-full overflow-hidden">
            <table className="w-full max-w-full table-fixed text-left">
              <colgroup>
                <col className="w-[13%]" />
                <col className="w-[17%]" />
                <col className="w-[15%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[7%]" />
              </colgroup>
              <thead className="text-stone-500">
                <tr className="border-b border-stone-200">
                  {[copy.fields.type, copy.fields.factory, copy.fields.dueDate, copy.fields.quantity, copy.fields.laborCost, copy.fields.lossCost, copy.fields.inspectionStatus, ""].map((header, index) => (
                    <th key={`${header}-${index}`} className={TABLE_HEADER_CELL_CLASS}>
                      <span className="block w-full whitespace-nowrap leading-4">{header}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orderEntries.map((item, rowIndex) => (
                  <tr key={item.id} className={`border-b border-stone-100 ${rowIndex % 2 === 0 ? "bg-white" : "bg-stone-50/70"} hover:bg-stone-50`}>
                    <td className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap`}><EditableValue section="order" rowId={item.id} field="type" value={item.type} options={orderTypeOptions} centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="order" rowId={item.id} field="factory" value={item.factory} options={factoryOptions} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap`}><EditableValue section="order" rowId={item.id} field="dueDate" value={item.dueDate} centered editingCell={editingCell} editingValue={editingValue} inputType="date" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap`}><EditableValue section="order" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap`}><EditableValue section="order" rowId={item.id} field="laborCost" value={item.laborCost.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap`}><EditableValue section="order" rowId={item.id} field="lossCost" value={item.lossCost.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className="px-3 py-2 text-center align-middle text-[11px] lg:text-[11px]"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${getInspectionStatusTone(item.inspectionStatus)}`}>{getInspectionStatusLabel(item.inspectionStatus)}</span></td>
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
                  <td colSpan={2} />
                </tr>
                {locked ? null : (
                  <tr>
                    <td colSpan={8} className="px-3 pb-2 pt-2">
                      <button
                        type="button"
                        onClick={onAdd}
                        className="pbp-interactive-button flex w-full items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white px-3 py-3 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
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
