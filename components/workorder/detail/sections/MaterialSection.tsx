"use client";

import { useState } from "react";

import {
  WaflBadge,
  WaflCard,
  SectionCountBadge,
  WaflAddCardButton,
  WaflAddIconBubble,
  WaflButton,
  WaflEmptyCard,
  WaflInfoBox,
} from "@/components/common/ui";
import {
  formatWorkOrderQuantity,
  WorkOrderSectionListCard,
} from "@/components/workorder/detail/sections/WorkOrderSectionListPrimitives";
import { useI18n } from "@/lib/i18n";
import { translateWorkOrderDisplayText } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import { getTranslatedWorkOrderSelectDisplayValue } from "@/lib/workorder/detail/selectDisplayPresentation";
import { useCompanyStandardOptions } from "@/lib/admin/settings/useCompanyStandardOptions";
import {
  type EditableCell,
  type EditableSectionKey,
} from "@/components/workorder/detail/shared/detailEditorShared";
import WorkOrderMaterialEditSheet, {
  type MaterialSheetDraft,
} from "@/components/workorder/detail/sections/WorkOrderMaterialEditSheet";
import type { Material } from "@/types/workorder";

function MaterialTypeBadge({ item }: { item: Material }) {
  const { locale } = useI18n();

  return (
    <WaflBadge tone="neutral" size="sm">
      {getTranslatedWorkOrderSelectDisplayValue(item.type, (value) =>
        translateWorkOrderDisplayText(value, locale),
      )}
    </WaflBadge>
  );
}

export default function MaterialSection({
  materials,
  open,
  onToggle,
  onAdd,
  onRemove,
  onRemoveZeroQuantity,
  onSaveDraft,
  locked = false,
}: {
  materials: Material[];
  open: boolean;
  onToggle: () => void;
  editingCell: EditableCell;
  editingValue: string;
  onStartEdit: (
    section: EditableSectionKey,
    rowId: string,
    field: string,
    value: string,
  ) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onRemoveZeroQuantity: () => void;
  onSaveDraft: (materialId: string | null, draft: MaterialSheetDraft) => void;
  locked?: boolean;
}) {
  const { i18n, locale } = useI18n();
  const { materialUnitOptions } = useCompanyStandardOptions();
  const copy = i18n.workorder.ui.sections.material;
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const zeroQuantityCount = materials.filter(
    (item) => Math.max(0, Number(item.quantity) || 0) <= 0,
  ).length;
  void open;
  void onToggle;
  void onAdd;

  const openAddSheet = () => {
    setEditingMaterial(null);
    setSheetOpen(true);
  };

  const openEditSheet = (item: Material) => {
    setEditingMaterial(item);
    setSheetOpen(true);
  };

  return (
    <section className="min-w-0 xl:h-full">
      <div className="mb-2 flex min-w-0 items-end justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="min-w-0 text-sm font-semibold leading-5 text-[var(--pbp-text-primary)]">
            {copy.title}
          </h3>
          <SectionCountBadge>{materials.length}건</SectionCountBadge>
        </div>
      </div>
      <WaflCard
        className="space-y-2 xl:max-h-[320px] xl:overflow-auto xl:p-4"
        padding="sm"
      >
        {materials.length === 0 ? (
          <WaflEmptyCard density="spacious" className="pbp-text-muted">
            {copy.empty}
          </WaflEmptyCard>
        ) : null}

        {!locked && zeroQuantityCount > 0 ? (
          <WaflInfoBox
            tone="warning"
            shape="control"
            state="warning"
            className="text-xs leading-5"
          >
            <div className="font-semibold">
              {copy.zeroQuantityNoticeTitle.replace(
                "{count}",
                String(zeroQuantityCount),
              )}
            </div>
            <div className="mt-0.5">{copy.zeroQuantityNoticeDescription}</div>
            <WaflButton
              size="sm"
              variant="neutral"
              onClick={onRemoveZeroQuantity}
              className="mt-2"
            >
              {copy.zeroQuantityCleanupButton}
            </WaflButton>
          </WaflInfoBox>
        ) : null}

        {materials.map((item, rowIndex) => (
          <WorkOrderSectionListCard
            key={item.id}
            component="material-list-card"
            title={
              item.name ||
              copy.fallbackItem.replace("{index}", String(rowIndex + 1))
            }
            badge={<MaterialTypeBadge item={item} />}
            details={[
              formatWorkOrderQuantity(
                item.quantity,
                ` ${translateWorkOrderDisplayText(item.unit, locale)}`,
              ),
            ]}
            locked={locked}
            onEdit={() => openEditSheet(item)}
            onRemove={() => onRemove(item.id)}
            editLabel={copy.editButton}
          />
        ))}
        {!locked ? (
          <WaflAddCardButton
            component="material-add-button"
            density="default"
            onClick={openAddSheet}
            className="w-full"
            aria-label={copy.addButton}
            title={copy.addButton}
          >
            <WaflAddIconBubble />
          </WaflAddCardButton>
        ) : null}
      </WaflCard>
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
