import { useI18n } from "@/lib/i18n";
import { useCompanyStandardOptions } from "@/lib/admin/settings/useCompanyStandardOptions";
import { getWorkOrderSelectDisplayValue } from "@/lib/workorder/detail/selectDisplayPresentation";
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
import type { Outsourcing } from "@/types/workorder";

type Props = {
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
};

export default function WorkOrderDetailMobileOutsourcingSection({
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
}: Props) {
  const { i18n } = useI18n();
  const { priceBasisOptions } = useCompanyStandardOptions();
  const copy = i18n.workorder.ui.sections.outsourcing;
  const common = i18n.workorder.ui.common;
  const total = outsourcing.reduce((sum, item) => sum + (item.totalCost ?? 0), 0);
  const andMore = outsourcing.length > 1 ? ` ${common.andMoreFormat.replace("{count}", String(outsourcing.length - 1))}` : "";
  const summary = outsourcing.length > 0
    ? copy.summaryFormat.replace("{name}", outsourcing[0].process).replace("{andMore}", andMore).replace("{total}", `${total.toLocaleString()}${common.currencySuffix}`)
    : copy.empty;

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-stone-200 bg-white p-3 sm:p-3.5">
      <SectionHeader title={copy.title} summary={summary} open={open} onToggle={onToggle} />
      {open ? (
        <div className="mt-3 grid gap-3">
          {outsourcing.map((item, index) => (
            <article key={item.id} className={MOBILE_COMPOSITION_CARD_CLASS}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <EditableValue section="outsourcing" rowId={item.id} field="process" value={item.process} displayValue={getWorkOrderSelectDisplayValue(item.process)} options={processOptions} editingCell={editingCell} editingValue={editingValue} wrapText onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
                  <div className="mt-1 text-xs text-stone-500">{copy.fallbackItem.replace("{index}", String(index + 1))}</div>
                </div>
                {!locked ? <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.process || copy.fallbackItem.replace("{index}", String(index + 1))} ${common.deleteSuffix}`} /> : null}
              </div>

              <dl className="mt-3 grid gap-2 text-sm">
                <div className={`${MOBILE_INFO_ROW_CLASS} ${SELECTABLE_FIELD_PANEL_CLASS}`}>
                  <dt className={MOBILE_LABEL_CLASS}>{copy.fields.vendor}</dt>
                  <dd className={MOBILE_VALUE_WRAPPER_CLASS}><EditableValue section="outsourcing" rowId={item.id} field="vendor" value={item.vendor} displayValue={getWorkOrderSelectDisplayValue(item.vendor)} options={vendorOptionsById[item.id] ?? []} editingCell={editingCell} editingValue={editingValue} wrapText onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></dd>
                </div>
                <div className="grid min-w-0 grid-cols-1 gap-2 min-[380px]:grid-cols-2">
                  <div className={EDITABLE_FIELD_PANEL_CLASS}>
                    <dt className={MOBILE_LABEL_CLASS}>{copy.fields.quantity}</dt>
                    <dd className="mt-1"><EditableValue section="outsourcing" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} editingCell={editingCell} editingValue={editingValue} inputMode="decimal" alignRight onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></dd>
                  </div>
                  <div className={SELECTABLE_FIELD_PANEL_CLASS}>
                    <dt className={MOBILE_LABEL_CLASS}>{copy.fields.unitType}</dt>
                    <dd className="mt-1"><EditableValue section="outsourcing" rowId={item.id} field="unitType" value={item.unitType} options={priceBasisOptions} editingCell={editingCell} editingValue={editingValue} centered onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></dd>
                  </div>
                  <div className={EDITABLE_FIELD_PANEL_CLASS}>
                    <dt className={MOBILE_LABEL_CLASS}>{copy.fields.unitCost}</dt>
                    <dd className="mt-1"><EditableValue section="outsourcing" rowId={item.id} field="unitCost" value={item.unitCost.toLocaleString()} editingCell={editingCell} editingValue={editingValue} inputMode="decimal" alignRight onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></dd>
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
