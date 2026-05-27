import OrderInfoHubDebugPanel from "@/components/debug/OrderInfoHubDebugPanel";
import { useI18n } from "@/lib/i18n";
import type { OrderInfoHubPolicy } from "@/lib/workorder/orderInfoHubPolicy";
import { calculateOrderEntryTotals } from "@/lib/workorder/detail/detailCalculations";
import { formatCurrencySummary } from "@/lib/workorder/detail/detailFormatting";
import { getTranslatedWorkOrderSelectDisplayValue } from "@/lib/workorder/detail/selectDisplayPresentation";
import { getInspectionStatusTone } from "@/lib/workorder/presentation/statusPresentation";
import { translateInspectionStatusLabel, translateWorkOrderDisplayText } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
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
  const inspectionStatusCounts = visibleOrderEntries.reduce<Record<string, { label: string; tone: string; count: number }>>((acc, item) => {
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
  const dueDatePickerLabels = {
    placeholder: copy.datePicker.placeholder,
    clear: copy.datePicker.clear,
    done: copy.datePicker.done,
    selected: copy.datePicker.selected,
    calendarAria: copy.datePicker.calendarAria,
  };
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

  return (
    <div className="space-y-3 overflow-hidden rounded-[24px] border border-stone-200 bg-white p-3.5 shadow-sm xl:p-4">
      {showDebugPanel ? <OrderInfoHubDebugPanel policy={orderHubPolicy} /> : null}
      {inspectionStatusSummary.length > 0 || inspectionButton ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {inspectionStatusSummary.length > 0 ? (
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] font-semibold text-stone-500">{copy.statusSummaryLabel}</span>
              {inspectionStatusSummary.map((status) => (
                <span key={status.label} className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium leading-none ${status.tone}`}>
                  {status.label} {status.count}
                </span>
              ))}
            </div>
          ) : (
            <span aria-hidden="true" />
          )}
          {inspectionButton}
        </div>
      ) : null}
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
          <div>
            <div className="text-xs font-semibold text-stone-900">{copy.productionOrderTitle}</div>
            <div className="mt-0.5 text-[11px] leading-4 text-stone-500">{copy.productionOrderDescription}</div>
          </div>
        </div>
        <div className="max-w-full overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="min-w-[720px] w-full table-fixed text-left">
            <colgroup>
              <col className="w-[14%]" />
              <col className="w-[24%]" />
              <col className="w-[18%]" />
              <col className="w-[14%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
            </colgroup>
            <thead className="text-stone-500">
              <tr className="border-b border-stone-200">
                {[copy.fields.type, copy.fields.factory, copy.fields.dueDate, copy.fields.quantity, copy.fields.laborCost, copy.fields.lossCost].map((header, index) => (
                  <th key={`${header}-${index}`} className={TABLE_HEADER_CELL_CLASS}>
                    <span className="block w-full whitespace-nowrap leading-4">{header}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleOrderEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-stone-500">{copy.empty}</td>
                </tr>
              ) : null}
              {visibleOrderEntries.map((item, rowIndex) => (
                <tr key={item.id} className={`border-b border-stone-100 ${rowIndex % 2 === 0 ? "bg-white" : "bg-stone-50/70"} hover:bg-stone-50`}>
                  <td className={`${SELECTABLE_TABLE_CELL_CLASS} whitespace-nowrap`}><EditableValue section="order" rowId={item.id} field="type" value={item.type} displayValue={translateWorkOrderDisplayText(item.type, locale)} options={orderTypeOptions} centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={SELECTABLE_TABLE_CELL_CLASS}><EditableValue section="order" rowId={item.id} field="factory" value={item.factory} displayValue={translateWorkOrderDisplayText(item.factory, locale)} options={factoryOptions} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={`${EDITABLE_TABLE_CELL_CLASS} whitespace-nowrap`}><EditableValue section="order" rowId={item.id} field="dueDate" value={item.dueDate} centered editingCell={editingCell} editingValue={editingValue} inputType="date" datePickerLabels={dueDatePickerLabels} datePickerLocale={locale} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={`${EDITABLE_TABLE_CELL_CLASS} whitespace-nowrap`}><EditableValue section="order" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={`${EDITABLE_TABLE_CELL_CLASS} whitespace-nowrap`}><EditableValue section="order" rowId={item.id} field="laborCost" value={item.laborCost.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={`${EDITABLE_TABLE_CELL_CLASS} whitespace-nowrap`}><EditableValue section="order" rowId={item.id} field="lossCost" value={item.lossCost.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                </tr>
              ))}
              <tr className="bg-stone-50/70">
                <td className="px-3 py-2 text-xs font-medium text-stone-500" colSpan={3}>{copy.totalRow}</td>
                <td className={CALCULATED_TABLE_CELL_CLASS}>{totals.quantity.toLocaleString()}{common.quantitySuffix}</td>
                <td className={CALCULATED_TABLE_CELL_CLASS}>{totals.laborCost.toLocaleString()}{common.currencySuffix}</td>
                <td className={CALCULATED_TABLE_CELL_CLASS}>{totals.lossCost.toLocaleString()}{common.currencySuffix}</td>
              </tr>
              <tr className="border-t border-stone-200 bg-stone-50/90">
                <td className="px-3 py-2 text-right text-xs font-semibold text-stone-900 tabular-nums" colSpan={6}>
                  {formatCurrencySummary(totals.totalCost, i18n)}
                </td>
              </tr>
              {!locked && visibleOrderEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 pb-2 pt-2">
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
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
          <div>
            <div className="text-xs font-semibold text-stone-900">{copy.outsourcingOrder.title}</div>
            <div className="mt-0.5 text-[11px] leading-4 text-stone-500">
              {copy.outsourcingOrder.summaryFormat
                .replace("{count}", String(outsourcing.length))
                .replace("{quantity}", outsourcingTotals.quantity.toLocaleString())}
            </div>
          </div>
        </div>
        <div className="max-w-full overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="min-w-[760px] w-full table-fixed text-left">
            <colgroup>
              <col className="w-[17%]" />
              <col className="w-[23%]" />
              <col className="w-[16%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[4%]" />
            </colgroup>
            <thead className="text-stone-500">
              <tr className="border-b border-stone-200">
                {[outsourcingCopy.fields.process, outsourcingCopy.fields.vendor, copy.fields.dueDate, outsourcingCopy.fields.quantity, outsourcingCopy.fields.unitCost, outsourcingCopy.fields.amount, ""].map((header, index) => (
                  <th key={`${header}-${index}`} className={`${TABLE_HEADER_CELL_CLASS} text-center`}>
                    <span className="block w-full whitespace-nowrap leading-4">{header}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {outsourcing.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-7 text-center text-sm text-stone-500">{outsourcingCopy.empty}</td>
                </tr>
              ) : null}
              {outsourcing.map((item, rowIndex) => (
                <tr key={item.id} className={`border-b border-stone-100 ${rowIndex % 2 === 0 ? "bg-white" : "bg-stone-50/70"} hover:bg-stone-50`}>
                  <td className={SELECTABLE_TABLE_CELL_CLASS}><EditableValue section="outsourcing" rowId={item.id} field="process" value={item.process} displayValue={getTranslatedWorkOrderSelectDisplayValue(item.process, (value) => translateWorkOrderDisplayText(value, locale))} options={outsourcingProcessOptions} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={SELECTABLE_TABLE_CELL_CLASS}><EditableValue section="outsourcing" rowId={item.id} field="vendor" value={item.vendor} displayValue={getTranslatedWorkOrderSelectDisplayValue(item.vendor, (value) => translateWorkOrderDisplayText(value, locale))} options={outsourcingVendorOptionsById[item.id] ?? []} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={`${EDITABLE_TABLE_CELL_CLASS} whitespace-nowrap`}><EditableValue section="outsourcing" rowId={item.id} field="dueDate" value={item.dueDate ?? ""} centered editingCell={editingCell} editingValue={editingValue} inputType="date" datePickerLabels={dueDatePickerLabels} datePickerLocale={locale} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={`${EDITABLE_TABLE_CELL_CLASS} whitespace-nowrap`}><EditableValue section="outsourcing" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={`${EDITABLE_TABLE_CELL_CLASS} whitespace-nowrap`}><EditableValue section="outsourcing" rowId={item.id} field="unitCost" value={item.unitCost.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={CALCULATED_TABLE_CELL_CLASS}>{item.totalCost.toLocaleString()}{common.currencySuffix}</td>
                  <td className="px-1.5 py-2 text-center align-middle lg:px-2">
                    <DeleteButton onClick={() => onRemoveOutsourcing(item.id)} srLabel={`${item.process || outsourcingCopy.fallbackItem.replace("{index}", String(rowIndex + 1))} ${common.deleteSuffix}`} disabled={locked} />
                  </td>
                </tr>
              ))}
              <tr className="bg-stone-50/70">
                <td className="px-3 py-2 text-xs font-medium text-stone-500" colSpan={3}>{copy.totalRow}</td>
                <td className={CALCULATED_TABLE_CELL_CLASS}>{outsourcingTotals.quantity.toLocaleString()}{common.quantitySuffix}</td>
                <td className={CALCULATED_TABLE_CELL_CLASS}>-</td>
                <td className={CALCULATED_TABLE_CELL_CLASS}>{outsourcingTotals.cost.toLocaleString()}{common.currencySuffix}</td>
                <td aria-hidden="true" />
              </tr>
              {locked ? null : (
                <tr>
                  <td colSpan={7} className="px-3 pb-2 pt-2">
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
          <div className="border-t border-stone-200 bg-stone-50/70 px-3 py-2 text-xs leading-5 text-stone-500">
            {copy.outsourcingOrder.handoffNote}
          </div>
        </div>
      </div>
    </div>
  );
}
