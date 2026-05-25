import "server-only";

import type { WorkOrder, WorkOrderStatePatch } from "@/types/workorder";
import { syncDbFactoryOrdersForSpecSheet } from "@/lib/workorder/repository/dbFactoryOrderRepository";
import { syncDbSpecSheetMaterialsForSpecSheet } from "@/lib/workorder/repository/dbSpecSheetMaterialRepository";
import { syncDbSpecSheetOutsourcingForSpecSheet } from "@/lib/workorder/repository/dbSpecSheetOutsourcingRepository";
import { canServiceReplaceProductionComposition } from "@/lib/workorder/serviceCodeGuards";
import type { WorkOrderCompanyScope } from "@/lib/workorder/repository/dbWorkOrderRepositoryScope";

type ResolvedWorkOrderCompany = {
  companyId: string;
  companyName: string;
};

type FindWorkOrderById = (
  workOrderId: string,
  scope?: WorkOrderCompanyScope | null,
) => Promise<WorkOrder | null>;

export async function syncCreatedWorkOrderProductionComposition(
  workOrder: WorkOrder,
  company: ResolvedWorkOrderCompany,
): Promise<void> {
  await syncDbFactoryOrdersForSpecSheet(workOrder, company);
  await syncDbSpecSheetMaterialsForSpecSheet(workOrder, company);
  await syncDbSpecSheetOutsourcingForSpecSheet(workOrder, company);
}

export function shouldSyncProductionCompositionForFullWorkOrderSave(
  _workOrder: WorkOrder,
): boolean {
  // Full work-order saves are used by immediate/basic field updates such as
  // manager, title, category, and inventory changes. They must not mutate
  // production-composition detail tables. Production rows are replaced only
  // through serviceCode-guarded state patch saves.
  return false;
}

export function mergeWorkOrderWithExistingProductionDetails(
  baseWorkOrder: WorkOrder,
  existingWorkOrder: WorkOrder | null | undefined,
): WorkOrder {
  if (!existingWorkOrder) return baseWorkOrder;

  return {
    ...existingWorkOrder,
    ...baseWorkOrder,
    factoryOrderRequest: existingWorkOrder.factoryOrderRequest ?? null,
    orderEntries: existingWorkOrder.orderEntries ?? [],
    materials: existingWorkOrder.materials ?? [],
    outsourcing: existingWorkOrder.outsourcing ?? [],
    hasDetailSnapshot: existingWorkOrder.hasDetailSnapshot ?? baseWorkOrder.hasDetailSnapshot,
  };
}

export async function syncPatchedWorkOrderProductionComposition(params: {
  patch: WorkOrderStatePatch;
  mappedWorkOrder: WorkOrder;
  company: ResolvedWorkOrderCompany;
  scope?: WorkOrderCompanyScope | null;
  findWorkOrderById: FindWorkOrderById;
}): Promise<WorkOrder | null> {
  const { patch, mappedWorkOrder, company, scope, findWorkOrderById } = params;
  const hasOrderEntriesPatch = Object.prototype.hasOwnProperty.call(
    patch,
    "orderEntries",
  );
  const hasFactoryOrderRequestPatch = Object.prototype.hasOwnProperty.call(
    patch,
    "factoryOrderRequest",
  );
  const hasMaterialsPatch = Object.prototype.hasOwnProperty.call(
    patch,
    "materials",
  );
  const hasOutsourcingPatch = Object.prototype.hasOwnProperty.call(
    patch,
    "outsourcing",
  );
  const hasProductionCompositionPatch =
    hasOrderEntriesPatch ||
    hasFactoryOrderRequestPatch ||
    hasMaterialsPatch ||
    hasOutsourcingPatch;
  const canSyncProductionComposition = canServiceReplaceProductionComposition(
    patch.serviceCode ?? null,
  );

  if (!hasProductionCompositionPatch || !canSyncProductionComposition) {
    return null;
  }

  const existing = await findWorkOrderById(patch.id, scope);
  const patchedWorkOrder: WorkOrder = {
    ...(existing ?? mappedWorkOrder),
    ...mappedWorkOrder,
    orderEntries: hasOrderEntriesPatch
      ? (patch.orderEntries ?? [])
      : (existing?.orderEntries ?? []),
    materials: hasMaterialsPatch
      ? (patch.materials ?? [])
      : (existing?.materials ?? []),
    outsourcing: hasOutsourcingPatch
      ? (patch.outsourcing ?? [])
      : (existing?.outsourcing ?? []),
    factoryOrderRequest: hasFactoryOrderRequestPatch
      ? (patch.factoryOrderRequest ?? null)
      : (existing?.factoryOrderRequest ?? null),
  };

  if (hasOrderEntriesPatch || hasFactoryOrderRequestPatch) {
    await syncDbFactoryOrdersForSpecSheet(patchedWorkOrder, company);
  }
  if (hasMaterialsPatch) {
    await syncDbSpecSheetMaterialsForSpecSheet(patchedWorkOrder, company);
  }
  if (hasOutsourcingPatch) {
    await syncDbSpecSheetOutsourcingForSpecSheet(patchedWorkOrder, company);
  }

  return patchedWorkOrder;
}
