import { NextResponse } from "next/server";

import { requireAdminMemberCompanyScope } from "./sessionScope";
import { createSystemAuditLogSafe } from "@/lib/system/audit/repository";
import { buildMemberPermissionUpdatedAuditLog } from "@/lib/system/audit/writeActions";
import {
  isMemberPermissionCode,
  type MemberPermissionCode,
} from "@/lib/permissions";
import { adminMemberRepository } from "./memberRepository";

interface UpdateMemberPermissionsBody {
  actorUserId?: string | null;
  updatedByUserId?: string | null;
  permissionCodes?: string[] | null;
}

function getRequestId(request: Request): string | null {
  return (
    request.headers.get("x-request-id") ||
    request.headers.get("x-vercel-id") ||
    null
  );
}

function getRequestIpAddress(request: Request): string | null {
  const forwardedFor = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || null;
}

function toErrorResponse(error: unknown) {
  const message =
    error instanceof Error ? error.message : "UNKNOWN_MEMBER_MANAGEMENT_ERROR";
  const status =
    message === "COMPANY_MEMBER_NOT_FOUND"
      ? 404
      : message === "ADMIN_MEMBER_COMPANY_SESSION_REQUIRED"
        ? 401
        : message === "COMPANY_MEMBER_NOT_APPROVED" ||
          message === "SELF_PERMISSION_UPDATE_REMOVAL_BLOCKED"
        ? 409
        : message.endsWith("_REQUIRED")
          ? 400
          : 500;

  return NextResponse.json({ ok: false, error: message }, { status });
}

function normalizePermissionCodes(
  values: string[] | null | undefined,
): readonly MemberPermissionCode[] {
  if (!values) return [];
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value): value is MemberPermissionCode =>
          isMemberPermissionCode(value),
        ),
    ),
  );
}

function readActorUserId(body: UpdateMemberPermissionsBody): string | null {
  return body.actorUserId?.trim() || body.updatedByUserId?.trim() || null;
}

export async function handleListAdminMembers(request: Request) {
  try {
    const url = new URL(request.url);
    const scope = await requireAdminMemberCompanyScope();
    if (!scope.ok) return scope.response;

    const companyId = scope.companyScope.companyId;
    const status = url.searchParams.get("status")?.trim() || "approved";
    const limit = Number(url.searchParams.get("limit") ?? "50");
    const result = await adminMemberRepository.listCompanyMembers({
      companyId,
      status:
        status === "all"
          ? "all"
          : status === "suspended"
            ? "suspended"
            : "approved",
      limit,
    });

    return NextResponse.json({
      ok: true,
      members: result.members,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handleUpdateAdminMemberPermissions(
  companyMemberId: string,
  request: Request,
) {
  try {
    const body = (await request
      .json()
      .catch(() => ({}))) as UpdateMemberPermissionsBody;
    const scope = await requireAdminMemberCompanyScope();
    if (!scope.ok) return scope.response;

    const updatedByUserId = readActorUserId(body) ?? scope.companyScope.userId;
    const result = await adminMemberRepository.updateCompanyMemberPermissions({
      companyId: scope.companyScope.companyId,
      companyMemberId,
      updatedByUserId,
      permissionCodes: normalizePermissionCodes(body.permissionCodes),
    });

    await createSystemAuditLogSafe(
      buildMemberPermissionUpdatedAuditLog({
        companyMemberId: result.member.id,
        companyId: result.member.companyId,
        userId: result.member.userId,
        memberEmail: result.member.email,
        memberName: result.member.name,
        previousPermissionCodes: [...result.previousPermissionCodes],
        nextPermissionCodes: [...result.nextPermissionCodes],
        updatedBy: updatedByUserId,
        requestId: getRequestId(request),
        ipAddress: getRequestIpAddress(request),
      }),
    );

    return NextResponse.json({
      ok: true,
      member: result.member,
      previousPermissionCodes: result.previousPermissionCodes,
      nextPermissionCodes: result.nextPermissionCodes,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
