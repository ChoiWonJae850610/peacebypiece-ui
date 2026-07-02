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
  getWorkOrderSizeSpec,
  saveWorkOrderSizeSpec,
} from "@/lib/workorder/sizeSpec/repository";
import {
  isWorkOrderSizeSpecUnit,
  type WorkOrderSizeSpecPatch,
} from "@/lib/workorder/sizeSpec/types";
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

function normalizePatch(value: Partial<WorkOrderSizeSpecPatch>): WorkOrderSizeSpecPatch {
  const patch: WorkOrderSizeSpecPatch = {};
  if (Object.prototype.hasOwnProperty.call(value, "sizeSetCode")) {
    patch.sizeSetCode = typeof value.sizeSetCode === "string" ? value.sizeSetCode.trim() : null;
  }
  if (Object.prototype.hasOwnProperty.call(value, "measurementUnit")) {
    if (!isWorkOrderSizeSpecUnit(value.measurementUnit)) {
      throw new Error("INVALID_MEASUREMENT_UNIT");
    }
    patch.measurementUnit = value.measurementUnit;
  }
  if (Array.isArray(value.values)) {
    patch.values = value.values.map((item) => ({
      sizeCode: String(item?.sizeCode ?? "").trim(),
      pomCode: String(item?.pomCode ?? "").trim(),
      displayValue: String(item?.displayValue ?? "").trim(),
    }));
  }
  return patch;
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

    const spec = await getWorkOrderSizeSpec({ workOrder, scope: guard.scope });
    const editPolicy = getWorkOrderFactoryInstructionEditPolicy({
      session: guard.session,
      workOrder,
    });

    return createWaflApiSuccess({ spec, editPolicy });
  } catch (error) {
    return createWaflUnhandledApiError(
      error,
      "치수표를 불러오지 못했습니다.",
      "WORKORDER_SIZE_SPEC_READ_FAILED",
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

    const bodyResult = await readWaflJsonBody<Partial<WorkOrderSizeSpecPatch>>(request);
    if (!bodyResult.ok) return bodyResult.response;

    const spec = await saveWorkOrderSizeSpec({
      workOrder,
      scope: guard.scope,
      patch: normalizePatch(bodyResult.data),
      updatedByUserId: guard.session.userId,
    });

    return createWaflApiSuccess({ spec, editPolicy });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "INVALID_MEASUREMENT_UNIT") {
      return createWaflApiError("cm 또는 inch 단위만 사용할 수 있습니다.", "INVALID_MEASUREMENT_UNIT", 400);
    }
    if (message === "INVALID_CM_MEASUREMENT" || message === "INVALID_INCH_MEASUREMENT") {
      return createWaflApiError("치수 값 형식을 확인해 주세요.", message, 400);
    }
    if (message === "WORKORDER_SIZE_SET_NOT_FOUND") {
      return createWaflApiError("사용 가능한 사이즈 세트를 찾을 수 없습니다.", "WORKORDER_SIZE_SET_NOT_FOUND", 400);
    }

    return createWaflUnhandledApiError(
      error,
      "치수표를 저장하지 못했습니다.",
      "WORKORDER_SIZE_SPEC_SAVE_FAILED",
    );
  }
}
