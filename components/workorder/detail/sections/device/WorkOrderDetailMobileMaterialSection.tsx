import { useState } from "react";

import { AppCard, SectionCountBadge } from "@/components/common/ui";
import { WorkOrderAddIconButton } from "@/components/workorder/common/WorkOrderIconButtons";
import { useI18n } from "@/lib/i18n";
import { getTranslatedWorkOrderSelectDisplayValue } from "@/lib/workorder/detail/selectDisplayPresentation";
import { translateWorkOrderDisplayText } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import { useCompanyStandardOptions } from "@/lib/admin/settings/useCompanyStandardOptions";
import { DeleteButton, type EditableCell, type EditableSectionKey } from "@/components/workorder/detail/shared/detailEditorShared";
import WorkOrderMaterialEditSheet, { type MaterialSheetDraft } from "@/components/workorder/detail/sections/WorkOrderMaterialEditSheet";
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

function SectionAddButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <WorkOrderAddIconButton
      label={label}
      size="md"
      onClick={onClick}
      disabled={disabled}
    />
  );
}

function MaterialListCard({
  item,
  index,
  locked,
  onEdit,
  onRemove,
}: {
  item: Material;
  index: number;
  locked: boolean;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const { i18n, locale } = useI18n();
  const copy = i18n.workorder.ui.sections.material;
  const common = i18n.workorder.ui.common;
  const title = item.name || copy.fallbackItem.replace("{index}", String(index + 1));

  return (
    <AppCard variant="subtle" padding="sm" className="rounded-[22px]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex rounded-full bg-[var(--pbp-surface-muted)] px-2 py-0.5 text-[11px] font-semibold pbp-text-muted">
            {getTranslatedWorkOrderSelectDisplayValue(item.type, (value) => translateWorkOrderDisplayText(value, locale))}
          </div>
          <div className="mt-2 truncate text-sm font-semibold pbp-text-primary">{title}</div>
          <div className="mt-1 text-xs pbp-text-muted">
            {item.quantity.toLocaleString()} {translateWorkOrderDisplayText(item.unit, locale)}
          </div>
        </div>
        {!locked ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={onEdit}
              className="pbp-interactive-button rounded-full border border-[var(--pbp-border)] bg-[var(--pbp-surface)] px-3 py-1 text-[11px] font-semibold pbp-text-secondary shadow-sm"
            >
              {copy.editButton}
            </button>
            <DeleteButton onClick={onRemove} srLabel={`${title} ${common.deleteSuffix}`} />
          </div>
        ) : null}
      </div>
    </AppCard>
  );
}

export default function WorkOrderDetailMobileMaterialSection({
  materials,
  onRemove,
  onRemoveZeroQuantity,
  onSaveDraft,
  locked = false,
  title,
}: Props) {
  const { i18n } = useI18n();
  const { materialUnitOptions } = useCompanyStandardOptions();
  const copy = i18n.workorder.ui.sections.material;
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const zeroQuantityCount = materials.filter((item) => Math.max(0, Number(item.quantity) || 0) <= 0).length;
  const headerTitle = title ?? copy.title;

  const openAddSheet = () => {
    setEditingMaterial(null);
    setSheetOpen(true);
  };

  const openEditSheet = (item: Material) => {
    setEditingMaterial(item);
    setSheetOpen(true);
  };

  return (
    <section className="mt-5 min-w-0">
      <div className="mb-2.5 flex min-w-0 items-end justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="min-w-0 text-sm font-semibold leading-5 text-stone-900">{headerTitle}</h3>
          <SectionCountBadge>{materials.length}건</SectionCountBadge>
        </div>
        {!locked ? <SectionAddButton label={copy.addButton} disabled={locked} onClick={openAddSheet} /> : null}
      </div>
      <AppCard className="space-y-2" padding="sm">
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

        {materials.map((item, index) => (
          <MaterialListCard
            key={item.id}
            item={item}
            index={index}
            locked={locked}
            onEdit={() => openEditSheet(item)}
            onRemove={() => onRemove(item.id)}
          />
        ))}
      </AppCard>
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
