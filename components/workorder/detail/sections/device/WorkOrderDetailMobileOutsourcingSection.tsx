import { WaflSurface } from "@/components/common/ui";
import { useI18n } from "@/lib/i18n";
import { useCompanyStandardOptions } from "@/lib/admin/settings/useCompanyStandardOptions";
import { getWorkOrderSelectDisplayValue } from "@/lib/workorder/detail/selectDisplayPresentation";
import {
  AddButton,
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
  processOptions,
  locked = false,
}: Props) {
  const { i18n } = useI18n();
  const { priceBasisOptions } = useCompanyStandardOptions();
  const copy = i18n.workorder.ui.sections.outsourcing;
  const common = i18n.workorder.ui.common;
  const andMore = outsourcing.length > 1 ? ` ${common.andMoreFormat.replace("{count}", String(outsourcing.length - 1))}` : "";
  const summary = outsourcing.length > 0
    ? copy.summaryFormat.replace("{name}", outsourcing[0].process).replace("{andMore}", andMore)
    : copy.empty;

  return (
    <WaflSurface as="section" component="mobile-outsourcing-section" shape="control" className="overflow-hidden p-3 sm:p-3.5">
      <SectionHeader title={copy.title} summary={summary} open={open} onToggle={onToggle} />
      {open ? (
        <div className="mt-3 grid gap-3">
          {outsourcing.map((item, index) => (
            <article key={item.id} className={MOBILE_COMPOSITION_CARD_CLASS}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <EditableValue section="outsourcing" rowId={item.id} field="process" value={item.process} displayValue={getWorkOrderSelectDisplayValue(item.process)} options={processOptions} editingCell={editingCell} editingValue={editingValue} wrapText onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
                  <div className="mt-1 text-xs text-[var(--pbp-text-muted)]">{copy.fallbackItem.replace("{index}", String(index + 1))}</div>
                </div>
                {!locked ? <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.process || copy.fallbackItem.replace("{index}", String(index + 1))} ${common.deleteSuffix}`} /> : null}
              </div>

              <dl className="mt-3 grid gap-2 text-sm">
                <div className="grid min-w-0 grid-cols-1 gap-2 min-[380px]:grid-cols-2">
                  <div className={EDITABLE_FIELD_PANEL_CLASS}>
                    <dt className={MOBILE_LABEL_CLASS}>{copy.fields.quantity}</dt>
                    <dd className="mt-1"><EditableValue section="outsourcing" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} editingCell={editingCell} editingValue={editingValue} inputMode="decimal" alignRight onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></dd>
                  </div>
                  <div className={SELECTABLE_FIELD_PANEL_CLASS}>
                    <dt className={MOBILE_LABEL_CLASS}>{copy.fields.unitType}</dt>
                    <dd className="mt-1"><EditableValue section="outsourcing" rowId={item.id} field="unitType" value={item.unitType} options={priceBasisOptions} editingCell={editingCell} editingValue={editingValue} centered onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></dd>
                  </div>
                </div>
              </dl>
            </article>
          ))}

          <WaflSurface component="mobile-outsourcing-handoff-note" shape="control" tone="muted" className="px-3 py-3 text-xs leading-5 text-[var(--pbp-text-muted)] sm:px-4">
            {copy.handoffNote}
          </WaflSurface>

          {!locked ? (
            <div className="flex justify-center">
              <AddButton onClick={onAdd} srLabel={copy.addButton} title={copy.addButton} />
            </div>
          ) : null}
        </div>
      ) : null}
    </WaflSurface>
  );
}
