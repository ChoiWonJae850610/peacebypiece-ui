import { NextResponse } from "next/server";

import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import { MEMBER_PERMISSION_CODE } from "@/lib/permissions";
import { getWorkOrderDetailByCompany } from "@/lib/workorder/service/workOrderService";
import {
  getWorkOrderFactoryInstruction,
  saveWorkOrderFactoryInstruction,
} from "@/lib/workorder/factoryInstruction/repository";
import {
  FACTORY_INSTRUCTION_MAX_LENGTH,
  normalizeWorkOrderFactoryInstructionContent,
  type WorkOrderFactoryInstructionPatch,
} from "@/lib/workorder/factoryInstruction/types";
import {
  createWorkOrderFactoryInstructionLockedResponse,
  getWorkOrderFactoryInstructionEditPolicy,
} from "@/lib/workorder/factoryInstruction/policy";

type RouteContext = {
  params: Promise<{ workOrderId: string }>;
};

function createNotFoundResponse() {
  return NextResponse.json(
    { ok: false, code: "WORKORDER_NOT_FOUND", message: "작업지시서를 찾을 수 없습니다." },
    { status: 404 },
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const guard = await requireWorkspaceApiGuard({
    permissionCode: MEMBER_PERMISSION_CODE.workorderRead,
  });
  if (!guard.ok) return guard.response;

  const { workOrderId } = await context.params;
  const workOrder = await getWorkOrderDetailByCompany(workOrderId, guard.scope);
  if (!workOrder) return createNotFoundResponse();

  const instruction = await getWorkOrderFactoryInstruction(workOrderId, guard.scope);
  const editPolicy = getWorkOrderFactoryInstructionEditPolicy({
    session: guard.session,
    workOrder,
  });

  return NextResponse.json({ ok: true, instruction, editPolicy });
}

export async function PATCH(request: Request, context: RouteContext) {
  const guard = await requireWorkspaceApiGuard({
    permissionCode: MEMBER_PERMISSION_CODE.workorderUpdate,
  });
  if (!guard.ok) return guard.response;

  const { workOrderId } = await context.params;
  const workOrder = await getWorkOrderDetailByCompany(workOrderId, guard.scope);
  if (!workOrder) return createNotFoundResponse();

  const editPolicy = getWorkOrderFactoryInstructionEditPolicy({
    session: guard.session,
    workOrder,
  });
  if (!editPolicy.editable) {
    return createWorkOrderFactoryInstructionLockedResponse(editPolicy);
  }

  let body: Partial<WorkOrderFactoryInstructionPatch>;
  try {
    body = (await request.json()) as Partial<WorkOrderFactoryInstructionPatch>;
  } catch {
    return NextResponse.json(
      { ok: false, code: "INVALID_PAYLOAD", message: "요청 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  if (typeof body.content !== "string") {
    return NextResponse.json(
      { ok: false, code: "INVALID_CONTENT", message: "공장 전달사항 내용을 확인해주세요." },
      { status: 400 },
    );
  }

  if (body.content.length > FACTORY_INSTRUCTION_MAX_LENGTH) {
    return NextResponse.json(
      {
        ok: false,
        code: "CONTENT_TOO_LONG",
        message: `공장 전달사항은 ${FACTORY_INSTRUCTION_MAX_LENGTH.toLocaleString()}자까지 입력할 수 있습니다.`,
      },
      { status: 400 },
    );
  }

  const previous = await getWorkOrderFactoryInstruction(workOrderId, guard.scope);
  const instruction = await saveWorkOrderFactoryInstruction({
    workOrderId,
    companyId: guard.scope.companyId,
    content: normalizeWorkOrderFactoryInstructionContent(body.content),
    includeInFactoryPdf:
      typeof body.includeInFactoryPdf === "boolean"
        ? body.includeInFactoryPdf
        : previous.includeInFactoryPdf,
    updatedByUserId: guard.session.userId,
  });

  return NextResponse.json({ ok: true, instruction, editPolicy });
}
