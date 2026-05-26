import "server-only";

import {
  createMaterialOrderForCompany,
  listMaterialOrdersByCompany,
  listMaterialOrderSuppliersByCompany,
  updateMaterialOrderDetailForCompany,
  updateMaterialOrderStatusForCompany,
} from "@/lib/material-orders/repository";
import type {
  MaterialOrderCreateInput,
  MaterialOrderListParams,
  MaterialOrderListResult,
  MaterialOrderMutationResult,
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
    materialOrders: await listMaterialOrdersByCompany({ companyId: input.companyId }),
  };
}

export async function updateWorkspaceMaterialOrderDetail(
  input: MaterialOrderUpdateInput,
): Promise<MaterialOrderMutationResult> {
  const materialOrder = await updateMaterialOrderDetailForCompany(input);

  return {
    materialOrder,
    materialOrders: await listMaterialOrdersByCompany({ companyId: input.companyId }),
  };
}

export async function updateWorkspaceMaterialOrderStatus(
  input: MaterialOrderStatusUpdateInput,
): Promise<MaterialOrderMutationResult> {
  const materialOrder = await updateMaterialOrderStatusForCompany(input);

  return {
    materialOrder,
    materialOrders: await listMaterialOrdersByCompany({ companyId: input.companyId }),
  };
}
