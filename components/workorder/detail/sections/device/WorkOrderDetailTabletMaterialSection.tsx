import { useI18n } from "@/lib/i18n";
import { MATERIAL_TYPE_OPTIONS } from "@/lib/constants/material";
import { useCompanyStandardOptions } from "@/lib/admin/settings/useCompanyStandardOptions";
import { AddButton, DeleteButton, EditableValue, SectionHeader, type EditableCell, type EditableSectionKey } from "@/components/workorder/detail/shared/detailEditorShared";
import type { Material } from "@/types/material";

type Props = {
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
};

export default function WorkOrderDetailTabletMaterialSection({
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
}: Props) {
  const { i18n } = useI18n();
  const { materialUnitOptions } = useCompanyStandardOptions();
  const copy = i18n.workorder.ui.sections.material;
  const common = i18n.workorder.ui.common;
  const total = materials.reduce((sum, item) => sum + (item.totalCost ?? 0), 0);
  const andMore = materials.length > 1 ? ` ${common.andMoreFormat.replace("{count}", String(materials.length - 1))}` : "";
  const summary = materials.length > 0
    ? copy.summaryFormat.replace("{name}", materials[0].name).replace("{andMore}", andMore).replace("{total}", `${total.toLocaleString()}${common.currencySuffix}`)
    : copy.empty;

  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-4">
      <SectionHeader title={copy.title} summary={summary} open={open} onToggle={onToggle} />
      {open ? (
        <div className="mt-4 grid gap-3">
          {materials.map((item, index) => (
            <article key={item.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <EditableValue section="material" rowId={item.id} field="name" value={item.name} editingCell={editingCell} editingValue={editingValue} wrapText onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
                  <div className="mt-1 text-sm text-stone-500">{copy.fallbackItem.replace("{index}", String(index + 1))}</div>
                </div>
                {!locked ? <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.name || copy.fallbackItem.replace("{index}", String(index + 1))} ${common.deleteSuffix}`} /> : null}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white p-3">
                  <div className="text-xs text-stone-500">{copy.fields.type}</div>
                  <div className="mt-1"><EditableValue section="material" rowId={item.id} field="type" value={item.type} options={MATERIAL_TYPE_OPTIONS} editingCell={editingCell} editingValue={editingValue} centered onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></div>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <div className="text-xs text-stone-500">{copy.fields.vendor}</div>
                  <div className="mt-1"><EditableValue section="material" rowId={item.id} field="vendor" value={item.vendor} options={vendorOptionsById[item.id] ?? []} editingCell={editingCell} editingValue={editingValue} wrapText onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></div>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <div className="text-xs text-stone-500">{copy.fields.quantity}</div>
                  <div className="mt-1"><EditableValue section="material" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} editingCell={editingCell} editingValue={editingValue} inputMode="decimal" alignRight onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></div>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <div className="text-xs text-stone-500">{copy.fields.unit}</div>
                  <div className="mt-1"><EditableValue section="material" rowId={item.id} field="unit" value={item.unit} options={materialUnitOptions} editingCell={editingCell} editingValue={editingValue} centered onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></div>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <div className="text-xs text-stone-500">{copy.fields.unitCost}</div>
                  <div className="mt-1"><EditableValue section="material" rowId={item.id} field="unitCost" value={item.unitCost.toLocaleString()} editingCell={editingCell} editingValue={editingValue} inputMode="decimal" alignRight onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></div>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <div className="text-xs text-stone-500">{copy.fields.amount}</div>
                  <div className="mt-1 text-right text-base font-semibold tabular-nums text-stone-900">{(item.totalCost ?? 0).toLocaleString()}{common.currencySuffix}</div>
                </div>
              </div>
            </article>
          ))}

          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
            <div className="text-xs text-stone-500">{copy.fields.amount}</div>
            <div className="mt-1 text-right text-base font-semibold tabular-nums text-stone-900">{total.toLocaleString()}{common.currencySuffix}</div>
          </div>

          {!locked ? (
            <div className="flex justify-center">
              <AddButton onClick={onAdd} srLabel={copy.addButton} title={copy.addButton} />
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
