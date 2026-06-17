import "server-only";

import {
  createMaterialOrderForCompany,
  listMaterialOrdersByCompany,
  listMaterialOrderSuppliersByCompany,
  updateMaterialOrderDetailForCompany,
  updateMaterialOrderHeaderForCompany,
  updateMaterialOrderStatusForCompany,
} from "@/lib/material-orders/repository";
import type {
  MaterialOrderCreateInput,
  MaterialOrderListParams,
  MaterialOrderHeaderUpdateInput,
  MaterialOrderListResult,
  MaterialOrderMutationResult,
  MaterialOrderPatchMutationResult,
  MaterialOrderStatusUpdateInput,
  MaterialOrderSupplierListParams,
  MaterialOrderSupplierListResult,
  MaterialOrderUpdateInput,
} from "@/lib/material-orders/types";

export async function listWorkspaceMaterialOrders(
  params: MaterialOrderListParams,
): Promise<MaterialOrderListResult> {
  return {
    materialOrders: await listMaterialOrdersByCompany(params),
  };
}


export async function listWorkspaceMaterialOrderSuppliers(
  params: MaterialOrderSupplierListParams,
): Promise<MaterialOrderSupplierListResult> {
  return {
    suppliers: await listMaterialOrderSuppliersByCompany(params),
  };
}

export async function createWorkspaceMaterialOrder(
  input: MaterialOrderCreateInput,
): Promise<MaterialOrderMutationResult> {
  const materialOrder = await createMaterialOrderForCompany(input);

  return {
    materialOrder,
    materialOrders: await listMaterialOrdersByCompany({ companyId: input.companyId, visibility: input.visibility }),
  };
}

export async function updateWorkspaceMaterialOrderHeader(
  input: MaterialOrderHeaderUpdateInput,
): Promise<MaterialOrderPatchMutationResult> {
  const materialOrder = await updateMaterialOrderHeaderForCompany(input);
  if (!materialOrder) throw new Error("MATERIAL_ORDER_NOT_FOUND_OR_FORBIDDEN");

  const patch: Partial<typeof materialOrder> = {};
  if (Object.prototype.hasOwnProperty.call(input, "materialType")) {
    patch.materialType = materialOrder.materialType;
    patch.supplierPartnerId = materialOrder.supplierPartnerId;
    patch.supplierPartnerName = materialOrder.supplierPartnerName;
    patch.totalAmount = materialOrder.totalAmount;
    patch.lines = materialOrder.lines;
  }
  if (Object.prototype.hasOwnProperty.call(input, "supplierPartnerId")) {
    patch.supplierPartnerId = materialOrder.supplierPartnerId;
    patch.supplierPartnerName = materialOrder.supplierPartnerName;
  }
  if (Object.prototype.hasOwnProperty.call(input, "dueDate")) {
    patch.dueDate = materialOrder.dueDate;
  }

  return {
    result: {
      resourceId: materialOrder.id,
      patch,
      updatedAt: materialOrder.updatedAt,
    },
  };
}

export async function updateWorkspaceMaterialOrderDetail(
  input: MaterialOrderUpdateInput,
): Promise<MaterialOrderMutationResult> {
  const materialOrder = await updateMaterialOrderDetailForCompany(input);

  return {
    materialOrder,
    materialOrders: await listMaterialOrdersByCompany({ companyId: input.companyId, visibility: input.visibility }),
  };
}

export async function updateWorkspaceMaterialOrderStatus(
  input: MaterialOrderStatusUpdateInput,
): Promise<MaterialOrderPatchMutationResult> {
  const materialOrder = await updateMaterialOrderStatusForCompany(input);
  if (!materialOrder) throw new Error("MATERIAL_ORDER_STATUS_NOT_FOUND_OR_FORBIDDEN");

  return {
    result: {
      resourceId: materialOrder.id,
      patch: {
        status: materialOrder.status,
        workflowPath: materialOrder.workflowPath,
        approvedByUserId: materialOrder.approvedByUserId,
        orderedAt: materialOrder.orderedAt,
      },
      updatedAt: materialOrder.updatedAt,
    },
  };
}
