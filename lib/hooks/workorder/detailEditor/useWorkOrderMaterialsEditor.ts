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

  return {
    materialItems,
    commitMaterialEdit,
    addMaterial,
    removeMaterial,
  };
}
