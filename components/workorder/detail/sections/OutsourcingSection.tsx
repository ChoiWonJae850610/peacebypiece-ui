import { useI18n } from "@/lib/i18n";
import { translateWorkOrderDisplayText } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import { useCompanyStandardOptions } from "@/lib/admin/settings/useCompanyStandardOptions";
import { getTranslatedWorkOrderSelectDisplayValue } from "@/lib/workorder/detail/selectDisplayPresentation";
import {
  DeleteButton,
  EditableValue,
  SectionHeader,
  CALCULATED_TABLE_CELL_CLASS,
  EDITABLE_TABLE_CELL_CLASS,
  SELECTABLE_TABLE_CELL_CLASS,
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
  processOptions,
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
  processOptions: string[];
  locked?: boolean;
}) {
  const { i18n, locale } = useI18n();
  const { priceBasisOptions } = useCompanyStandardOptions();
  const copy = i18n.workorder.ui.sections.outsourcing;
  const common = i18n.workorder.ui.common;
  const total = outsourcing.reduce((sum, item) => sum + (item.totalCost ?? 0), 0);
  const andMore = outsourcing.length > 1 ? ` ${common.andMoreFormat.replace("{count}", String(outsourcing.length - 1))}` : "";
  const summary = outsourcing.length > 0
    ? copy.summaryFormat.replace("{name}", translateWorkOrderDisplayText(outsourcing[0].process, locale)).replace("{andMore}", andMore).replace("{total}", `${total.toLocaleString()}${common.currencySuffix}`)
    : copy.empty;

  return (
    <div className="min-w-0">
      <SectionHeader title={copy.title} summary={summary} open={open} onToggle={onToggle} />
      {open ? (
        <div className="mt-2 max-w-full overflow-x-auto rounded-xl border border-stone-200 bg-white xl:overflow-x-hidden">
          <table className="w-full min-w-[700px] table-fixed text-left xl:min-w-0">
            <colgroup>
              <col className="w-[19%]" />
              <col className="w-[19%]" />
              <col className="w-[11%]" />
              <col className="w-[16%]" />
              <col className="w-[14%]" />
              <col className="w-[13%]" />
              <col className="w-[8%]" />
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
              {outsourcing.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-7 text-center text-sm text-stone-500">{copy.empty}</td>
                </tr>
              ) : null}
              {outsourcing.map((item, rowIndex) => (
                <tr key={item.id} className={`border-b border-stone-100 ${rowIndex % 2 === 0 ? "bg-white" : "bg-stone-50/70"} hover:bg-stone-50`}>
                  <td className={SELECTABLE_TABLE_CELL_CLASS}><EditableValue section="outsourcing" rowId={item.id} field="process" value={item.process} displayValue={getTranslatedWorkOrderSelectDisplayValue(item.process, (value) => translateWorkOrderDisplayText(value, locale))} options={processOptions} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={SELECTABLE_TABLE_CELL_CLASS}><EditableValue section="outsourcing" rowId={item.id} field="vendor" value={item.vendor} displayValue={getTranslatedWorkOrderSelectDisplayValue(item.vendor, (value) => translateWorkOrderDisplayText(value, locale))} options={vendorOptionsById[item.id] ?? []} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={EDITABLE_TABLE_CELL_CLASS}><EditableValue section="outsourcing" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="decimal" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={SELECTABLE_TABLE_CELL_CLASS}><EditableValue section="outsourcing" rowId={item.id} field="unitType" value={item.unitType} displayValue={translateWorkOrderDisplayText(item.unitType, locale)} options={priceBasisOptions} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={EDITABLE_TABLE_CELL_CLASS}><EditableValue section="outsourcing" rowId={item.id} field="unitCost" value={item.unitCost.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="decimal" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={CALCULATED_TABLE_CELL_CLASS}><span className={TABLE_VALUE_TEXT_CLASS}>{(item.totalCost ?? 0).toLocaleString()}{common.currencySuffix}</span></td>
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
      ) : null}
    </div>
  );
}
