import { WaflButton, WaflInfoBox, WaflSurface } from "@/components/common/ui";
import { useI18n } from "@/lib/i18n";
import { translateWorkOrderDisplayText } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import { getTranslatedWorkOrderSelectDisplayValue } from "@/lib/workorder/detail/selectDisplayPresentation";
import {
  DeleteButton,
  EditableValue,
  SELECTABLE_TABLE_CELL_CLASS,
  TABLE_HEADER_CELL_CLASS,
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
  const copy = i18n.workorder.ui.sections.outsourcing;
  const common = i18n.workorder.ui.common;
  const andMore = outsourcing.length > 1 ? ` ${common.andMoreFormat.replace("{count}", String(outsourcing.length - 1))}` : "";
  void open;
  void onToggle;
  const summary = outsourcing.length > 0
    ? copy.summaryFormat.replace("{name}", translateWorkOrderDisplayText(outsourcing[0].process, locale)).replace("{andMore}", andMore)
    : copy.empty;

  return (
    <div className="min-w-0 xl:h-full">
      <div className="border-b border-[var(--pbp-border)] pb-1.5">
        <div className="text-sm font-semibold leading-5 text-[var(--pbp-text-primary)]">{copy.title}</div>
        <div className="mt-0.5 block min-w-0 max-w-full break-words text-[11px] leading-4 text-[var(--pbp-text-muted)] sm:overflow-hidden sm:text-ellipsis sm:whitespace-nowrap md:text-xs">{summary}</div>
      </div>
      <WaflSurface component="outsourcing-table-panel" shape="control" tone="surface" className="mt-2 max-w-full overflow-x-auto xl:max-h-[360px] xl:overflow-auto">
          <table className="w-full min-w-[300px] table-fixed text-left xl:min-w-0">
            <colgroup>
              <col className="w-[86%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead className="text-[var(--pbp-text-muted)]">
              <tr className="border-b border-[var(--pbp-border)]">
                {[copy.fields.process, ""].map((header, index) => (
                  <th key={`${header}-${index}`} className={`${TABLE_HEADER_CELL_CLASS} text-center`}>
                    <span className="block w-full whitespace-normal break-keep leading-4">{header}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {outsourcing.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-3 py-7 text-center text-sm text-[var(--pbp-text-muted)]">{copy.empty}</td>
                </tr>
              ) : null}
              {outsourcing.map((item, rowIndex) => (
                <tr key={item.id} className={`border-b border-[var(--pbp-border-soft)] ${rowIndex % 2 === 0 ? "bg-[var(--pbp-surface)]" : "bg-[var(--pbp-surface-muted)]"} hover:bg-[var(--pbp-surface-muted)]`}>
                  <td className={SELECTABLE_TABLE_CELL_CLASS}><EditableValue section="outsourcing" rowId={item.id} field="process" value={item.process} displayValue={getTranslatedWorkOrderSelectDisplayValue(item.process, (value) => translateWorkOrderDisplayText(value, locale))} options={processOptions} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} /></td>
                  <td className="px-1.5 py-2 text-center align-middle lg:px-2">
                    <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.process || copy.fallbackItem.replace("{index}", String(rowIndex + 1))} ${common.deleteSuffix}`} disabled={locked} />
                  </td>
                </tr>
              ))}
              {locked ? null : (
                <tr>
                  <td colSpan={2} className="px-1.5 pb-1 pt-1.5 lg:px-2">
                    <WaflButton
                      variant="subtle"
                      width="full"
                      onClick={onAdd}
                      className="border-dashed"
                    >
                      {copy.addButton}
                    </WaflButton>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <WaflInfoBox shape="control" tone="muted" className="mt-2 border-0 px-3 py-2 text-xs leading-5">
            {copy.handoffNote}
          </WaflInfoBox>
      </WaflSurface>
    </div>
  );
}
