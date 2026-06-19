import { NextResponse } from "next/server";

import { requireAdminStatsCompanyScope } from "@/lib/admin/stats/sessionScope";

import { statsRepository } from "../statsRepository";
import { getSystemDashboardStats } from "@/lib/system/systemDashboardStats";
import type { StatsPeriod } from "../statsTypes";

function toPeriod(request: Request): StatsPeriod | undefined {
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!from || !to) {
    return undefined;
  }

  return { from, to };
}

function toErrorResponse(error: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: "STATS_ROUTE_ERROR",
      message: error instanceof Error ? error.message : "Unknown stats route error",
    },
    { status: 500 },
  );
}

export async function handleGetAdminStats(request: Request) {
  try {
    const scopeResult = await requireAdminStatsCompanyScope();

    if (!scopeResult.ok) {
      return scopeResult.response;
    }

    const summary = await statsRepository.getAdminStats({
      companyId: scopeResult.companyScope.companyId,
      period: toPeriod(request),
    });

    return NextResponse.json({
      ok: true,
      summary,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handleGetSystemStats(request: Request) {
  try {
    const [summary, dashboard] = await Promise.all([
      statsRepository.getSystemStats({ period: toPeriod(request) }),
      getSystemDashboardStats(),
    ]);

    return NextResponse.json({
      ok: true,
      summary,
      dashboard,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
