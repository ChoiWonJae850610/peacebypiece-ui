import { getDatabaseRuntimeErrorCode } from "@/lib/db/client";

import { getSystemBillingOverview } from "../systemBillingRepository";

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
          : "Unknown billing route handler error",
    },
    { status: runtimeCode === "DB_NOT_CONFIGURED" ? 503 : 500 },
  );
}

export async function handleGetSystemBillingOverview() {
  try {
    const overview = await getSystemBillingOverview();

    return toJsonResponse({
      ok: true,
      overview,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
