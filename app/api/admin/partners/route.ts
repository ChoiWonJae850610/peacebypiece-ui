import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/permissions";
import {
  buildOutsourcingProcessDbInputs,
  buildPartnerDbCreateInput,
  buildPartnerDbUpdateInput,
  buildPartnerRoleItemsFromDraft,
  mapOutsourcingProcessRecordsToDefinitions,
  mapPartnerDbRecordsToAdminPartners,
} from "@/lib/admin/partner/dbMapper";
import { createAdminHistoryLogSafe } from "@/lib/admin/history/repository";
import { createPartnerRepository } from "@/lib/partners/partnerAdapter";
import type { OutsourcingProcessDefinition } from "@/lib/admin/partner/types";
import type { PartnerCompanyScope } from "@/lib/partners/types";
import { requirePartnerCompanyScope } from "@/lib/partners/sessionScope";
import type { PartnerRepository, PartnerWritableRepository } from "@/lib/partners/partnerRepository";
import type { PartnerDraft } from "@/types/partner";

type PartnerMasterRequestBody = {
  partnerId?: string | null;
  draft?: PartnerDraft;
  processDefinitions?: OutsourcingProcessDefinition[];
};

async function writePartnerHistory(input: {
  companyScope: PartnerCompanyScope;
  userId: string;
  action: "created" | "updated" | "processes";
  partnerId?: string | null;
  partnerName?: string | null;
  processCount?: number;
}): Promise<void> {
  await createAdminHistoryLogSafe({
    company_id: input.companyScope.companyId,
    user_id: input.userId,
    action_type: "PARTNER_UPDATED",
    target_type: "partner",
    target_id: input.partnerId ?? null,
    message:
      input.action === "processes"
        ? `외주 공정 유형 ${input.processCount ?? 0}개 저장`
        : `${input.partnerName || "협력업체"} ${input.action === "created" ? "등록" : "수정"}`,
    metadata: {
      action: input.action,
      partnerId: input.partnerId ?? null,
      processCount: input.processCount ?? null,
    },
  });
}

async function buildPartnerMasterResponse(repository: PartnerRepository) {
  const partners = await repository.listPartners({ activeOnly: false });
  const partnerItems = await repository.listPartnerItems({ activeOnly: false });
  const processRecords = repository.listOutsourcingProcesses
    ? await repository.listOutsourcingProcesses(false)
    : [];
  const repositoryInfo = repository.getRepositoryInfo();
  const processDefinitions =
    processRecords.length > 0
      ? mapOutsourcingProcessRecordsToDefinitions(processRecords)
      : [];

  return {
    partners: mapPartnerDbRecordsToAdminPartners(partners, partnerItems),
    processDefinitions,
    repository: repositoryInfo,
  };
}

function isRequestBody(value: unknown): value is PartnerMasterRequestBody {
  return typeof value === "object" && value !== null;
}

async function readRequestBody(request: NextRequest): Promise<PartnerMasterRequestBody> {
  const payload = (await request.json()) as unknown;
  return isRequestBody(payload) ? payload : {};
}

function isWritablePartnerRepository(repository: PartnerRepository): repository is PartnerWritableRepository {
  return "createPartner" in repository && "updatePartner" in repository;
}

export async function GET() {
  const scopeResult = await requirePartnerCompanyScope();
  if (!scopeResult.ok) return scopeResult.response;

  try {
    const repository = await createPartnerRepository(scopeResult.companyScope);
    return NextResponse.json(await buildPartnerMasterResponse(repository));
  } catch {
    return NextResponse.json(
      {
        partners: [],
        processDefinitions: [],
        error: "PARTNER_MASTER_LIST_UNAVAILABLE",
      },
      { status: 200 },
    );
  }
}

