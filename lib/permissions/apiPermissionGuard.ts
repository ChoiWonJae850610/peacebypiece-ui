import { NextResponse } from "next/server";

import { getMemberRoleTemplatePermissions, hasMemberPermission, isMemberPermissionCode } from "./permissionAccess";
import type { MemberPermissionCode, MemberPermissionRoleTemplateCode } from "./memberPermissionMatrix";

export type ApiPermissionGuardMode = "preview" | "enforce";

export type ApiPermissionGuardOptions = {
  permissionCode: MemberPermissionCode;
  routeLabel: string;
  mode?: ApiPermissionGuardMode;
};

export type ApiPermissionContext = {
  permissionCodes: readonly MemberPermissionCode[];
  source: "company-admin-preview" | "request-header-preview";
};

const PREVIEW_ROLE_TEMPLATE: MemberPermissionRoleTemplateCode = "company_admin";

function readHeaderPermissionCodes(request: Request): readonly MemberPermissionCode[] {
  const rawHeader = request.headers.get("x-peacebypiece-permissions") ?? "";
  if (!rawHeader.trim()) return [];

  return Array.from(
    new Set(
      rawHeader
        .split(",")
        .map((item) => item.trim())
        .filter((item): item is MemberPermissionCode => isMemberPermissionCode(item)),
    ),
  );
}

export function resolveApiPermissionContext(request: Request): ApiPermissionContext {
  const headerPermissionCodes = readHeaderPermissionCodes(request);
  if (headerPermissionCodes.length > 0) {
    return {
      permissionCodes: headerPermissionCodes,
      source: "request-header-preview",
    };
  }

  return {
    permissionCodes: getMemberRoleTemplatePermissions(PREVIEW_ROLE_TEMPLATE),
    source: "company-admin-preview",
  };
}

export function requireApiPermission(request: Request, options: ApiPermissionGuardOptions): NextResponse | null {
  const mode = options.mode ?? "enforce";
  const context = resolveApiPermissionContext(request);
  const allowed = hasMemberPermission(context, options.permissionCode);

  if (allowed) return null;

  return NextResponse.json(
    {
      ok: false,
      error: "API_PERMISSION_REQUIRED",
      permissionCode: options.permissionCode,
      routeLabel: options.routeLabel,
      permissionSource: context.source,
      mode,
    },
    { status: 403 },
  );
}
