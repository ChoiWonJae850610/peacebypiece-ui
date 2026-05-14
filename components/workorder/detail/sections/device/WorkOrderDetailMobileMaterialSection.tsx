import { useI18n } from "@/lib/i18n";
import { MATERIAL_TYPE_OPTIONS } from "@/lib/constants/material";
import { getWorkOrderSelectDisplayValue } from "@/lib/workorder/detail/selectDisplayPresentation";
import { translateWorkOrderDisplayText } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import { useCompanyStandardOptions } from "@/lib/admin/settings/useCompanyStandardOptions";
import {
  AddButton,
  CALCULATED_FIELD_PANEL_CLASS,
  DeleteButton,
  EDITABLE_FIELD_PANEL_CLASS,
  EditableValue,
  MOBILE_COMPOSITION_CARD_CLASS,
  MOBILE_INFO_ROW_CLASS,
  MOBILE_LABEL_CLASS,
  MOBILE_VALUE_WRAPPER_CLASS,
  SELECTABLE_FIELD_PANEL_CLASS,
  SectionHeader,
  type EditableCell,
  type EditableSectionKey,
} from "@/components/workorder/detail/shared/detailEditorShared";
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

export default function WorkOrderDetailMobileMaterialSection({
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
  const { i18n, locale } = useI18n();
  const { materialUnitOptions } = useCompanyStandardOptions();
  const copy = i18n.workorder.ui.sections.material;
  const common = i18n.workorder.ui.common;
  const total = materials.reduce((sum, item) => sum + (item.totalCost ?? 0), 0);
  const andMore = materials.length > 1 ? ` ${common.andMoreFormat.replace("{count}", String(materials.length - 1))}` : "";
  const summary = materials.length > 0
    ? copy.summaryFormat.replace("{name}", materials[0].name).replace("{andMore}", andMore).replace("{total}", `${total.toLocaleString()}${common.currencySuffix}`)
    : copy.empty;

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-stone-200 bg-white p-3 sm:p-3.5">
      <SectionHeader title={copy.title} summary={summary} open={open} onToggle={onToggle} />
      {open ? (
        <div className="mt-3 grid gap-3">
          {materials.map((item, index) => (
            <article key={item.id} className={MOBILE_COMPOSITION_CARD_CLASS}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <EditableValue section="material" rowId={item.id} field="name" value={item.name} editingCell={editingCell} editingValue={editingValue} wrapText onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
                  <div className="mt-1 text-xs text-stone-500">{copy.fallbackItem.replace("{index}", String(index + 1))}</div>
                </div>
                {!locked ? <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.name || copy.fallbackItem.replace("{index}", String(index + 1))} ${common.deleteSuffix}`} /> : null}
              </div>

              <dl className="mt-3 grid gap-2 text-sm">
                <div className={`${MOBILE_INFO_ROW_CLASS} ${SELECTABLE_FIELD_PANEL_CLASS}`}>
                  <dt className={MOBILE_LABEL_CLASS}>{copy.fields.type}</dt>
                  <dd className={MOBILE_VALUE_WRAPPER_CLASS}><EditableValue section="material" rowId={item.id} field="type" value={item.type} displayValue={getWorkOrderSelectDisplayValue(item.type)} options={MATERIAL_TYPE_OPTIONS} editingCell={editingCell} editingValue={editingValue} centered onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></dd>
                </div>
                <div className={`${MOBILE_INFO_ROW_CLASS} ${SELECTABLE_FIELD_PANEL_CLASS}`}>
                  <dt className={MOBILE_LABEL_CLASS}>{copy.fields.vendor}</dt>
                  <dd className={MOBILE_VALUE_WRAPPER_CLASS}><EditableValue section="material" rowId={item.id} field="vendor" value={item.vendor} displayValue={getWorkOrderSelectDisplayValue(item.vendor)} options={vendorOptionsById[item.id] ?? []} editingCell={editingCell} editingValue={editingValue} wrapText onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></dd>
                </div>
                <div className="grid min-w-0 grid-cols-1 gap-2 min-[380px]:grid-cols-2">
                  <div className={EDITABLE_FIELD_PANEL_CLASS}>
                    <dt className={MOBILE_LABEL_CLASS}>{copy.fields.quantity}</dt>
                    <dd className="mt-1"><EditableValue section="material" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} editingCell={editingCell} editingValue={editingValue} inputMode="decimal" alignRight onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></dd>
                  </div>
                  <div className={SELECTABLE_FIELD_PANEL_CLASS}>
                    <dt className={MOBILE_LABEL_CLASS}>{copy.fields.unit}</dt>
                    <dd className="mt-1"><EditableValue section="material" rowId={item.id} field="unit" value={item.unit} displayValue={translateWorkOrderDisplayText(item.unit, locale)} options={materialUnitOptions} editingCell={editingCell} editingValue={editingValue} centered onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></dd>
                  </div>
                  <div className={EDITABLE_FIELD_PANEL_CLASS}>
                    <dt className={MOBILE_LABEL_CLASS}>{copy.fields.unitCost}</dt>
                    <dd className="mt-1"><EditableValue section="material" rowId={item.id} field="unitCost" value={item.unitCost.toLocaleString()} editingCell={editingCell} editingValue={editingValue} inputMode="decimal" alignRight onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></dd>
                  </div>
                  <div className={`${CALCULATED_FIELD_PANEL_CLASS} min-w-0`}>
                    <dt className={MOBILE_LABEL_CLASS}>{copy.fields.amount}</dt>
                    <dd className="mt-1 text-right text-sm font-semibold tabular-nums text-stone-900">{(item.totalCost ?? 0).toLocaleString()}{common.currencySuffix}</dd>
                  </div>
                </div>
              </dl>
            </article>
          ))}

          <div className={`${CALCULATED_FIELD_PANEL_CLASS} min-w-0 rounded-2xl px-3 py-3 sm:px-4`}>
            <div className={MOBILE_LABEL_CLASS}>{copy.fields.amount}</div>
            <div className="mt-1 text-right text-sm font-semibold tabular-nums text-stone-900">{total.toLocaleString()}{common.currencySuffix}</div>
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
