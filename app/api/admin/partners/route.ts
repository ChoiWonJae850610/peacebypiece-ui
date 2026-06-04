import { NextRequest, NextResponse } from "next/server";
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
import { buildPartnerNamePhoneIdentity, normalizePartnerDraft } from "@/lib/admin/partner/draft";
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

function validatePartnerDraftForWrite(draft: PartnerDraft) {
  const normalized = normalizePartnerDraft(draft);
  if (!normalized.name) return "PARTNER_MASTER_NAME_REQUIRED";
  if (normalized.partnerTypes.length === 0) return "PARTNER_MASTER_TYPE_REQUIRED";
  if (!normalized.phone) return "PARTNER_MASTER_PHONE_REQUIRED";
  if (normalized.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) return "PARTNER_MASTER_EMAIL_INVALID";
  return null;
}

async function hasDuplicatePartnerNameAndPhoneOnServer(
  repository: PartnerRepository,
  draft: PartnerDraft,
  editingPartnerId: string | null = null,
) {
  const target = buildPartnerNamePhoneIdentity(draft);
  if (!target.name || !target.phone) return false;

  const partners = await repository.listPartners({ activeOnly: false });
  return partners.some((partner) => {
    if (editingPartnerId && partner.id === editingPartnerId) return false;
    const current = buildPartnerNamePhoneIdentity({ name: partner.name, phone: partner.contact ?? "" });
    return current.name === target.name && current.phone === target.phone;
  });
}

export async function GET() {
  const scopeResult = await requirePartnerCompanyScope("partner.read");
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
  const scopeResult = await requirePartnerCompanyScope("partner.create");
  if (!scopeResult.ok) return scopeResult.response;

  try {
    const repository = await createPartnerRepository(scopeResult.companyScope);
    const { draft } = await readRequestBody(request);

    if (!draft) {
      return NextResponse.json({ partners: [], error: "PARTNER_MASTER_DRAFT_REQUIRED" }, { status: 400 });
    }

    const validationError = validatePartnerDraftForWrite(draft);
    if (validationError) {
      return NextResponse.json({ partners: [], error: validationError }, { status: 400 });
    }

    if (!isWritablePartnerRepository(repository)) {
      return NextResponse.json({ partners: [], error: "PARTNER_MASTER_WRITE_UNSUPPORTED" }, { status: 400 });
    }

    if (await hasDuplicatePartnerNameAndPhoneOnServer(repository, draft)) {
      return NextResponse.json({ partners: [], error: "PARTNER_MASTER_DUPLICATE_NAME_PHONE" }, { status: 409 });
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
  const scopeResult = await requirePartnerCompanyScope("partner.update");
  if (!scopeResult.ok) return scopeResult.response;

  try {
    const repository = await createPartnerRepository(scopeResult.companyScope);
    const { partnerId, draft } = await readRequestBody(request);

    if (!partnerId || !draft) {
      return NextResponse.json({ partners: [], error: "PARTNER_MASTER_UPDATE_PAYLOAD_REQUIRED" }, { status: 400 });
    }

    const validationError = validatePartnerDraftForWrite(draft);
    if (validationError) {
      return NextResponse.json({ partners: [], error: validationError }, { status: 400 });
    }

    if (!isWritablePartnerRepository(repository)) {
      return NextResponse.json({ partners: [], error: "PARTNER_MASTER_WRITE_UNSUPPORTED" }, { status: 400 });
    }

    if (await hasDuplicatePartnerNameAndPhoneOnServer(repository, draft, partnerId)) {
      return NextResponse.json({ partners: [], error: "PARTNER_MASTER_DUPLICATE_NAME_PHONE" }, { status: 409 });
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
  const scopeResult = await requirePartnerCompanyScope("standards.manage");
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
