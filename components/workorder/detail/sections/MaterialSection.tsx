import type { ReactNode } from "react";

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
    <div className={`min-w-0 rounded-2xl border border-stone-200 bg-white px-3 py-2.5 ${span ? "sm:col-span-2" : ""}`}>
      <div className="mb-1 text-[11px] font-medium leading-4 text-stone-500">{label}</div>
      <div className="min-h-8 text-sm font-medium text-stone-900">{children}</div>
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
      <div className="space-y-2 rounded-[24px] border border-stone-200 bg-white p-3.5 shadow-sm xl:max-h-[320px] xl:overflow-auto xl:p-4">
        {materials.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/70 px-4 py-8 text-center text-sm text-stone-500">
            {copy.empty}
          </div>
        ) : null}

        {materials.map((item, rowIndex) => (
          <div key={item.id} className="rounded-[22px] border border-stone-200 bg-stone-50/60 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-stone-500">{copy.fields.type}</div>
                <div className="mt-0.5 truncate text-sm font-semibold text-stone-950">
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
          </div>
        ))}

        {locked ? null : (
          <button
            type="button"
            onClick={onAdd}
            className="pbp-interactive-button flex w-full items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white px-3 py-2.5 text-sm font-medium text-stone-700 hover:border-stone-400 hover:bg-stone-50 active:bg-stone-100"
          >
            {copy.addButton}
          </button>
        )}
      </div>
    </div>
  );
}
