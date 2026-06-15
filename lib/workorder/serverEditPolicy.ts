import "server-only";

import { NextResponse } from "next/server";

import type { WaflSessionPayload } from "@/lib/auth/session";
import { isCompanyAdminSessionRole } from "@/lib/constants/sessionRoles";
import {
  WORKFLOW_STATE,
  isWorkflowStateBefore,
  type WorkflowStateValue,
} from "@/lib/constants/workorderStates";
import {
  createWorkspacePermissionRequiredResponse,
  hasWorkspaceApiPermission,
} from "@/lib/auth/apiRouteGuards";
import { MEMBER_PERMISSION_CODE } from "@/lib/permissions";
import type { WorkOrder } from "@/types/workorder";

const META_FIELDS = new Set<keyof WorkOrder>([
  "id",
  "lastSavedAt",
  "hasDetailSnapshot",
  "summaryAttachmentCount",
  "summaryMemoThreadCount",
]);

const INVENTORY_FIELDS = new Set<keyof WorkOrder>([
  "inventoryQuantity",
  "inventoryStatus",
]);

const MANAGER_FIELDS = new Set<keyof WorkOrder>([
  "manager",
  "managerId",
]);

function normalizeComparable(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function changedFields(
  previous: WorkOrder,
  next: WorkOrder,
): Array<keyof WorkOrder> {
  return (Object.keys(next) as Array<keyof WorkOrder>).filter(
    (field) =>
      !META_FIELDS.has(field) &&
      normalizeComparable(previous[field]) !== normalizeComparable(next[field]),
  );
}

function createLockedResponse(code: string, message: string): NextResponse {
  return NextResponse.json(
    { ok: false, code, message },
    { status: 409 },
  );
}

function canAdminEditCore(state: WorkflowStateValue): boolean {
  return isWorkflowStateBefore(state, WORKFLOW_STATE.materialOrderPending);
}

function canMemberEditCore(state: WorkflowStateValue): boolean {
  return state === WORKFLOW_STATE.draft || state === WORKFLOW_STATE.rejected;
}

export async function validateWorkOrderSavePolicy(input: {
  session: WaflSessionPayload;
  previous: WorkOrder;
  next: WorkOrder;
}): Promise<NextResponse | null> {
  const fields = changedFields(input.previous, input.next);
  const nonWorkflowFields = fields.filter((field) => field !== "workflowState");

  if (nonWorkflowFields.length === 0) return null;

  const isAdmin = isCompanyAdminSessionRole(input.session.role);
  const inventoryChanged = nonWorkflowFields.some((field) =>
    INVENTORY_FIELDS.has(field),
  );
  const managerChanged = nonWorkflowFields.some((field) =>
    MANAGER_FIELDS.has(field),
  );
  const coreChanged = nonWorkflowFields.some(
    (field) => !INVENTORY_FIELDS.has(field) && !MANAGER_FIELDS.has(field),
  );

  if (inventoryChanged && !isAdmin) {
    const canInspect = await hasWorkspaceApiPermission(
      input.session,
      MEMBER_PERMISSION_CODE.workorderStatusInspect,
    );
    if (!canInspect) {
      return createWorkspacePermissionRequiredResponse(
        MEMBER_PERMISSION_CODE.workorderStatusInspect,
      );
    }
  }

  if (managerChanged) {
    if (!isAdmin) {
      return createLockedResponse(
        "WORKORDER_MANAGER_ADMIN_ONLY",
        "담당자는 관리자만 변경할 수 있습니다.",
      );
    }
    if (!canAdminEditCore(input.previous.workflowState)) {
      return createLockedResponse(
        "WORKORDER_MANAGER_LOCKED_AFTER_ORDER_REQUEST",
        "발주요청 이후에는 담당자를 변경할 수 없습니다.",
      );
    }
  }

  if (coreChanged) {
    const editable = isAdmin
      ? canAdminEditCore(input.previous.workflowState)
      : canMemberEditCore(input.previous.workflowState);

    if (!editable) {
      return createLockedResponse(
        "WORKORDER_CORE_FIELDS_LOCKED",
        isAdmin
          ? "발주요청 이후에는 작업지시서 핵심정보를 변경할 수 없습니다."
          : "작성중 또는 반려 상태에서만 작업지시서 핵심정보를 변경할 수 있습니다.",
      );
    }

    if (!isAdmin) {
      const canUpdate = await hasWorkspaceApiPermission(
        input.session,
        MEMBER_PERMISSION_CODE.workorderUpdate,
      );
      if (!canUpdate) {
        return createWorkspacePermissionRequiredResponse(
          MEMBER_PERMISSION_CODE.workorderUpdate,
        );
      }
    }
  }

  return null;
}

export async function validateWorkOrderInventoryPatchPolicy(input: {
  session: WaflSessionPayload;
  inventoryTouched: boolean;
}): Promise<NextResponse | null> {
  if (!input.inventoryTouched) return null;
  if (isCompanyAdminSessionRole(input.session.role)) return null;

  const permitted = await hasWorkspaceApiPermission(
    input.session,
    MEMBER_PERMISSION_CODE.workorderStatusInspect,
  );
  return permitted
    ? null
    : createWorkspacePermissionRequiredResponse(
        MEMBER_PERMISSION_CODE.workorderStatusInspect,
      );
}
