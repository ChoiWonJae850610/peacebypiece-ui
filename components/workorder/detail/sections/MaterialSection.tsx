import { useI18n } from "@/lib/i18n";
import { MATERIAL_TYPE_OPTIONS, MATERIAL_UNIT_OPTIONS } from "@/lib/constants/material";
import {
  DeleteButton,
  EditableValue,
  MOBILE_INFO_ROW_CLASS,
  MOBILE_LABEL_CLASS,
  MOBILE_VALUE_WRAPPER_CLASS,
  SectionHeader,
  TABLE_BODY_CELL_CLASS,
  TABLE_HEADER_CELL_CLASS,
  TABLE_VALUE_TEXT_CLASS,
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
  vendorOptionsById,
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
  vendorOptionsById: Record<string, string[]>;
  locked?: boolean;
}) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.sections.material;
  const common = i18n.workorder.ui.common;
  const total = materials.reduce((sum, item) => sum + (item.totalCost ?? 0), 0);
  const andMore = materials.length > 1 ? ` ${common.andMoreFormat.replace("{count}", String(materials.length - 1))}` : "";
  const summary = materials.length > 0
    ? copy.summaryFormat.replace("{name}", materials[0].name).replace("{andMore}", andMore).replace("{total}", `${total.toLocaleString()}${common.currencySuffix}`)
    : copy.empty;

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-3 md:p-3.5">
      <SectionHeader title={copy.title} summary={summary} open={open} onToggle={onToggle} />
      {open ? (
        <>
          <div className="mt-2 space-y-2.5 md:hidden">
            {materials.map((item, index) => (
              <div key={item.id} className="max-w-full overflow-hidden rounded-2xl border border-stone-200 bg-white px-4 py-3">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="whitespace-nowrap text-sm font-semibold text-stone-900">{item.name || copy.fallbackItem.replace("{index}", String(index + 1))}</div>
                    <div className="mt-0.5 whitespace-nowrap text-xs text-stone-500">{copy.amountLabel} {(item.totalCost ?? 0).toLocaleString()}{common.currencySuffix}</div>
                  </div>
                  <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.name || copy.fallbackItem.replace("{index}", String(index + 1))} ${common.deleteSuffix}` } disabled={locked} />
                </div>
                <div className="mt-2 space-y-1.5">
                  {[
                    [copy.fields.type, "type", item.type, "text"],
                    [copy.fields.name, "name", item.name, "text"],
                    [copy.fields.vendor, "vendor", item.vendor, "text"],
                    [copy.fields.quantity, "quantity", item.quantity.toLocaleString(), "decimal"],
                    [copy.fields.unit, "unit", item.unit, "text"],
                    [copy.fields.unitCost, "unitCost", item.unitCost.toLocaleString(), "decimal"],
                  ].map(([label, field, value, inputMode]) => (
                    <div key={`${item.id}-${field}`} className={MOBILE_INFO_ROW_CLASS}>
                      <span className={MOBILE_LABEL_CLASS}>{label}</span>
                      <div className={MOBILE_VALUE_WRAPPER_CLASS}>
                        <EditableValue
                          section="material"
                          rowId={item.id}
                          field={String(field)}
                          value={String(value)}
                          editingCell={editingCell}
                          editingValue={editingValue}
                          inputMode={inputMode as "text" | "decimal"}
                          options={field === "type" ? MATERIAL_TYPE_OPTIONS : field === "unit" ? MATERIAL_UNIT_OPTIONS : field === "vendor" ? vendorOptionsById[item.id] ?? [] : undefined}
                          alignRight
                          compact
                          onStartEdit={onStartEdit}
                          onCommit={onCommitEdit}
                          onCancel={onCancelEdit}
                          disabled={locked}
                        />
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
                {copy.addButton}
              </button>
            )}
          </div>
          <div className="mt-1 hidden max-w-full overflow-hidden md:block">
            <table className="w-full max-w-full table-fixed text-left">
              <colgroup>
                <col className="w-[13%]" />
                <col className="w-[18%]" />
                <col className="w-[18%]" />
                <col className="w-[12%]" />
                <col className="w-[8%]" />
                <col className="w-[13%]" />
                <col className="w-[13%]" />
                <col className="w-[7%]" />
              </colgroup>
              <thead className="text-stone-500">
                <tr className="border-b border-stone-200">
                  {[copy.fields.type, copy.fields.name, copy.fields.vendor, copy.fields.quantity, copy.fields.unit, copy.fields.unitCost, copy.fields.amount, ""].map((header, index) => (
                    <th key={`${header}-${index}`} className={`${TABLE_HEADER_CELL_CLASS} text-center`}>
                      <span className="block w-full whitespace-normal break-keep leading-4">{header}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materials.map((item, rowIndex) => (
                  <tr key={item.id} className={`border-b border-stone-100 ${rowIndex % 2 === 0 ? "bg-white" : "bg-stone-50/70"} hover:bg-stone-50`}>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="material" rowId={item.id} field="type" value={item.type} options={MATERIAL_TYPE_OPTIONS} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="material" rowId={item.id} field="name" value={item.name} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="material" rowId={item.id} field="vendor" value={item.vendor} options={vendorOptionsById[item.id] ?? []} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="material" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="decimal" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="material" rowId={item.id} field="unit" value={item.unit} options={MATERIAL_UNIT_OPTIONS} centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className={TABLE_BODY_CELL_CLASS}><EditableValue section="material" rowId={item.id} field="unitCost" value={item.unitCost.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="decimal" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                    <td className="min-w-0 overflow-hidden px-1.5 py-2 text-center align-middle text-[11px] font-medium tabular-nums lg:px-2 lg:text-[11px]"><span className={TABLE_VALUE_TEXT_CLASS}>{(item.totalCost ?? 0).toLocaleString()}{common.currencySuffix}</span></td>
                    <td className="px-1.5 py-2 text-center align-middle lg:px-2">
                      <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.name || copy.fallbackItem.replace("{index}", String(rowIndex + 1))} ${common.deleteSuffix}` } disabled={locked} />
                    </td>
                  </tr>
                ))}
                {locked ? null : (
                  <tr>
                    <td colSpan={8} className="px-1.5 pb-1 pt-1.5 lg:px-2">
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
