import { getDatabaseRuntimeErrorCode } from "@/lib/db/client";

import { companyRepository } from "../companyRepository";

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
          : "Unknown company route handler error",
    },
    { status: runtimeCode === "DB_NOT_CONFIGURED" ? 503 : 500 },
  );
}

export async function handleListSystemCompanies(request: Request) {
  try {
    const url = new URL(request.url);
    const companyId = url.searchParams.get("companyId");

    if (companyId) {
      const detail = await companyRepository.getCompanyDetail(companyId);

      if (!detail) {
        return toJsonResponse(
          {
            ok: false,
            error: "COMPANY_NOT_FOUND",
          },
          { status: 404 },
        );
      }

      return toJsonResponse({
        ok: true,
        detail,
      });
    }

    const companies = await companyRepository.listCompanies();

    return toJsonResponse({
      ok: true,
      companies,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
