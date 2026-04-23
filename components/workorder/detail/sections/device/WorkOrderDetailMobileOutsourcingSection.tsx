import { useI18n } from "@/lib/i18n";
import { OUTSOURCING_PROCESS_OPTIONS, OUTSOURCING_UNIT_OPTIONS } from "@/lib/constants/workorderOptions";
import { AddButton, DeleteButton, EditableValue, SectionHeader, type EditableCell, type EditableSectionKey } from "@/components/workorder/detail/shared/detailEditorShared";
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
  locked = false,
}: Props) {
  const { i18n } = useI18n();
  const copy = i18n.workorder.ui.sections.outsourcing;
  const common = i18n.workorder.ui.common;
  const total = outsourcing.reduce((sum, item) => sum + (item.totalCost ?? 0), 0);
  const andMore = outsourcing.length > 1 ? ` ${common.andMoreFormat.replace("{count}", String(outsourcing.length - 1))}` : "";
  const summary = outsourcing.length > 0
    ? copy.summaryFormat.replace("{name}", outsourcing[0].process).replace("{andMore}", andMore).replace("{total}", `${total.toLocaleString()}${common.currencySuffix}`)
    : copy.empty;

  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-3.5">
      <SectionHeader title={copy.title} summary={summary} open={open} onToggle={onToggle} />
      {open ? (
        <div className="mt-3 grid gap-3">
          {outsourcing.map((item, index) => (
            <article key={item.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <EditableValue section="outsourcing" rowId={item.id} field="process" value={item.process} options={OUTSOURCING_PROCESS_OPTIONS} editingCell={editingCell} editingValue={editingValue} wrapText onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
                  <div className="mt-1 text-xs text-stone-500">{copy.fallbackItem.replace("{index}", String(index + 1))}</div>
                </div>
                {!locked ? <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.process || copy.fallbackItem.replace("{index}", String(index + 1))} ${common.deleteSuffix}`} /> : null}
              </div>

              <dl className="mt-3 grid gap-2 text-sm">
                <div className="grid grid-cols-[84px_minmax(0,1fr)] items-center gap-3">
                  <dt className="text-xs text-stone-500">{copy.fields.vendor}</dt>
                  <dd><EditableValue section="outsourcing" rowId={item.id} field="vendor" value={item.vendor} options={vendorOptionsById[item.id] ?? []} editingCell={editingCell} editingValue={editingValue} wrapText onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></dd>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <dt className="text-xs text-stone-500">{copy.fields.quantity}</dt>
                    <dd className="mt-1"><EditableValue section="outsourcing" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} editingCell={editingCell} editingValue={editingValue} inputMode="decimal" alignRight onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></dd>
                  </div>
                  <div>
                    <dt className="text-xs text-stone-500">{copy.fields.unitType}</dt>
                    <dd className="mt-1"><EditableValue section="outsourcing" rowId={item.id} field="unitType" value={item.unitType} options={OUTSOURCING_UNIT_OPTIONS} editingCell={editingCell} editingValue={editingValue} centered onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></dd>
                  </div>
                  <div>
                    <dt className="text-xs text-stone-500">{copy.fields.unitCost}</dt>
                    <dd className="mt-1"><EditableValue section="outsourcing" rowId={item.id} field="unitCost" value={item.unitCost.toLocaleString()} editingCell={editingCell} editingValue={editingValue} inputMode="decimal" alignRight onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></dd>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-2">
                    <dt className="text-xs text-stone-500">{copy.fields.amount}</dt>
                    <dd className="mt-1 text-right text-sm font-semibold tabular-nums text-stone-900">{(item.totalCost ?? 0).toLocaleString()}{common.currencySuffix}</dd>
                  </div>
                </div>
              </dl>
            </article>
          ))}

          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
            <div className="text-xs text-stone-500">{copy.fields.amount}</div>
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
