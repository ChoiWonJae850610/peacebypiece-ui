import { useEffect, useState } from "react";
import type { EditableCell } from "@/components/workorder/detail/shared/detailEditorShared";
import { recalculateMaterial } from "@/lib/workorder/detail/detailCalculations";
import {
  commitMaterialItemsEdit,
  createNewMaterialItem,
  toMaterialsPatch,
} from "@/lib/hooks/workorder/detailEditor/materialMutations";
import type { Material, WorkOrder } from "@/types/workorder";

type UseWorkOrderMaterialsEditorParams = {
  workOrder: WorkOrder;
  editingCell: EditableCell;
  onUpdateWorkOrder: (patch: Partial<WorkOrder>) => void;
  cancelEdit: () => void;
};

export function useWorkOrderMaterialsEditor({
  workOrder,
  editingCell,
  onUpdateWorkOrder,
  cancelEdit,
}: UseWorkOrderMaterialsEditorParams) {
  const [materialItems, setMaterialItems] = useState<Material[]>(() => (workOrder.materials ?? []).map(recalculateMaterial));

  useEffect(() => {
    setMaterialItems((workOrder.materials ?? []).map(recalculateMaterial));
  }, [workOrder.materials]);

  const commitMaterialEdit = (nextValue: string, nextEditingCell: Exclude<EditableCell, null>) => {
    const nextItems = commitMaterialItemsEdit({
      materialItems,
      editingCell: nextEditingCell,
      nextValue,
    });
    setMaterialItems(nextItems);
    onUpdateWorkOrder(toMaterialsPatch(nextItems));
  };

  const applyMaterialDraftValue = (nextValue: string, nextEditingCell: Exclude<EditableCell, null>) => {
    const nextItems = commitMaterialItemsEdit({
      materialItems,
      editingCell: nextEditingCell,
      nextValue,
    });
    setMaterialItems(nextItems);
    onUpdateWorkOrder(toMaterialsPatch(nextItems));
  };

  const addMaterial = () => {
    const nextItems = [...materialItems, createNewMaterialItem()];
    setMaterialItems(nextItems);
    onUpdateWorkOrder(toMaterialsPatch(nextItems));
  };

  const removeMaterial = (id: string) => {
    const nextItems = materialItems.filter((item) => item.id !== id);
    setMaterialItems(nextItems);
    onUpdateWorkOrder(toMaterialsPatch(nextItems));
    if (editingCell?.section === "material" && editingCell.rowId === id) {
      cancelEdit();
    }
  };

  const removeZeroQuantityMaterials = () => {
    const zeroQuantityIds = new Set(
      materialItems
        .filter((item) => Math.max(0, Number(item.quantity) || 0) <= 0)
        .map((item) => item.id),
    );

    if (zeroQuantityIds.size === 0) {
      return;
    }

    const nextItems = materialItems.filter((item) => !zeroQuantityIds.has(item.id));
    setMaterialItems(nextItems);
    onUpdateWorkOrder(toMaterialsPatch(nextItems));
    if (editingCell?.section === "material" && zeroQuantityIds.has(editingCell.rowId)) {
      cancelEdit();
    }
  };

  return {
    materialItems,
    commitMaterialEdit,
    applyMaterialDraftValue,
    addMaterial,
    removeMaterial,
    removeZeroQuantityMaterials,
  };
}
