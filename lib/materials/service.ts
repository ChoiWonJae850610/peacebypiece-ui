import "server-only";

import {
  createMaterialForCompany,
  deleteMaterialForCompany,
  listMaterialsByCompany,
  updateMaterialForCompany,
} from "@/lib/materials/repository";
import type { Material, MaterialMutationInput, MaterialRepositoryListParams } from "@/lib/materials/types";

export type MaterialListResult = {
  materials: Material[];
};

export async function listWorkspaceMaterials(params: MaterialRepositoryListParams): Promise<MaterialListResult> {
  return {
    materials: await listMaterialsByCompany(params),
  };
}

export async function createWorkspaceMaterial(input: MaterialMutationInput): Promise<MaterialListResult> {
  await createMaterialForCompany(input);
  return listWorkspaceMaterials({ companyId: input.companyId });
}

export async function updateWorkspaceMaterial(materialId: string, input: MaterialMutationInput): Promise<MaterialListResult> {
  await updateMaterialForCompany(materialId, input);
  return listWorkspaceMaterials({ companyId: input.companyId });
}

export async function deleteWorkspaceMaterial(input: { companyId: string; materialId: string }): Promise<MaterialListResult> {
  await deleteMaterialForCompany(input);
  return listWorkspaceMaterials({ companyId: input.companyId });
}
