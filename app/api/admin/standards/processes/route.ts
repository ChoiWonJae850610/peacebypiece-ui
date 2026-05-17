import { NextRequest, NextResponse } from "next/server";

import { buildOutsourcingProcessDbInputs, mapOutsourcingProcessRecordsToDefinitions } from "@/lib/admin/partner/dbMapper";
import { createAdminHistoryLogSafe } from "@/lib/admin/history/repository";
import { createPartnerRepository } from "@/lib/partners/partnerAdapter";
import { requireAdminSettingsCompanyScope } from "@/lib/admin/settings/sessionScope";
import { requireApiPermission } from "@/lib/permissions";
import type { OutsourcingProcessDefinition } from "@/lib/admin/partner/types";

function isProcessRequestBody(value: unknown): value is { processDefinitions?: OutsourcingProcessDefinition[] } {
  return typeof value === "object" && value !== null;
}

async function buildStandardProcessesResponse(companyId: string, companyName: string | null) {
  const repository = await createPartnerRepository({ companyId, companyName });
  const processRecords = repository.listOutsourcingProcesses
    ? await repository.listOutsourcingProcesses(false)
    : [];

  return {
    processDefinitions: mapOutsourcingProcessRecordsToDefinitions(processRecords),
  };
}

export async function GET(request: NextRequest) {
  const permissionDenied = requireApiPermission(request, {
    permissionCode: "standards.read",
    routeLabel: "admin.standards.processes.read",
  });
  if (permissionDenied) return permissionDenied;

  const scopeResult = await requireAdminSettingsCompanyScope();
  if (!scopeResult.ok) return scopeResult.response;

  try {
    return NextResponse.json(
      await buildStandardProcessesResponse(
        scopeResult.companyScope.companyId,
        scopeResult.companyScope.companyName,
      ),
    );
  } catch {
    return NextResponse.json(
      { processDefinitions: [], error: "ADMIN_STANDARD_PROCESSES_LIST_UNAVAILABLE" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const permissionDenied = requireApiPermission(request, {
    permissionCode: "standards.update",
    routeLabel: "admin.standards.processes.update",
  });
  if (permissionDenied) return permissionDenied;

  const scopeResult = await requireAdminSettingsCompanyScope();
  if (!scopeResult.ok) return scopeResult.response;

  try {
    const payload = (await request.json()) as unknown;
    if (!isProcessRequestBody(payload) || !Array.isArray(payload.processDefinitions)) {
      return NextResponse.json(
        { processDefinitions: [], error: "ADMIN_STANDARD_PROCESSES_PAYLOAD_REQUIRED" },
        { status: 400 },
      );
    }

    const repository = await createPartnerRepository({
      companyId: scopeResult.companyScope.companyId,
      companyName: scopeResult.companyScope.companyName,
    });

    if (!repository.replaceOutsourcingProcesses) {
      return NextResponse.json(
        { processDefinitions: [], error: "ADMIN_STANDARD_PROCESSES_WRITE_UNSUPPORTED" },
        { status: 400 },
      );
    }

    await repository.replaceOutsourcingProcesses(buildOutsourcingProcessDbInputs(payload.processDefinitions));
    await createAdminHistoryLogSafe({
      company_id: scopeResult.companyScope.companyId,
      user_id: scopeResult.companyScope.userId,
      action_type: "PARTNER_UPDATED",
      target_type: "partner_process",
      target_id: null,
      message: `외주 공정 유형 ${payload.processDefinitions.length}개 저장`,
      metadata: {
        action: "standards_processes",
        processCount: payload.processDefinitions.length,
      },
    });

    return NextResponse.json(
      await buildStandardProcessesResponse(
        scopeResult.companyScope.companyId,
        scopeResult.companyScope.companyName,
      ),
    );
  } catch {
    return NextResponse.json(
      { processDefinitions: [], error: "ADMIN_STANDARD_PROCESSES_SAVE_FAILED" },
      { status: 500 },
    );
  }
}
