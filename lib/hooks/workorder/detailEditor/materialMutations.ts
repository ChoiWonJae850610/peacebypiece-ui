import { MATERIAL_TYPE } from "@/lib/constants/material";
import { MATERIAL_KIND } from "@/lib/constants/workorderDomain";
import { recalculateMaterial } from "@/lib/workorder/detail/detailCalculations";
import { toNumber } from "@/lib/workorder/detail/detailSanitizers";
import { createDefaultMaterial } from "@/lib/workorder/material/materialDefaults";
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
      const nextType = (payload.nextValue || MATERIAL_TYPE.unselected) as Material["type"];
      const nextUnit = nextType === MATERIAL_KIND.fabric
        ? "야드"
        : nextType === MATERIAL_KIND.subsidiary
          ? "개"
          : item.unit;
      if (nextType !== item.type) {
        return { ...item, type: nextType, unit: nextUnit, vendor: "", vendorRef: null };
      }
      return { ...item, type: nextType };
    }

    return { ...item, [payload.editingCell.field]: payload.nextValue } as Material;
  });
}

export function createNewMaterialItem() {
  return createDefaultMaterial();
}

export function toMaterialsPatch(materialItems: Material[]): Partial<WorkOrder> {
  return {
    materials: materialItems.map((item) => recalculateMaterial(item)),
  };
}
