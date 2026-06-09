import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { getWorkOrderSelectDisplayValue } from "@/lib/workorder/detail/selectDisplayPresentation";
import { translateWorkOrderDisplayText } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import { useCompanyStandardOptions } from "@/lib/admin/settings/useCompanyStandardOptions";
import { AddButton, DeleteButton, SectionHeader } from "@/components/workorder/detail/shared/detailEditorShared";
import WorkOrderMaterialEditSheet, { type MaterialSheetDraft } from "@/components/workorder/detail/sections/WorkOrderMaterialEditSheet";
import type { EditableCell, EditableSectionKey } from "@/components/workorder/detail/shared/detailEditorShared";
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
  onRemoveZeroQuantity: () => void;
  onSaveDraft: (materialId: string | null, draft: MaterialSheetDraft) => void;
  vendorOptionsById: Record<string, string[]>;
  locked?: boolean;
  title?: string;
  summary?: string;
  sectionClassName?: string;
};

const infoLabelClass = "text-[11px] font-medium text-stone-500";
const infoValueClass = "mt-0.5 text-sm font-semibold text-stone-900";

export default function WorkOrderDetailMobileMaterialSection({
  materials,
  open,
  onToggle,
  onRemove,
  onRemoveZeroQuantity,
  onSaveDraft,
  locked = false,
  title,
  summary,
  sectionClassName = "min-w-0 overflow-hidden rounded-2xl border border-stone-200 bg-white p-3 sm:p-3.5",
}: Props) {
  const { i18n, locale } = useI18n();
  const { materialUnitOptions } = useCompanyStandardOptions();
  const copy = i18n.workorder.ui.sections.material;
  const common = i18n.workorder.ui.common;
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const zeroQuantityCount = materials.filter((item) => Math.max(0, Number(item.quantity) || 0) <= 0).length;
  const andMore = materials.length > 1 ? ` ${common.andMoreFormat.replace("{count}", String(materials.length - 1))}` : "";
  const defaultSummary = materials.length > 0
    ? copy.summaryFormat.replace("{name}", materials[0].name).replace("{andMore}", andMore)
    : copy.empty;
  const headerTitle = title ?? copy.title;
  const headerSummary = summary ?? defaultSummary;

  const openAddSheet = () => {
    setEditingMaterial(null);
    setSheetOpen(true);
  };

  const openEditSheet = (item: Material) => {
    setEditingMaterial(item);
    setSheetOpen(true);
  };

  return (
    <section className={sectionClassName}>
      <SectionHeader title={headerTitle} summary={headerSummary} open={open} onToggle={onToggle} />
      {open ? (
        <div className="mt-3 grid gap-3">
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

          {materials.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-4 py-6 text-center text-xs leading-5 text-stone-500">
              {copy.empty}
            </div>
          ) : null}

          {materials.map((item, index) => (
            <article key={item.id} className="min-w-0 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="inline-flex rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600">
                    {getWorkOrderSelectDisplayValue(item.type)}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-stone-900">{item.name || copy.fallbackItem.replace("{index}", String(index + 1))}</div>
                </div>
                {!locked ? (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditSheet(item)}
                      className="pbp-interactive-button rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] font-semibold text-stone-700 shadow-sm"
                    >
                      {copy.editButton}
                    </button>
                    <DeleteButton onClick={() => onRemove(item.id)} srLabel={`${item.name || copy.fallbackItem.replace("{index}", String(index + 1))} ${common.deleteSuffix}`} />
                  </div>
                ) : null}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-stone-50 px-3 py-2">
                  <div className={infoLabelClass}>{copy.fields.quantity}</div>
                  <div className={infoValueClass}>{item.quantity.toLocaleString()}</div>
                </div>
                <div className="rounded-xl bg-stone-50 px-3 py-2">
                  <div className={infoLabelClass}>{copy.fields.unit}</div>
                  <div className={infoValueClass}>{translateWorkOrderDisplayText(item.unit, locale)}</div>
                </div>
              </div>
            </article>
          ))}

          <div className="rounded-2xl border border-stone-200 bg-white px-3 py-2.5 text-[11px] leading-5 text-stone-500">
            {copy.handoffNote}
          </div>

          {!locked ? (
            <div className="flex justify-center">
              <AddButton onClick={openAddSheet} srLabel={copy.addButton} title={copy.addButton} />
            </div>
          ) : null}
        </div>
      ) : null}
      {!locked ? (
        <WorkOrderMaterialEditSheet
          open={sheetOpen}
          material={editingMaterial}
          unitOptions={materialUnitOptions}
          onClose={() => setSheetOpen(false)}
          onApply={onSaveDraft}
        />
      ) : null}
    </section>
  );
}
