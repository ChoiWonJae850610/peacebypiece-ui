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
  outsourcingProcessOptions: string[];
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
  outsourcingProcessOptions: [],
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
    outsourcingProcessOptions: [],
    partnerItemOptions: {
      labor: [],
      fabric: [],
      subsidiary: [],
      outsourcing: [],
    },
  };

  const activePartnerNames = new Map(partners.filter((partner) => partner.is_active).map((partner) => [partner.id, partner.name]));

  for (const item of partnerItems) {
    if (!item.is_active) continue;

    const partnerName = item.partner_name ?? activePartnerNames.get(item.partner_id) ?? null;

    if (item.category === "labor") {
      options.factoryOptions = appendUnique(options.factoryOptions, partnerName);
      options.partnerItemOptions.labor = appendUnique(options.partnerItemOptions.labor, partnerName);
      continue;
    }

    if (item.category === "fabric") {
      options.materialVendorOptions.fabric = appendUnique(options.materialVendorOptions.fabric, partnerName);
      options.partnerItemOptions.fabric = appendUnique(options.partnerItemOptions.fabric, item.name);
      continue;
    }

    if (item.category === "subsidiary") {
      options.materialVendorOptions.subsidiary = appendUnique(options.materialVendorOptions.subsidiary, partnerName);
      options.partnerItemOptions.subsidiary = appendUnique(options.partnerItemOptions.subsidiary, item.name);
      continue;
    }

    if (item.category === "outsourcing") {
      options.outsourcingVendorOptions = appendUnique(options.outsourcingVendorOptions, partnerName);
      options.outsourcingProcessOptions = appendUnique(options.outsourcingProcessOptions, item.outsourcing_process_name ?? item.name);
      options.partnerItemOptions.outsourcing = appendUnique(options.partnerItemOptions.outsourcing, item.name);
    }
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
