import "server-only";

import { listMaterialsByCompany } from "@/lib/materials/repository";
import {
  createWorkorderMaterialLineForCompany,
  deleteWorkorderMaterialLineForCompany,
  listWorkorderMaterialLinesByCompany,
  updateWorkorderMaterialLineOrderStatusForCompany,
} from "@/lib/materials/workorderMaterialLinesRepository";
import type {
  Material,
  MaterialOrderStatus,
  WorkorderMaterialLineMutationInput,
  WorkorderMaterialLineWithMaterial,
} from "@/lib/materials/types";

export type WorkorderMaterialLinesResult = {
  materials: Material[];
  lines: WorkorderMaterialLineWithMaterial[];
};

export async function listWorkspaceWorkorderMaterialLines(input: {
  companyId: string;
  workorderId: string;
}): Promise<WorkorderMaterialLinesResult> {
  const [materials, lines] = await Promise.all([
    listMaterialsByCompany({ companyId: input.companyId, status: "active" }),
    listWorkorderMaterialLinesByCompany(input),
  ]);

  return { materials, lines };
}

export async function createWorkspaceWorkorderMaterialLine(input: WorkorderMaterialLineMutationInput): Promise<WorkorderMaterialLinesResult> {
  await createWorkorderMaterialLineForCompany(input);
  return listWorkspaceWorkorderMaterialLines({ companyId: input.companyId, workorderId: input.workorderId });
}

export async function deleteWorkspaceWorkorderMaterialLine(input: {
  companyId: string;
  workorderId: string;
  lineId: string;
}): Promise<WorkorderMaterialLinesResult> {
  await deleteWorkorderMaterialLineForCompany(input);
  return listWorkspaceWorkorderMaterialLines({ companyId: input.companyId, workorderId: input.workorderId });
}

export async function updateWorkspaceWorkorderMaterialLineOrderStatus(input: {
  companyId: string;
  workorderId: string;
  lineId: string;
  orderStatus: MaterialOrderStatus;
}): Promise<WorkorderMaterialLinesResult> {
  await updateWorkorderMaterialLineOrderStatusForCompany(input);
  return listWorkspaceWorkorderMaterialLines({ companyId: input.companyId, workorderId: input.workorderId });
}
