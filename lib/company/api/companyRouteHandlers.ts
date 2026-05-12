import { NextResponse } from "next/server";

import {
  CompanyRepositoryNotConnectedError,
  companyRepository,
} from "../companyRepository";
import type { CreateCompanyInput, ListCompaniesQuery } from "../companyTypes";
import { initializeCompanyStandards } from "@/lib/system/standards/companyStandardsInitializationRepository";
import { createSystemAuditLogSafe } from "@/lib/system/audit/repository";
import { buildCompanyCreatedAuditLog } from "@/lib/system/audit/writeActions";

function getRequestId(request: Request): string | null {
  return request.headers.get("x-request-id") || request.headers.get("x-vercel-id") || null;
}

function getRequestIpAddress(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || null;
}

function toBooleanParam(value: string | null): boolean | undefined {
  if (value === null) {
    return undefined;
  }

  return value === "true" || value === "1";
}

function toListCompaniesQuery(request: Request): ListCompaniesQuery {
  const url = new URL(request.url);

  return {
    keyword: url.searchParams.get("keyword") ?? undefined,
    includeInactive: toBooleanParam(url.searchParams.get("includeInactive")),
  };
}

function toErrorResponse(error: unknown) {
  if (error instanceof CompanyRepositoryNotConnectedError) {
    return NextResponse.json(
      {
        ok: false,
        error: "COMPANY_REPOSITORY_NOT_CONNECTED",
        message: error.message,
      },
      { status: 501 },
    );
  }

  return NextResponse.json(
    {
      ok: false,
      error: "COMPANY_ROUTE_ERROR",
      message: error instanceof Error ? error.message : "Unknown company route error",
    },
    { status: 500 },
  );
}

export async function handleListCompanies(request: Request) {
  try {
    const companies = await companyRepository.listCompanies(
      toListCompaniesQuery(request),
    );

    return NextResponse.json({
      ok: true,
      companies,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handleCreateCompany(request: Request) {
  try {
    const input = (await request.json()) as CreateCompanyInput;
    const company = await companyRepository.createCompany(input);
    const standardsInitialization = await initializeCompanyStandards({
      companyId: company.id,
    });

    await createSystemAuditLogSafe(
      buildCompanyCreatedAuditLog({
        companyId: company.id,
        companyName: company.name,
        storageLimitBytes: company.storageLimitBytes ?? null,
        requestId: getRequestId(request),
        ipAddress: getRequestIpAddress(request),
      }),
    );

    return NextResponse.json(
      {
        ok: true,
        company,
        standardsInitialization,
      },
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
