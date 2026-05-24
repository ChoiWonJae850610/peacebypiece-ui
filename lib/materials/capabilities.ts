import "server-only";

import { hasWorkspaceApiPermission } from "@/lib/auth/apiRouteGuards";
import type { WaflSessionPayload } from "@/lib/auth/session";
import type { MaterialCapabilityState } from "@/lib/materials/types";

export async function buildMaterialCapabilityState(
  session: WaflSessionPayload,
): Promise<MaterialCapabilityState> {
  return {
    canManageMaterials: await hasWorkspaceApiPermission(session, "standards.manage"),
    canManageWorkorderMaterialLines: await hasWorkspaceApiPermission(session, "workorder.update"),
    canChangeWorkorderMaterialOrderStatus: await hasWorkspaceApiPermission(session, "workorder.status.order"),
  };
}

export async function withMaterialCapabilityState<TPayload extends Record<string, unknown>>(
  payload: TPayload,
  session: WaflSessionPayload,
): Promise<TPayload & { capabilities: MaterialCapabilityState }> {
  return {
    ...payload,
    capabilities: await buildMaterialCapabilityState(session),
  };
}
