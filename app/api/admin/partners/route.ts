import { NextRequest, NextResponse } from "next/server";
import {
  buildOutsourcingProcessDbInputs,
  buildPartnerDbCreateInput,
  buildPartnerDbUpdateInput,
  buildPartnerRoleItemsFromDraft,
  mapOutsourcingProcessRecordsToDefinitions,
  mapPartnerDbRecordsToAdminPartners,
} from "@/lib/admin/partnerMasterDbMapper";
import { createDefaultOutsourcingProcessDefinitions } from "@/lib/admin/partnerMaster.processes";
import { createPartnerRepository } from "@/lib/partners/partnerAdapter";
import type { OutsourcingProcessDefinition } from "@/lib/admin/partnerMaster.types";
import type { PartnerRepository, PartnerWritableRepository } from "@/lib/partners/partnerRepository";
import type { PartnerDraft } from "@/types/partner";

type PartnerMasterRequestBody = {
  partnerId?: string | null;
  draft?: PartnerDraft;
  processDefinitions?: OutsourcingProcessDefinition[];
};

async function buildPartnerMasterResponse(repository?: PartnerRepository) {
  const targetRepository = repository ?? (await createPartnerRepository());
  const partners = await targetRepository.listPartners({ activeOnly: false });
  const partnerItems = await targetRepository.listPartnerItems({ activeOnly: false });
  const processRecords = targetRepository.listOutsourcingProcesses
    ? await targetRepository.listOutsourcingProcesses(false)
    : [];
  const processDefinitions = processRecords.length > 0
    ? mapOutsourcingProcessRecordsToDefinitions(processRecords)
    : createDefaultOutsourcingProcessDefinitions();

  return {
    partners: mapPartnerDbRecordsToAdminPartners(partners, partnerItems),
    processDefinitions,
    repository: targetRepository.getRepositoryInfo(),
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
  try {
    return NextResponse.json(await buildPartnerMasterResponse());
  } catch {
    return NextResponse.json(
      {
        partners: [],
        processDefinitions: createDefaultOutsourcingProcessDefinitions(),
        error: "PARTNER_MASTER_LIST_UNAVAILABLE",
      },
      { status: 200 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const repository = await createPartnerRepository();
    const { draft } = await readRequestBody(request);

    if (!draft) {
      return NextResponse.json({ partners: [], error: "PARTNER_MASTER_DRAFT_REQUIRED" }, { status: 400 });
    }

    if (!isWritablePartnerRepository(repository)) {
      return NextResponse.json({ partners: [], error: "PARTNER_MASTER_WRITE_UNSUPPORTED" }, { status: 400 });
    }

    const created = await repository.createPartner(buildPartnerDbCreateInput(draft));
    if (repository.replacePartnerRoleItems) {
      await repository.replacePartnerRoleItems(created.id, buildPartnerRoleItemsFromDraft(draft));
    }

    return NextResponse.json(await buildPartnerMasterResponse(repository));
  } catch {
    return NextResponse.json({ partners: [], error: "PARTNER_MASTER_CREATE_FAILED" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const repository = await createPartnerRepository();
    const { partnerId, draft } = await readRequestBody(request);

    if (!partnerId || !draft) {
      return NextResponse.json({ partners: [], error: "PARTNER_MASTER_UPDATE_PAYLOAD_REQUIRED" }, { status: 400 });
    }

    if (!isWritablePartnerRepository(repository)) {
      return NextResponse.json({ partners: [], error: "PARTNER_MASTER_WRITE_UNSUPPORTED" }, { status: 400 });
    }

    await repository.updatePartner(partnerId, buildPartnerDbUpdateInput(draft));
    if (repository.replacePartnerRoleItems) {
      await repository.replacePartnerRoleItems(partnerId, buildPartnerRoleItemsFromDraft(draft));
    }

    return NextResponse.json(await buildPartnerMasterResponse(repository));
  } catch {
    return NextResponse.json({ partners: [], error: "PARTNER_MASTER_UPDATE_FAILED" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const repository = await createPartnerRepository();
    const { processDefinitions } = await readRequestBody(request);

    if (!Array.isArray(processDefinitions)) {
      return NextResponse.json({ partners: [], error: "PARTNER_MASTER_PROCESS_PAYLOAD_REQUIRED" }, { status: 400 });
    }

    if (!isWritablePartnerRepository(repository) || !repository.replaceOutsourcingProcesses) {
      return NextResponse.json({ partners: [], error: "PARTNER_MASTER_PROCESS_WRITE_UNSUPPORTED" }, { status: 400 });
    }

    await repository.replaceOutsourcingProcesses(buildOutsourcingProcessDbInputs(processDefinitions));

    return NextResponse.json(await buildPartnerMasterResponse(repository));
  } catch {
    return NextResponse.json({ partners: [], error: "PARTNER_MASTER_PROCESS_UPDATE_FAILED" }, { status: 500 });
  }
}
