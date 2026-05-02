import { NextResponse } from "next/server";

import {
  storageUsageRepository,
  type CreateStorageUsageSnapshotInput,
} from "../storageUsageRepository";

function getCompanyIdFromRequest(request: Request): string | null {
  const url = new URL(request.url);
  return url.searchParams.get("companyId");
}

function toErrorResponse(error: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: "STORAGE_USAGE_ROUTE_ERROR",
      message:
        error instanceof Error
          ? error.message
          : "Unknown storage usage route error",
    },
    { status: 500 },
  );
}

function toCompanyIdRequiredResponse() {
  return NextResponse.json(
    {
      ok: false,
      error: "COMPANY_ID_REQUIRED",
    },
    { status: 400 },
  );
}

export async function handleGetStorageUsage(request: Request) {
  try {
    const companyId = getCompanyIdFromRequest(request);

    if (!companyId) {
      return toCompanyIdRequiredResponse();
    }

    const summary = await storageUsageRepository.getStorageUsageSummary(companyId);

    return NextResponse.json({
      ok: true,
      summary,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handleCreateStorageUsageSnapshot(request: Request) {
  try {
    const input = (await request.json()) as CreateStorageUsageSnapshotInput;

    if (!input.companyId) {
      return toCompanyIdRequiredResponse();
    }

    const snapshot =
      await storageUsageRepository.createStorageUsageSnapshot(input);

    return NextResponse.json(
      {
        ok: true,
        snapshot,
      },
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
