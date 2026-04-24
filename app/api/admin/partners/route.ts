import { NextRequest, NextResponse } from "next/server";
import {
  buildPartnerDbCreateInput,
  buildPartnerDbUpdateInput,
  mapPartnerDbRecordsToAdminPartners,
} from "@/lib/admin/partnerMasterDbMapper";
import { createPartnerRepository } from "@/lib/partners/partnerAdapter";
import type { PartnerRepository, PartnerWritableRepository } from "@/lib/partners/partnerRepository";
import type { PartnerDraft } from "@/types/partner";

type PartnerMasterRequestBody = {
  partnerId?: string | null;
  draft?: PartnerDraft;
};

async function buildPartnerMasterResponse() {
  const repository = await createPartnerRepository();
  const partners = await repository.listPartners({ activeOnly: false });

  return {
    partners: mapPartnerDbRecordsToAdminPartners(partners),
    repository: repository.getRepositoryInfo(),
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

    await repository.createPartner(buildPartnerDbCreateInput(draft));

    return NextResponse.json(await buildPartnerMasterResponse());
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

    return NextResponse.json(await buildPartnerMasterResponse());
  } catch {
    return NextResponse.json({ partners: [], error: "PARTNER_MASTER_UPDATE_FAILED" }, { status: 500 });
  }
}
