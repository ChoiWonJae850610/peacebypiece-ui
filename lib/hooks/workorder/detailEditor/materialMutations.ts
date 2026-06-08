import { MATERIAL_TYPE, MATERIAL_UNIT, normalizeMaterialUnitValue } from "@/lib/constants/material";
import { MATERIAL_KIND } from "@/lib/constants/workorderDomain";
import { recalculateMaterial } from "@/lib/workorder/detail/detailCalculations";
import { normalizeProductionMaterialRows } from "@/lib/workorder/productionCompositionSnapshot";
import { toNumber } from "@/lib/workorder/detail/detailSanitizers";
import { createDefaultMaterial } from "@/lib/workorder/material/materialDefaults";
import type { EditableCell } from "@/components/workorder/detail/shared/detailEditorShared";
import type { MaterialSheetDraft } from "@/components/workorder/detail/sections/WorkOrderMaterialEditSheet";
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
        ? MATERIAL_UNIT.yard
        : nextType === MATERIAL_KIND.subsidiary
          ? MATERIAL_UNIT.piece
          : item.unit;
      if (nextType !== item.type) {
        return { ...item, type: nextType, unit: nextUnit, vendor: "", vendorRef: null };
      }
      return { ...item, type: nextType };
    }

    if (payload.editingCell.field === "unit") {
      return recalculateMaterial({ ...item, unit: normalizeMaterialUnitValue(payload.nextValue) });
    }

    return { ...item, [payload.editingCell.field]: payload.nextValue } as Material;
  });
}

export function createNewMaterialItem() {
  return createDefaultMaterial();
}

export function createOrUpdateMaterialItem({
  materialItems,
  materialId,
  draft,
}: {
  materialItems: Material[];
  materialId: string | null;
  draft: MaterialSheetDraft;
}) {
  const sanitizedDraft = {
    type: draft.type,
    name: draft.name.trim() || createDefaultMaterial().name,
    quantity: Number.isFinite(draft.quantity) ? Math.max(0, draft.quantity) : 0,
    unit: normalizeMaterialUnitValue(draft.unit),
  };

  if (!materialId) {
    return [
      ...materialItems,
      createDefaultMaterial(sanitizedDraft),
    ];
  }

  return materialItems.map((item) => {
    if (item.id !== materialId) return item;
    const nextUnit = sanitizedDraft.type === MATERIAL_KIND.fabric
      ? sanitizedDraft.unit || MATERIAL_UNIT.yard
      : sanitizedDraft.type === MATERIAL_KIND.subsidiary
        ? sanitizedDraft.unit || MATERIAL_UNIT.piece
        : sanitizedDraft.unit;

    return recalculateMaterial({
      ...item,
      type: sanitizedDraft.type,
      name: sanitizedDraft.name,
      quantity: sanitizedDraft.quantity,
      unit: normalizeMaterialUnitValue(nextUnit),
      ...(sanitizedDraft.type !== item.type ? { vendor: "", vendorRef: null, vendorPartnerId: null } : {}),
    });
  });
}

export function toMaterialsPatch(materialItems: Material[]): Partial<WorkOrder> {
  return {
    materials: normalizeProductionMaterialRows(materialItems.map((item) => recalculateMaterial({ ...item, unit: normalizeMaterialUnitValue(item.unit) }))),
  };
}
