import { NextResponse } from "next/server";

import {
  CompanyRepositoryNotConnectedError,
  companyRepository,
} from "../companyRepository";
import type { CreateCompanyInput, ListCompaniesQuery } from "../companyTypes";
import { initializeCompanyStandards } from "@/lib/system/standards/companyStandardsInitializationRepository";

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
