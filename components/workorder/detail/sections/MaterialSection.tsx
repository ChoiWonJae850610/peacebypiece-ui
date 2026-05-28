import { useI18n } from "@/lib/i18n";
import { translateWorkOrderDisplayText } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import { getTranslatedWorkOrderSelectDisplayValue } from "@/lib/workorder/detail/selectDisplayPresentation";
import { MATERIAL_TYPE_OPTIONS } from "@/lib/constants/material";
import { useCompanyStandardOptions } from "@/lib/admin/settings/useCompanyStandardOptions";
import {
  DeleteButton,
  EditableValue,
  EDITABLE_TABLE_CELL_CLASS,
  SELECTABLE_TABLE_CELL_CLASS,
  TABLE_HEADER_CELL_CLASS,
  type EditableCell,
  type EditableSectionKey,
} from "@/components/workorder/detail/shared/detailEditorShared";
import type { Material } from "@/types/workorder";

export default function MaterialSection({
  materials,
  open,
  onToggle,
  editingCell,
  editingValue,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onAdd,
  onRemove,
  locked = false,
}: {
  materials: Material[];
  open: boolean;
  onToggle: () => void;
  editingCell: EditableCell;
  editingValue: string;
  onStartEdit: (section: EditableSectionKey, rowId: string, field: string, value: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  locked?: boolean;
}) {
  const { i18n, locale } = useI18n();
  const { materialUnitOptions } = useCompanyStandardOptions();
  const copy = i18n.workorder.ui.sections.material;
  const common = i18n.workorder.ui.common;
  void open;
  void onToggle;

  return (
    <div className="min-w-0 xl:h-full">
      <div className="max-w-full overflow-x-auto rounded-xl border border-stone-200 bg-white xl:max-h-[320px] xl:overflow-auto">
          <table className="w-full min-w-[560px] table-fixed text-left xl:min-w-0">
            <colgroup>
              <col className="w-[14%]" />
              <col className="w-[44%]" />
              <col className="w-[15%]" />
              <col className="w-[18%]" />
              <col className="w-[9%]" />
            </colgroup>
            <thead className="text-stone-500">
              <tr className="border-b border-stone-200">
                {[copy.fields.type, copy.fields.name, copy.fields.quantity, copy.fields.unit, ""].map((header, index) => (
                  <th key={`${header}-${index}`} className={`${TABLE_HEADER_CELL_CLASS} text-center`}>
                    <span className="block w-full whitespace-normal break-keep leading-4">{header}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {materials.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-2 text-center text-xs text-stone-500">{copy.empty}</td>
                </tr>
              ) : null}
              {materials.map((item, rowIndex) => (
                <tr key={item.id} className={`border-b border-stone-100 ${rowIndex % 2 === 0 ? "bg-white" : "bg-stone-50/70"} hover:bg-stone-50`}>
                  <td className={SELECTABLE_TABLE_CELL_CLASS}><EditableValue section="material" rowId={item.id} field="type" value={item.type} displayValue={getTranslatedWorkOrderSelectDisplayValue(item.type, (value) => translateWorkOrderDisplayText(value, locale))} options={MATERIAL_TYPE_OPTIONS} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={EDITABLE_TABLE_CELL_CLASS}><EditableValue section="material" rowId={item.id} field="name" value={item.name} displayValue={translateWorkOrderDisplayText(item.name, locale)} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={EDITABLE_TABLE_CELL_CLASS}><EditableValue section="material" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="decimal" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className={SELECTABLE_TABLE_CELL_CLASS}><EditableValue section="material" rowId={item.id} field="unit" value={item.unit} displayValue={translateWorkOrderDisplayText(item.unit, locale)} options={materialUnitOptions} centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className="px-1.5 py-2 text-center align-middle lg:px-2">
                    <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.name || copy.fallbackItem.replace("{index}", String(rowIndex + 1))} ${common.deleteSuffix}`} disabled={locked} />
                  </td>
                </tr>
              ))}
              {locked ? null : (
                <tr>
                  <td colSpan={5} className="px-1.5 pb-1 pt-1.5 lg:px-2">
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
    </div>
  );
}
