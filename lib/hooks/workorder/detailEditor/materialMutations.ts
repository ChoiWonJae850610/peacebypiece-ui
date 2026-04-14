import {
  DEFAULT_MATERIAL_STATUS,
  DEFAULT_MATERIAL_TYPE,
  DEFAULT_MATERIAL_UNIT,
  DEFAULT_NEW_MATERIAL_NAME,
} from "@/lib/constants/workorderOptions";
import { recalculateMaterial } from "@/lib/workorder/detail/detailCalculations";
import { createId, toNumber } from "@/lib/workorder/detail/detailSanitizers";
import type { EditableCell } from "@/components/workorder/detail/shared/detailEditorShared";
import type { Material, WorkOrder } from "@/types/workorder";

export function commitMaterialItemsEdit(payload: {
  materialItems: Material[];
  editingCell: Exclude<EditableCell, null>;
  nextValue: string;
}) {
  return payload.materialItems.map((item) => {
    if (item.id !== payload.editingCell.rowId) return item;

    if (payload.editingCell.field === "quantity") {
      return recalculateMaterial({ ...item, quantity: toNumber(payload.nextValue) });
    }
    if (payload.editingCell.field === "unitCost") {
      return recalculateMaterial({ ...item, unitCost: toNumber(payload.nextValue) });
    }
    if (payload.editingCell.field === "type") {
      return { ...item, type: (payload.nextValue || DEFAULT_MATERIAL_TYPE) as Material["type"] };
    }

    return { ...item, [payload.editingCell.field]: payload.nextValue } as Material;
  });
}

export function createNewMaterialItem() {
  return recalculateMaterial({
    id: createId("material"),
    type: DEFAULT_MATERIAL_TYPE,
    name: DEFAULT_NEW_MATERIAL_NAME,
    vendor: "",
    quantity: 0,
    unit: DEFAULT_MATERIAL_UNIT,
    unitCost: 0,
    totalCost: 0,
    status: DEFAULT_MATERIAL_STATUS,
  });
}

export function toMaterialsPatch(materialItems: Material[]): Partial<WorkOrder> {
  return {
    materials: materialItems.map((item) => recalculateMaterial(item)),
  };
}
