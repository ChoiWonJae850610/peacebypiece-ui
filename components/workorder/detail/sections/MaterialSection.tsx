import type { ReactNode } from "react";

import { AppButton, AppCard } from "@/components/common/ui";
import { useI18n } from "@/lib/i18n";
import { translateWorkOrderDisplayText } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import { getTranslatedWorkOrderSelectDisplayValue } from "@/lib/workorder/detail/selectDisplayPresentation";
import { MATERIAL_TYPE_OPTIONS } from "@/lib/constants/material";
import { useCompanyStandardOptions } from "@/lib/admin/settings/useCompanyStandardOptions";
import {
  DeleteButton,
  EditableValue,
  type EditableCell,
  type EditableSectionKey,
} from "@/components/workorder/detail/shared/detailEditorShared";
import type { Material } from "@/types/workorder";

function MaterialField({
  label,
  children,
  span = false,
}: {
  label: string;
  children: ReactNode;
  span?: boolean;
}) {
  return (
    <div className={`min-w-0 rounded-2xl border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-2.5 ${span ? "sm:col-span-2" : ""}`}>
      <div className="mb-1 text-[11px] font-medium leading-4 pbp-text-subtle">{label}</div>
      <div className="min-h-8 text-sm font-medium pbp-text-primary">{children}</div>
    </div>
  );
}

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
  onRemoveZeroQuantity,
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
  onRemoveZeroQuantity: () => void;
  locked?: boolean;
}) {
  const { i18n, locale } = useI18n();
  const { materialUnitOptions } = useCompanyStandardOptions();
  const copy = i18n.workorder.ui.sections.material;
  const common = i18n.workorder.ui.common;
  const zeroQuantityCount = materials.filter((item) => Math.max(0, Number(item.quantity) || 0) <= 0).length;
  void open;
  void onToggle;

  return (
    <div className="min-w-0 xl:h-full">
      <AppCard className="space-y-2 xl:max-h-[320px] xl:overflow-auto xl:p-4" padding="sm">
        {materials.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--pbp-border-strong)] bg-[var(--pbp-surface-muted)] px-4 py-8 text-center text-sm pbp-text-muted">
            {copy.empty}
          </div>
        ) : null}

        {!locked && zeroQuantityCount > 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900">
            <div className="font-semibold">{copy.zeroQuantityNoticeTitle.replace("{count}", String(zeroQuantityCount))}</div>
            <div className="mt-0.5 text-amber-800">{copy.zeroQuantityNoticeDescription}</div>
            <button
              type="button"
              onClick={onRemoveZeroQuantity}
              className="pbp-interactive-button mt-2 rounded-full border border-amber-300 bg-white px-3 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
            >
              {copy.zeroQuantityCleanupButton}
            </button>
          </div>
        ) : null}

        {materials.map((item, rowIndex) => (
          <AppCard key={item.id} variant="subtle" padding="sm" className="rounded-[22px]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold pbp-text-subtle">{copy.fields.type}</div>
                <div className="mt-0.5 truncate text-sm font-semibold pbp-text-primary">
                  {getTranslatedWorkOrderSelectDisplayValue(item.type, (value) => translateWorkOrderDisplayText(value, locale))}
                </div>
              </div>
              <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.name || copy.fallbackItem.replace("{index}", String(rowIndex + 1))} ${common.deleteSuffix}`} disabled={locked} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <MaterialField label={copy.fields.name} span>
                <EditableValue section="material" rowId={item.id} field="name" value={item.name} displayValue={translateWorkOrderDisplayText(item.name, locale)} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
              </MaterialField>
              <MaterialField label={copy.fields.quantity}>
                <EditableValue section="material" rowId={item.id} field="quantity" value={item.quantity.toLocaleString()} centered editingCell={editingCell} editingValue={editingValue} inputMode="decimal" onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
              </MaterialField>
              <MaterialField label={copy.fields.unit}>
                <EditableValue section="material" rowId={item.id} field="unit" value={item.unit} displayValue={translateWorkOrderDisplayText(item.unit, locale)} options={materialUnitOptions} centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
              </MaterialField>
              <MaterialField label={copy.fields.type}>
                <EditableValue section="material" rowId={item.id} field="type" value={item.type} displayValue={getTranslatedWorkOrderSelectDisplayValue(item.type, (value) => translateWorkOrderDisplayText(value, locale))} options={MATERIAL_TYPE_OPTIONS} wrapText centered editingCell={editingCell} editingValue={editingValue} onStartEdit={onStartEdit} onCommit={onCommitEdit} onCancel={onCancelEdit} disabled={locked} />
              </MaterialField>
            </div>
          </AppCard>
        ))}

        {locked ? null : (
          <AppButton
            onClick={onAdd}
            variant="secondary"
            size="sm"
            width="full"
            className="border-dashed"
          >
            {copy.addButton}
          </AppButton>
        )}
      </AppCard>
    </div>
  );
}
