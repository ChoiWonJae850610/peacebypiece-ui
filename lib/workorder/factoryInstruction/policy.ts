import "server-only";

import { NextResponse } from "next/server";

import type { WaflSessionPayload } from "@/lib/auth/session";
import { isCompanyAdminSessionRole } from "@/lib/constants/sessionRoles";
import { canEditBeforeOrder } from "@/lib/constants/workorderStates";
import type { WorkOrder } from "@/types/workorder";

export type WorkOrderFactoryInstructionEditPolicy = {
  editable: boolean;
  code: string | null;
  message: string | null;
};

export function getWorkOrderFactoryInstructionEditPolicy(input: {
  session: WaflSessionPayload;
  workOrder: Pick<WorkOrder, "workflowState">;
}): WorkOrderFactoryInstructionEditPolicy {
  const isAdmin = isCompanyAdminSessionRole(input.session.role);
  const editable = canEditBeforeOrder(input.workOrder.workflowState, isAdmin);

  if (editable) {
    return { editable: true, code: null, message: null };
  }

  return {
    editable: false,
    code: "WORKORDER_FACTORY_INSTRUCTION_LOCKED",
    message: isAdmin
      ? "발주요청 이후에는 공장 전달사항을 변경할 수 없습니다."
      : "작성중 또는 반려 상태에서만 공장 전달사항을 변경할 수 있습니다.",
  };
}

export function createWorkOrderFactoryInstructionLockedResponse(
  policy: WorkOrderFactoryInstructionEditPolicy,
): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      code: policy.code ?? "WORKORDER_FACTORY_INSTRUCTION_LOCKED",
      message: policy.message ?? "공장 전달사항을 변경할 수 없습니다.",
    },
    { status: 409 },
  );
}
