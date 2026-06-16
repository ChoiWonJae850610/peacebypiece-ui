import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import {
  createWaflApiError,
  createWaflApiSuccess,
  createWaflUnhandledApiError,
  readWaflJsonBody,
} from "@/lib/api/waflApiServer";
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
  return createWaflApiError(
    "작업지시서를 찾을 수 없습니다.",
    "WORKORDER_NOT_FOUND",
    404,
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const guard = await requireWorkspaceApiGuard({
    permissionCode: MEMBER_PERMISSION_CODE.workorderRead,
  });
  if (!guard.ok) return guard.response;

  try {
    const { workOrderId } = await context.params;
    const workOrder = await getWorkOrderDetailByCompany(workOrderId, guard.scope);
    if (!workOrder) return createNotFoundResponse();

    const instruction = await getWorkOrderFactoryInstruction(workOrderId, guard.scope);
    const editPolicy = getWorkOrderFactoryInstructionEditPolicy({
      session: guard.session,
      workOrder,
    });

    return createWaflApiSuccess({ instruction, editPolicy });
  } catch (error) {
    return createWaflUnhandledApiError(
      error,
      "공장 전달사항을 불러오지 못했습니다.",
      "FACTORY_INSTRUCTION_READ_FAILED",
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const guard = await requireWorkspaceApiGuard({
    permissionCode: MEMBER_PERMISSION_CODE.workorderUpdate,
  });
  if (!guard.ok) return guard.response;

  try {
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

    const bodyResult = await readWaflJsonBody<Partial<WorkOrderFactoryInstructionPatch>>(request);
    if (!bodyResult.ok) return bodyResult.response;
    const body = bodyResult.data;

    if (typeof body.content !== "string") {
      return createWaflApiError(
        "공장 전달사항 내용을 확인해주세요.",
        "INVALID_CONTENT",
        400,
      );
    }

    if (body.content.length > FACTORY_INSTRUCTION_MAX_LENGTH) {
      return createWaflApiError(
        `공장 전달사항은 ${FACTORY_INSTRUCTION_MAX_LENGTH.toLocaleString()}자까지 입력할 수 있습니다.`,
        "CONTENT_TOO_LONG",
        400,
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

    return createWaflApiSuccess({ instruction, editPolicy });
  } catch (error) {
    return createWaflUnhandledApiError(
      error,
      "공장 전달사항을 저장하지 못했습니다.",
      "FACTORY_INSTRUCTION_SAVE_FAILED",
    );
  }
}
