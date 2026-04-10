import { ORDER_TYPE_OPTIONS } from "@/lib/constants/workorderOptions";
import { calculateOrderEntryTotals } from "@/lib/workorder/detailCalculations";
import { formatOrderSummary, getInspectionStatusLabel, getInspectionStatusTone } from "@/lib/workorder/detailFormatting";
import {
  DeleteButton,
  EditableValue,
  MOBILE_INFO_ROW_CLASS,
  MOBILE_LABEL_CLASS,
  MOBILE_VALUE_WRAPPER_CLASS,
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
  onOpenInspectionModal,
}: {
  orderEntries: OrderEntryState[];
  factoryOptions: readonly string[];
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
  onOpenInspectionModal: () => void;
}) {
  const totals = calculateOrderEntryTotals(orderEntries);
  const inspectionButton = canOpenInspectionModal ? (
    <button
      type="button"
      onClick={onOpenInspectionModal}
      className="pbp-interactive-button inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
    >
      검수 진행
    </button>
  ) : null;

  return (
    <div className="overflow-hidden rounded-2xl bg-stone-50 p-3 md:p-3.5">
      <SectionHeader title="발주 정보" summary={formatOrderSummary(orderEntries)} open={open} onToggle={onToggle} rightSlot={inspectionButton} />
      {open ? (
        <>
          <div className="mt-2 space-y-2.5 md:hidden">
            {inspectionButton ? <div className="pb-0.5">{inspectionButton}</div> : null}
            {orderEntries.map((item, index) => (
              <div key={item.id} className="max-w-full overflow-hidden rounded-2xl border border-stone-200 bg-white px-4 py-3">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="whitespace-nowrap text-sm font-semibold text-stone-900">{item.factory || `발주 ${index + 1}`}</div>
                    <div className="mt-1 whitespace-nowrap text-xs text-stone-500">{item.type} · {item.quantity.toLocaleString()}장</div>
                  </div>
                  <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.factory || `발주 ${index + 1}`} 삭제`} disabled={locked} />
                </div>
                <div className="mt-2 space-y-1.5">
                  {[
                    ["구분", "type", item.type, "text"],
                    ["공장", "factory", item.factory, "text"],
                    ["납기일", "dueDate", item.dueDate, "text"],
                    ["수량", "quantity", item.quantity.toLocaleString(), "decimal"],
                    ["공임비", "laborCost", item.laborCost.toLocaleString(), "decimal"],
                    ["로스비", "lossCost", item.lossCost.toLocaleString(), "decimal"],
                    ["검수여부", "inspectionStatus", getInspectionStatusLabel(item.inspectionStatus ?? "order_pending"), "text"],
                  ].map(([label, field, value, inputMode]) => (
                    <div key={`${item.id}-${field}`} className={MOBILE_INFO_ROW_CLASS}>
                      <span className={MOBILE_LABEL_CLASS}>{label}</span>
                      <div className={MOBILE_VALUE_WRAPPER_CLASS}>
                        {field === "inspectionStatus" ? (
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getInspectionStatusTone(item.inspectionStatus ?? "order_pending")}`}>{getInspectionStatusLabel(item.inspectionStatus ?? "order_pending")}</span>
                        ) : (
                          <EditableValue
                            section="order"
                            rowId={item.id}
                            field={String(field)}
                            value={String(value)}
                            editingCell={editingCell}
                            editingValue={editingValue}
                            inputMode={field === "quantity" || field === "laborCost" || field === "lossCost" ? "numeric" : inputMode as "text" | "decimal"}
                            inputType={field === "dueDate" ? "date" : "text"}
                            options={field === "type" ? ORDER_TYPE_OPTIONS : field === "factory" ? factoryOptions : undefined}
                            alignRight
                            compact
                            onStartEdit={onStartEdit}
                            onCommit={onCommitEdit}
                            onCancel={onCancelEdit}
                            disabled={locked}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {locked ? null : (
              <button
                type="button"
                onClick={onAdd}
                className="pbp-interactive-button flex w-full items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
              >
                + 발주 추가
              </button>
            )}
          </div>
          <div className="mt-1 hidden max-w-full overflow-hidden md:block">
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
                  {["구분", "공장", "납기일", "수량", "공임비", "로스비", "검수여부", ""].map((header, index) => (
                    <th key={`${header}-${index}`} className={TABLE_HEADER_CELL_CLASS}>
                      <span className="block w-full whitespace-nowrap leading-4">{header}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orderEntries.map((item, rowIndex) => (
                  <tr key={item.id} className={`border-b border-stone-100 ${rowIndex % 2 === 0 ? "bg-white" : "bg-stone-50/70"} hover:bg-stone-50`}>
                    <td className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap`}><EditableValue section="order" rowId={item.id} field="type" value={item.type} options={ORDER_TYPE_OPTIONS} centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="order" rowId={item.id} field="factory" value={item.factory} options={factoryOptions} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap`}><EditableValue section="order" rowId={item.id} field="dueDate" value={item.dueDate} centered editingCell={editingCell} editingValue={editingValue} inputType="date" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap`}><EditableValue section="order" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap`}><EditableValue section="order" rowId={item.id} field="laborCost" value={item.laborCost.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={`${TABLE_BODY_CELL_CLASS} whitespace-nowrap`}><EditableValue section="order" rowId={item.id} field="lossCost" value={item.lossCost.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="numeric" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className="px-1.5 py-2 text-center align-middle text-[11px] lg:px-2 lg:text-[11px]"><span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium lg:text-[11px] ${getInspectionStatusTone(item.inspectionStatus ?? "order_pending")}`}>{getInspectionStatusLabel(item.inspectionStatus ?? "order_pending")}</span></td>
                    <td className="px-1.5 py-2 text-center align-middle lg:px-2">
                      <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.factory || `발주 ${rowIndex + 1}`} 삭제`} disabled={locked} />
                    </td>
                  </tr>
                ))}
                <tr className="bg-stone-50/70">
                  <td className="px-3 py-2 text-xs font-medium text-stone-500" colSpan={3}>합계</td>
                  <td className="px-3 py-2 text-center text-[11px] font-semibold text-stone-900 tabular-nums lg:text-[11px]">{totals.quantity.toLocaleString()}장</td>
                  <td className="px-3 py-2 text-center text-[11px] font-semibold text-stone-900 tabular-nums lg:text-[11px]">{totals.laborCost.toLocaleString()}원</td>
                  <td className="px-3 py-2 text-center text-[11px] font-semibold text-stone-900 tabular-nums lg:text-[11px]">{totals.lossCost.toLocaleString()}원</td>
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
                        + 발주 추가
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
