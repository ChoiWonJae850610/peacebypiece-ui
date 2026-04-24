import { NextResponse } from "next/server";
import { createPartnerRepository } from "@/lib/partners/partnerAdapter";

export async function GET() {
  try {
    const repository = await createPartnerRepository();
    const partners = await repository.listPartners({ type: "factory", activeOnly: true });

    return NextResponse.json({
      partners: partners.map((partner) => ({
        id: partner.id,
        name: partner.name,
        type: partner.type,
        is_active: partner.is_active,
      })),
      repository: repository.getRepositoryInfo(),
    });
  } catch {
    return NextResponse.json(
      {
        partners: [],
        error: "PARTNER_REPOSITORY_UNAVAILABLE",
      },
      { status: 200 },
    );
  }
}
