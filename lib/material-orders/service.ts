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
  MaterialOrderSingleMutationResult,
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
): Promise<MaterialOrderSingleMutationResult> {
  return {
    materialOrder: await updateMaterialOrderHeaderForCompany(input),
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
): Promise<MaterialOrderSingleMutationResult> {
  return {
    materialOrder: await updateMaterialOrderStatusForCompany(input),
  };
}
