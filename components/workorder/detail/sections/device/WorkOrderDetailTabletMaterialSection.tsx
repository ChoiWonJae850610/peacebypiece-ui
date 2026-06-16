import { useState } from "react";

import {
  WaflBadge,
  WaflAddCardButton,
  WaflAddIconBubble,
  WaflButton,
  WaflEmptyCard,
  WaflInfoBox,
  WaflSurface,
} from "@/components/common/ui";
import { WorkOrderCardActionMenu } from "@/components/workorder/common/WorkOrderIconButtons";
import { useI18n } from "@/lib/i18n";
import { getTranslatedWorkOrderSelectDisplayValue } from "@/lib/workorder/detail/selectDisplayPresentation";
import { translateWorkOrderDisplayText } from "@/lib/workorder/presentation/workOrderDisplayTranslation";
import { useCompanyStandardOptions } from "@/lib/admin/settings/useCompanyStandardOptions";
import {
  type EditableCell,
  type EditableSectionKey,
} from "@/components/workorder/detail/shared/detailEditorShared";
import WorkOrderMaterialEditSheet, {
  type MaterialSheetDraft,
} from "@/components/workorder/detail/sections/WorkOrderMaterialEditSheet";
import type { Material } from "@/types/material";

type Props = {
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
  vendorOptionsById: Record<string, string[]>;
  locked?: boolean;
  title?: string;
  summary?: string;
  sectionClassName?: string;
};

function AddItemCard({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <WaflAddCardButton
      component="material-add-button"
      density="default"
      onClick={onClick}
      disabled={disabled}
      className="w-full"
      aria-label={label}
      title={label}
    >
      <WaflAddIconBubble />
    </WaflAddCardButton>
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
  const title =
    item.name || copy.fallbackItem.replace("{index}", String(index + 1));

  return (
    <WaflSurface
      component="tablet-material-list-card"
      shape="control"
      tone="muted"
      className="p-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <WaflBadge tone="neutral" size="sm">
            {getTranslatedWorkOrderSelectDisplayValue(item.type, (value) =>
              translateWorkOrderDisplayText(value, locale),
            )}
          </WaflBadge>
          <div className="mt-2 truncate text-sm font-semibold pbp-text-primary">
            {title}
          </div>
          <div className="mt-1 text-xs pbp-text-muted">
            {item.quantity.toLocaleString()}{" "}
            {translateWorkOrderDisplayText(item.unit, locale)}
          </div>
        </div>
        {!locked ? (
          <WorkOrderCardActionMenu
            menuLabel={`${title} ${common.actionMenuSuffix}`}
            editLabel={`${title} ${copy.editButton}`}
            editText={copy.editButton}
            onEdit={onEdit}
            deleteLabel={`${title} ${common.deleteSuffix}`}
            deleteText={common.deleteSuffix}
            onDelete={onRemove}
          />
        ) : null}
      </div>
    </WaflSurface>
  );
}

export default function WorkOrderDetailTabletMaterialSection({
  materials,
  onRemove,
  onRemoveZeroQuantity,
  onSaveDraft,
  locked = false,
}: Props) {
  const { i18n } = useI18n();
  const { materialUnitOptions } = useCompanyStandardOptions();
  const copy = i18n.workorder.ui.sections.material;
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const zeroQuantityCount = materials.filter(
    (item) => Math.max(0, Number(item.quantity) || 0) <= 0,
  ).length;

  const openAddSheet = () => {
    setEditingMaterial(null);
    setSheetOpen(true);
  };

  const openEditSheet = (item: Material) => {
    setEditingMaterial(item);
    setSheetOpen(true);
  };

  return (
    <section className="min-w-0 space-y-2.5">
      {materials.length === 0 ? (
        <WaflEmptyCard density="default" className="pbp-text-muted">
          {copy.empty}
        </WaflEmptyCard>
      ) : null}

      {!locked && zeroQuantityCount > 0 ? (
        <WaflInfoBox
          tone="warning"
          shape="control"
          state="warning"
          density="compact"
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

      {!locked ? (
        <AddItemCard
          label={copy.addButton}
          disabled={locked}
          onClick={openAddSheet}
        />
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
