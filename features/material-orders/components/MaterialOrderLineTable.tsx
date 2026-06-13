"use client";

import { useState } from "react";

import { WaflEmptyWorkspaceState } from "@/components/common/ui";
import { MATERIAL_ORDER_EMPTY_STATE_COPY } from "@/features/material-orders/materialOrderEmptyStates";
import {
  calculateMaterialOrderLineAmount,
  type MaterialOrderDraftLine,
} from "@/lib/material-orders/materialOrderDraftCalculator";
import {
  MaterialOrderLineCard,
  MaterialOrderLineEditModal,
  resolveUnitSelectValue,
  type MaterialOrderLineEditDraft,
} from "@/features/material-orders/components/MaterialOrderLineCard";

type MaterialOrderLineTableProps = {
  lines: MaterialOrderDraftLine[];
  editable: boolean;
  onChangeLine: (
    lineId: string,
    patch: Partial<MaterialOrderDraftLine>,
  ) => void;
  onRemoveLine: (lineId: string) => void;
};

export function MaterialOrderLineTable(props: MaterialOrderLineTableProps) {
  return <MaterialOrderLineCards {...props} />;
}

export function MaterialOrderLineMobileCards(props: MaterialOrderLineTableProps) {
  return <MaterialOrderLineCards {...props} mobile />;
}

function MaterialOrderLineCards({
  lines,
  editable,
  onChangeLine,
  onRemoveLine,
  mobile = false,
}: MaterialOrderLineTableProps & { mobile?: boolean }) {
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editDraft, setEditDraft] =
    useState<MaterialOrderLineEditDraft | null>(null);
  const editingLine = editingLineId
    ? lines.find((line) => line.id === editingLineId) ?? null
    : null;

  const openEditModal = (line: MaterialOrderDraftLine) => {
    setEditingLineId(line.id);
    setEditDraft({
      itemName: line.itemName,
      unit: resolveUnitSelectValue(line.unit),
      orderQuantity: line.orderQuantity,
      unitPrice: line.unitPrice,
    });
  };

  const closeEditModal = () => {
    setEditingLineId(null);
    setEditDraft(null);
  };

  const applyEdit = () => {
    if (!editingLine || !editDraft) return;
    if (editDraft.itemName.trim().length === 0 || editDraft.orderQuantity < 1)
      return;

    onChangeLine(editingLine.id, {
      itemName: editDraft.itemName,
      unit: editDraft.unit,
      orderQuantity: editDraft.orderQuantity,
      unitPrice: editDraft.unitPrice,
    });
    closeEditModal();
  };

  if (lines.length === 0) {
    return (
      <WaflEmptyWorkspaceState
        title={MATERIAL_ORDER_EMPTY_STATE_COPY.noOrderLines.title}
        description={MATERIAL_ORDER_EMPTY_STATE_COPY.noOrderLines.description}
        variant="inline-section"
        className={mobile ? "min-h-[120px]" : "min-h-[96px]"}
      />
    );
  }

  return (
    <>
      <div className="grid min-w-0 gap-2">
        {lines.map((line) => (
          <MaterialOrderLineCard
            key={line.id}
            line={line}
            editable={editable}
            onEdit={() => openEditModal(line)}
            onRemove={() => onRemoveLine(line.id)}
            menuPanelClassName="bottom-9 top-auto"
          />
        ))}
      </div>
      {editingLine && editDraft ? (
        <MaterialOrderLineEditModal
          draft={editDraft}
          lineAmount={calculateMaterialOrderLineAmount({
            ...editingLine,
            ...editDraft,
          })}
          onChangeDraft={setEditDraft}
          onClose={closeEditModal}
          onApply={applyEdit}
        />
      ) : null}
    </>
  );
}
