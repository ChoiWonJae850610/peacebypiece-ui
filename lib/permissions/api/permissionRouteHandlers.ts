import { getDatabaseRuntimeErrorCode } from "@/lib/db/client";

import {
  getCompanyUserPermissionMap,
  listPermissionCatalog,
  listRolePermissionMaps,
} from "../permissionRepository";

function toJsonResponse(body: unknown, init?: ResponseInit) {
  return Response.json(body, init);
}

function toErrorResponse(error: unknown) {
  const runtimeCode = getDatabaseRuntimeErrorCode(error);

  return toJsonResponse(
    {
      ok: false,
      error: runtimeCode,
      message:
        error instanceof Error
          ? error.message
          : "Unknown permission route handler error",
    },
    { status: runtimeCode === "DB_NOT_CONFIGURED" ? 503 : 500 },
  );
}

export async function handleListPermissions(request: Request) {
  try {
    const url = new URL(request.url);
    const companyUserId = url.searchParams.get("companyUserId");

    if (companyUserId) {
      const permissionMap = await getCompanyUserPermissionMap(companyUserId);

      if (!permissionMap) {
        return toJsonResponse(
          {
            ok: false,
            error: "COMPANY_USER_NOT_FOUND",
          },
          { status: 404 },
        );
      }

      return toJsonResponse({
        ok: true,
        permissionMap,
      });
    }

    const [catalog, rolePermissions] = await Promise.all([
      listPermissionCatalog(),
      listRolePermissionMaps(),
    ]);

    return toJsonResponse({
      ok: true,
      catalog,
      rolePermissions,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
