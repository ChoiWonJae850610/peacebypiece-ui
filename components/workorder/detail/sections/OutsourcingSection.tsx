import { useI18n } from "@/lib/i18n";
import { OUTSOURCING_PROCESS_OPTIONS, OUTSOURCING_UNIT_OPTIONS } from "@/lib/constants/workorderOptions";
import {
  DeleteButton,
  EditableValue,
  SectionHeader,
  TABLE_BODY_CELL_CLASS,
  TABLE_HEADER_CELL_CLASS,
  TABLE_VALUE_TEXT_CLASS,
  type EditableCell,
  type EditableSectionKey,
} from "@/components/workorder/detail/shared/detailEditorShared";
import type { Outsourcing } from "@/types/workorder";

export default function OutsourcingSection({
  outsourcing,
  open,
  onToggle,
  editingCell,
  editingValue,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onAdd,
  onRemove,
  vendorOptionsById,
  locked = false,
}: {
  outsourcing: Outsourcing[];
  open: boolean;
  onToggle: () => void;
  editingCell: EditableCell;
  editingValue: string;
  onStartEdit: (section: EditableSectionKey, rowId: string, field: string, value: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  vendorOptionsById: Record<string, string[]>;
  locked?: boolean;
}) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.sections.outsourcing;
  const common = i18n.workorder.ui.common;
  const total = outsourcing.reduce((sum, item) => sum + (item.totalCost ?? 0), 0);
  const andMore = outsourcing.length > 1 ? ` ${common.andMoreFormat.replace("{count}", String(outsourcing.length - 1))}` : "";
  const summary = outsourcing.length > 0
    ? copy.summaryFormat.replace("{name}", outsourcing[0].process).replace("{andMore}", andMore).replace("{total}", `${total.toLocaleString()}${common.currencySuffix}`)
    : copy.empty;

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-3.5">
      <SectionHeader title={copy.title} summary={summary} open={open} onToggle={onToggle} />
      {open ? (
        <div className="mt-1 max-w-full overflow-hidden">
          <table className="w-full max-w-full table-fixed text-left">
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-[20%]" />
              <col className="w-[12%]" />
              <col className="w-[15%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
              <col className="w-[7%]" />
            </colgroup>
            <thead className="text-stone-500">
              <tr className="border-b border-stone-200">
                {[copy.fields.process, copy.fields.vendor, copy.fields.quantity, copy.fields.unitType, copy.fields.unitCost, copy.fields.amount, ""].map((header, index) => (
                  <th key={`${header}-${index}`} className={`${TABLE_HEADER_CELL_CLASS} text-center`}>
                    <span className="block w-full whitespace-normal break-keep leading-4">{header}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {outsourcing.map((item, rowIndex) => (
                <tr key={item.id} className={`border-b border-stone-100 ${rowIndex % 2 === 0 ? "bg-white" : "bg-stone-50/70"} hover:bg-stone-50`}>
                  <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="outsourcing" rowId={item.id} field="process" value={item.process} options={OUTSOURCING_PROCESS_OPTIONS} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="outsourcing" rowId={item.id} field="vendor" value={item.vendor} options={vendorOptionsById[item.id] ?? []} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="outsourcing" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="decimal" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="outsourcing" rowId={item.id} field="unitType" value={item.unitType} options={OUTSOURCING_UNIT_OPTIONS} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="outsourcing" rowId={item.id} field="unitCost" value={item.unitCost.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="decimal" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className="min-w-0 overflow-hidden px-1.5 py-2 text-center align-middle text-[11px] font-medium tabular-nums lg:px-2 lg:text-[11px]"><span className={TABLE_VALUE_TEXT_CLASS}>{(item.totalCost ?? 0).toLocaleString()}{common.currencySuffix}</span></td>
                  <td className="px-1.5 py-2 text-center align-middle lg:px-2">
                    <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.process || copy.fallbackItem.replace("{index}", String(rowIndex + 1))} ${common.deleteSuffix}`} disabled={locked} />
                  </td>
                </tr>
              ))}
              {locked ? null : (
                <tr>
                  <td colSpan={7} className="px-1.5 pb-1 pt-1.5 lg:px-2">
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
      ) : null}
    </div>
  );
}
