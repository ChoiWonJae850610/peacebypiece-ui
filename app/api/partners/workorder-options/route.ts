import { NextResponse } from "next/server";
import { createPartnerRepository } from "@/lib/partners/partnerAdapter";
import type { PartnerDbRecord, PartnerItemWithRelations } from "@/lib/partners/types";

type WorkOrderPartnerOptions = {
  factoryOptions: string[];
  materialVendorOptions: {
    fabric: string[];
    subsidiary: string[];
  };
  outsourcingVendorOptions: string[];
  partnerItemOptions: {
    labor: string[];
    fabric: string[];
    subsidiary: string[];
    outsourcing: string[];
  };
};

const EMPTY_OPTIONS: WorkOrderPartnerOptions = {
  factoryOptions: [],
  materialVendorOptions: {
    fabric: [],
    subsidiary: [],
  },
  outsourcingVendorOptions: [],
  partnerItemOptions: {
    labor: [],
    fabric: [],
    subsidiary: [],
    outsourcing: [],
  },
};

function appendUnique(options: string[], value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  if (!normalized || options.includes(normalized)) return options;
  return [...options, normalized];
}

function buildPartnerOptions(partners: PartnerDbRecord[], partnerItems: PartnerItemWithRelations[]): WorkOrderPartnerOptions {
  const options: WorkOrderPartnerOptions = {
    factoryOptions: [],
    materialVendorOptions: {
      fabric: [],
      subsidiary: [],
    },
    outsourcingVendorOptions: [],
    partnerItemOptions: {
      labor: [],
      fabric: [],
      subsidiary: [],
      outsourcing: [],
    },
  };

  for (const partner of partners) {
    if (!partner.is_active) continue;

    if (partner.type === "factory") {
      options.factoryOptions = appendUnique(options.factoryOptions, partner.name);
    }
    if (partner.type === "fabric") {
      options.materialVendorOptions.fabric = appendUnique(options.materialVendorOptions.fabric, partner.name);
    }
    if (partner.type === "subsidiary") {
      options.materialVendorOptions.subsidiary = appendUnique(options.materialVendorOptions.subsidiary, partner.name);
    }
    if (partner.type === "outsourcing") {
      options.outsourcingVendorOptions = appendUnique(options.outsourcingVendorOptions, partner.name);
    }
  }

  for (const item of partnerItems) {
    if (!item.is_active) continue;
    options.partnerItemOptions[item.category] = appendUnique(options.partnerItemOptions[item.category], item.name);
  }

  return options;
}

export async function GET() {
  try {
    const repository = await createPartnerRepository();
    const [partners, partnerItems] = await Promise.all([
      repository.listPartners({ activeOnly: true }),
      repository.listPartnerItems({ activeOnly: true }),
    ]);

    return NextResponse.json({
      ...buildPartnerOptions(partners, partnerItems),
      repository: repository.getRepositoryInfo(),
    });
  } catch {
    return NextResponse.json(
      {
        ...EMPTY_OPTIONS,
        error: "PARTNER_WORKORDER_OPTIONS_UNAVAILABLE",
      },
      { status: 200 },
    );
  }
}
