import OrderInfoHubDebugPanel from "@/components/debug/OrderInfoHubDebugPanel";
import { useI18n } from "@/lib/i18n";
import type { OrderInfoHubPolicy } from "@/lib/workorder/orderInfoHubPolicy";
import { calculateOrderEntryAmount, calculateOrderEntryTotals } from "@/lib/workorder/detail/detailCalculations";
import { formatCurrencySummary } from "@/lib/workorder/detail/detailFormatting";
import { getTranslatedWorkOrderSelectDisplayValue } from "@/lib/workorder/detail/selectDisplayPresentation";
import { translateWorkOrderDisplayText } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import {
  CALCULATED_TABLE_CELL_CLASS,
  DeleteButton,
  EDITABLE_TABLE_CELL_CLASS,
  EditableValue,
  SELECTABLE_TABLE_CELL_CLASS,
  TABLE_HEADER_CELL_CLASS,
  type EditableCell,
  type EditableSectionKey,
  type OrderEntryState,
} from "@/components/workorder/detail/shared/detailEditorShared";
import type { Outsourcing } from "@/types/workorder";

export default function OrderInfoSection({
  orderEntries,
  factoryOptions,
  orderTypeOptions,
  outsourcing,
  outsourcingVendorOptionsById,
  outsourcingProcessOptions,
  open,
  onToggle,
  editingCell,
  editingValue,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onAdd,
  onRemove,
  onAddOutsourcing,
  onRemoveOutsourcing,
  canOpenInspectionModal,
  locked = false,
  orderHubPolicy,
  onOpenInspectionModal,
  showDebugPanel = false,
}: {
  orderEntries: OrderEntryState[];
  factoryOptions: readonly string[];
  orderTypeOptions: readonly string[];
  outsourcing: Outsourcing[];
  outsourcingVendorOptionsById: Record<string, string[]>;
  outsourcingProcessOptions: string[];
  open: boolean;
  onToggle: () => void;
  editingCell: EditableCell;
  editingValue: string;
  onStartEdit: (section: EditableSectionKey, rowId: string, field: string, value: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onAddOutsourcing: () => void;
  onRemoveOutsourcing: (id: string) => void;
  canOpenInspectionModal: boolean;
  locked?: boolean;
  orderHubPolicy: OrderInfoHubPolicy;
  onOpenInspectionModal: () => void;
  showDebugPanel?: boolean;
}) {
  const { i18n, locale } = useI18n();
  const copy = i18n.workorder.ui.sections.orderInfo;
  const outsourcingCopy = i18n.workorder.ui.sections.outsourcing;
  const common = i18n.workorder.ui.common;
  void onRemove;
  const visibleOrderEntries = orderEntries.slice(0, 1);
  const totals = calculateOrderEntryTotals(visibleOrderEntries);
  const outsourcingTotals = outsourcing.reduce(
    (acc, item) => {
      acc.quantity += Number(item.quantity) || 0;
      acc.cost += Number(item.totalCost) || 0;
      return acc;
    },
    { quantity: 0, cost: 0 },
  );
  const inspectionButton = canOpenInspectionModal ? (
    <button
      type="button"
      onClick={onOpenInspectionModal}
      className="pbp-interactive-button pbp-action-secondary inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium"
    >
      {copy.inspectionAction}
    </button>
  ) : null;

  void open;
  void onToggle;

  const numericEditableCellClass = `${EDITABLE_TABLE_CELL_CLASS} whitespace-nowrap`;
  const numericCalculatedCellClass = `${CALCULATED_TABLE_CELL_CLASS} whitespace-nowrap`;

  return (
    <div className="space-y-3 overflow-hidden rounded-[24px] border border-stone-200 bg-white p-3.5 shadow-sm xl:p-4">
      {showDebugPanel ? <OrderInfoHubDebugPanel policy={orderHubPolicy} /> : null}
      {inspectionButton ? (
        <div className="flex justify-end">
          {inspectionButton}
        </div>
      ) : null}
      <div>
        <div className="max-w-full overflow-hidden rounded-xl border border-stone-200 bg-white">
          <table className="w-full table-fixed text-left">
            <colgroup>
              <col className="w-[9%]" />
              <col className="w-[15%]" />
              <col className="w-[22%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[15%]" />
              <col className="w-[7%]" />
            </colgroup>
            <thead className="text-stone-500">
              <tr className="border-b border-stone-200">
                {[copy.fields.lineType, copy.fields.item, copy.fields.vendor, copy.fields.quantity, copy.fields.laborCost, copy.fields.lossCost, copy.fields.amount, ""].map((header, index) => (
                  <th key={`${header}-${index}`} className={`${TABLE_HEADER_CELL_CLASS} text-center`}>
                    <span className="block w-full whitespace-nowrap leading-4">{header}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleOrderEntries.length === 0 && outsourcing.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-sm text-stone-500">{copy.empty}</td>
                </tr>
              ) : null}
              {visibleOrderEntries.map((item, rowIndex) => {
                const orderLineAmount = calculateOrderEntryAmount(item);

                return (
                  <tr key={item.id} className={`border-b border-stone-100 ${rowIndex % 2 === 0 ? "bg-white" : "bg-stone-50/70"} hover:bg-stone-50`}>
                  <td className="px-3 py-2 text-center align-middle text-xs font-semibold text-stone-700">{copy.sewingLineTypeLabel}</td>
                  <td className={`${SELECTABLE_TABLE_CELL_CLASS} whitespace-nowrap`}><EditableValue section="order" rowId={item.id} field="type" value={item.type} displayValue={translateWorkOrderDisplayText(item.type, locale)} options={orderTypeOptions} centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={SELECTABLE_TABLE_CELL_CLASS}><EditableValue section="order" rowId={item.id} field="factory" value={item.factory} displayValue={translateWorkOrderDisplayText(item.factory, locale)} options={factoryOptions} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={numericEditableCellClass}><EditableValue section="order" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} alignRight compact editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={numericEditableCellClass}><EditableValue section="order" rowId={item.id} field="laborCost" value={item.laborCost.toLocaleString()} alignRight compact editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={numericEditableCellClass}><EditableValue section="order" rowId={item.id} field="lossCost" value={item.lossCost.toLocaleString()} alignRight compact editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={numericCalculatedCellClass} title={`${orderLineAmount.toLocaleString()}${common.currencySuffix}`}>
                    <span className="block w-full overflow-hidden text-ellipsis whitespace-nowrap">{orderLineAmount.toLocaleString()}{common.currencySuffix}</span>
                  </td>
                  <td aria-hidden="true" />
                  </tr>
                );
              })}
              {outsourcing.map((item, rowIndex) => (
                <tr key={item.id} className={`border-b border-stone-100 ${(visibleOrderEntries.length + rowIndex) % 2 === 0 ? "bg-white" : "bg-stone-50/70"} hover:bg-stone-50`}>
                  <td className="px-3 py-2 text-center align-middle text-xs font-semibold text-stone-700">{copy.outsourcingLineTypeLabel}</td>
                  <td className={SELECTABLE_TABLE_CELL_CLASS}><EditableValue section="outsourcing" rowId={item.id} field="process" value={item.process} displayValue={getTranslatedWorkOrderSelectDisplayValue(item.process, (value) => translateWorkOrderDisplayText(value, locale))} options={outsourcingProcessOptions} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={SELECTABLE_TABLE_CELL_CLASS}><EditableValue section="outsourcing" rowId={item.id} field="vendor" value={item.vendor} displayValue={getTranslatedWorkOrderSelectDisplayValue(item.vendor, (value) => translateWorkOrderDisplayText(value, locale))} options={outsourcingVendorOptionsById[item.id] ?? []} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={numericEditableCellClass}><EditableValue section="outsourcing" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} alignRight compact editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={numericEditableCellClass}><EditableValue section="outsourcing" rowId={item.id} field="unitCost" value={item.unitCost.toLocaleString()} alignRight compact editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={numericCalculatedCellClass}>-</td>
                  <td className={numericCalculatedCellClass} title={`${item.totalCost.toLocaleString()}${common.currencySuffix}`}>
                    <span className="block w-full overflow-hidden text-ellipsis whitespace-nowrap">{item.totalCost.toLocaleString()}{common.currencySuffix}</span>
                  </td>
                  <td className="px-1.5 py-2 text-center align-middle lg:px-2">
                    <DeleteButton onClick={() => onRemoveOutsourcing(item.id)} srLabel={`${item.process || outsourcingCopy.fallbackItem.replace("{index}", String(rowIndex + 1))} ${common.deleteSuffix}`} disabled={locked} />
                  </td>
                </tr>
              ))}
              <tr className="bg-stone-50/70">
                <td className="px-3 py-2 text-xs font-medium text-stone-500" colSpan={3}>{copy.totalRow}</td>
                <td className={numericCalculatedCellClass} title={`${(totals.quantity + outsourcingTotals.quantity).toLocaleString()}${common.quantitySuffix}`}>
                  <span className="block w-full overflow-hidden text-ellipsis whitespace-nowrap">{(totals.quantity + outsourcingTotals.quantity).toLocaleString()}{common.quantitySuffix}</span>
                </td>
                <td className={numericCalculatedCellClass} title={`${(totals.laborCost + outsourcingTotals.cost).toLocaleString()}${common.currencySuffix}`}>
                  <span className="block w-full overflow-hidden text-ellipsis whitespace-nowrap">{(totals.laborCost + outsourcingTotals.cost).toLocaleString()}{common.currencySuffix}</span>
                </td>
                <td className={numericCalculatedCellClass} title={`${totals.lossCost.toLocaleString()}${common.currencySuffix}`}>
                  <span className="block w-full overflow-hidden text-ellipsis whitespace-nowrap">{totals.lossCost.toLocaleString()}{common.currencySuffix}</span>
                </td>
                <td className={numericCalculatedCellClass} title={`${(totals.totalCost + outsourcingTotals.cost).toLocaleString()}${common.currencySuffix}`}>
                  <span className="block w-full overflow-hidden text-ellipsis whitespace-nowrap">{(totals.totalCost + outsourcingTotals.cost).toLocaleString()}{common.currencySuffix}</span>
                </td>
                <td aria-hidden="true" />
              </tr>
              <tr className="border-t border-stone-200 bg-stone-50/90">
                <td className="px-3 py-2 text-right text-xs font-semibold text-stone-900 tabular-nums" colSpan={8}>
                  {formatCurrencySummary(totals.totalCost + outsourcingTotals.cost, i18n)}
                </td>
              </tr>
              {!locked && visibleOrderEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 pb-2 pt-2">
                    <button
                      type="button"
                      onClick={onAdd}
                      className="pbp-interactive-button pbp-action-add flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-sm font-medium"
                    >
                      {copy.factoryAddButton}
                    </button>
                  </td>
                </tr>
              ) : null}
              {locked ? null : (
                <tr>
                  <td colSpan={8} className="px-3 pb-2 pt-2">
                    <button
                      type="button"
                      onClick={onAddOutsourcing}
                      className="pbp-interactive-button flex w-full items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white px-3 py-2.5 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
                    >
                      {copy.outsourcingOrder.addButton}
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
