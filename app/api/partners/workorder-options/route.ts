import { NextResponse } from "next/server";
import { createPartnerRepository } from "@/lib/partners/partnerAdapter";
import type { OutsourcingProcessRecord, PartnerDbRecord, PartnerItemWithRelations } from "@/lib/partners/types";

type WorkOrderPartnerOptions = {
  factoryOptions: string[];
  materialVendorOptions: {
    fabric: string[];
    subsidiary: string[];
  };
  outsourcingVendorOptions: string[];
  outsourcingVendorOptionsByProcess: Record<string, string[]>;
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
  outsourcingVendorOptionsByProcess: {},
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

function normalizeProcessKey(value: string | null | undefined) {
  return (value ?? "").trim().toLocaleLowerCase("ko-KR");
}

function appendProcessPartnerOption(options: WorkOrderPartnerOptions, processName: string | null | undefined, partnerName: string | null | undefined) {
  const processKey = normalizeProcessKey(processName);
  if (!processKey) return;

  options.outsourcingVendorOptionsByProcess[processKey] = appendUnique(options.outsourcingVendorOptionsByProcess[processKey] ?? [], partnerName);
}

function buildPartnerOptions(
  partners: PartnerDbRecord[],
  partnerItems: PartnerItemWithRelations[],
  outsourcingProcesses: OutsourcingProcessRecord[] = [],
): WorkOrderPartnerOptions {
  const options: WorkOrderPartnerOptions = {
    factoryOptions: [],
    materialVendorOptions: {
      fabric: [],
      subsidiary: [],
    },
    outsourcingVendorOptions: [],
    outsourcingVendorOptionsByProcess: {},
    outsourcingProcessOptions: [],
    partnerItemOptions: {
      labor: [],
      fabric: [],
      subsidiary: [],
      outsourcing: [],
    },
  };

  const activePartnerNames = new Map(partners.filter((partner) => partner.is_active).map((partner) => [partner.id, partner.name]));

  for (const process of outsourcingProcesses) {
    if (!process.is_active) continue;
    options.outsourcingProcessOptions = appendUnique(options.outsourcingProcessOptions, process.name);
  }

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
      const processName = item.outsourcing_process_name ?? item.name;
      options.outsourcingVendorOptions = appendUnique(options.outsourcingVendorOptions, partnerName);
      appendProcessPartnerOption(options, processName, partnerName);
      options.partnerItemOptions.outsourcing = appendUnique(options.partnerItemOptions.outsourcing, item.name);
    }
  }

  return options;
}

export async function GET() {
  try {
    const repository = await createPartnerRepository();
    const [partners, partnerItems, outsourcingProcesses] = await Promise.all([
      repository.listPartners({ activeOnly: true }),
      repository.listPartnerItems({ activeOnly: true }),
      repository.listOutsourcingProcesses?.(true) ?? Promise.resolve([]),
    ]);

    return NextResponse.json({
      ...buildPartnerOptions(partners, partnerItems, outsourcingProcesses),
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