export async function POST(request: NextRequest) {
  const permissionDenied = requireApiPermission(request, {
    permissionCode: "partner.manage",
    routeLabel: "admin.partners.create",
  });
  if (permissionDenied) return permissionDenied;

  const scopeResult = await requirePartnerCompanyScope();
  if (!scopeResult.ok) return scopeResult.response;

  try {
    const repository = await createPartnerRepository(scopeResult.companyScope);
    const { draft } = await readRequestBody(request);

    if (!draft) {
      return NextResponse.json({ partners: [], error: "PARTNER_MASTER_DRAFT_REQUIRED" }, { status: 400 });
    }

    if (!isWritablePartnerRepository(repository)) {
      return NextResponse.json({ partners: [], error: "PARTNER_MASTER_WRITE_UNSUPPORTED" }, { status: 400 });
    }

    const created = await repository.createPartner(buildPartnerDbCreateInput(draft));
    await writePartnerHistory({
      companyScope: scopeResult.companyScope,
      userId: scopeResult.userId,
      action: "created",
      partnerId: created.id,
      partnerName: draft.name,
    });
    if (repository.replacePartnerRoleItems) {
      await repository.replacePartnerRoleItems(created.id, buildPartnerRoleItemsFromDraft(draft));
    }

    return NextResponse.json(await buildPartnerMasterResponse(repository));
  } catch {
    return NextResponse.json({ partners: [], error: "PARTNER_MASTER_CREATE_FAILED" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const permissionDenied = requireApiPermission(request, {
    permissionCode: "partner.manage",
    routeLabel: "admin.partners.update",
  });
  if (permissionDenied) return permissionDenied;

  const scopeResult = await requirePartnerCompanyScope();
  if (!scopeResult.ok) return scopeResult.response;

  try {
    const repository = await createPartnerRepository(scopeResult.companyScope);
    const { partnerId, draft } = await readRequestBody(request);

    if (!partnerId || !draft) {
      return NextResponse.json({ partners: [], error: "PARTNER_MASTER_UPDATE_PAYLOAD_REQUIRED" }, { status: 400 });
    }

    if (!isWritablePartnerRepository(repository)) {
      return NextResponse.json({ partners: [], error: "PARTNER_MASTER_WRITE_UNSUPPORTED" }, { status: 400 });
    }

    await repository.updatePartner(partnerId, buildPartnerDbUpdateInput(draft));
    await writePartnerHistory({
      companyScope: scopeResult.companyScope,
      userId: scopeResult.userId,
      action: "updated",
      partnerId,
      partnerName: draft.name,
    });
    if (repository.replacePartnerRoleItems) {
      await repository.replacePartnerRoleItems(partnerId, buildPartnerRoleItemsFromDraft(draft));
    }

    return NextResponse.json(await buildPartnerMasterResponse(repository));
  } catch {
    return NextResponse.json({ partners: [], error: "PARTNER_MASTER_UPDATE_FAILED" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const permissionDenied = requireApiPermission(request, {
    permissionCode: "partner.manage",
    routeLabel: "admin.partners.processes.update",
  });
  if (permissionDenied) return permissionDenied;

  const scopeResult = await requirePartnerCompanyScope();
  if (!scopeResult.ok) return scopeResult.response;

  try {
    const repository = await createPartnerRepository(scopeResult.companyScope);
    const { processDefinitions } = await readRequestBody(request);

    if (!Array.isArray(processDefinitions)) {
      return NextResponse.json({ partners: [], error: "PARTNER_MASTER_PROCESS_PAYLOAD_REQUIRED" }, { status: 400 });
    }

    if (!isWritablePartnerRepository(repository) || !repository.replaceOutsourcingProcesses) {
      return NextResponse.json({ partners: [], error: "PARTNER_MASTER_PROCESS_WRITE_UNSUPPORTED" }, { status: 400 });
    }

    await repository.replaceOutsourcingProcesses(buildOutsourcingProcessDbInputs(processDefinitions));
    await writePartnerHistory({
      companyScope: scopeResult.companyScope,
      userId: scopeResult.userId,
      action: "processes",
      processCount: processDefinitions.length,
    });

    return NextResponse.json(await buildPartnerMasterResponse(repository));
  } catch {
    return NextResponse.json({ partners: [], error: "PARTNER_MASTER_PROCESS_UPDATE_FAILED" }, { status: 500 });
  }
}
