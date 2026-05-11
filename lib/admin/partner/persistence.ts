import type { OutsourcingProcessDefinition } from "@/lib/admin/partner/types";
import {
  createPartnerMasterItem,
  listPartnerMasterItems,
  updatePartnerMasterItem,
} from "@/lib/admin/partner/repository";
import {
  loadPersistedOutsourcingProcesses,
  persistOutsourcingProcesses,
} from "@/lib/repositories/outsourcingProcessPersistence";
import { MATERIAL_KIND } from "@/lib/constants/workorderDomain";
import { PARTNER_INACTIVE_SELECTION_POLICY } from "@/lib/admin/partner/constants";
import type {
  Partner,
  PartnerCapabilityType,
  PartnerDraft,
  PartnerType,
} from "@/types/partner";

const OUTSOURCING_PROCESS_ALIASES: Record<string, string[]> = {
  cutting: ["cutting", "재단"],
  printing: ["printing", "나염"],
  embroidery: ["embroidery", "자수"],
  washing: ["washing", "워싱"],
  finishing: ["finishing", "후가공"],
  sewing: ["sewing", "stitching", "봉제"],
  other: ["other", "기타"],
};

export function loadPartnerMasterInitialState(): {
  partners: Partner[];
  processDefinitions: OutsourcingProcessDefinition[];
} {
  return {
    partners: listPartnerMasterItems(),
    processDefinitions: loadPersistedOutsourcingProcesses() ?? [],
  };
}

export function savePartnerMasterItem(editingPartnerId: string | null, draft: PartnerDraft): Partner[] {
  return editingPartnerId
    ? updatePartnerMasterItem(editingPartnerId, draft)
    : createPartnerMasterItem(draft);
}

export function savePartnerMasterProcessDefinitions(processDefinitions: OutsourcingProcessDefinition[]) {
  persistOutsourcingProcesses(processDefinitions);
}

function normalizePartnerName(value: string) {
  return value.trim();
}

function getPartnerCapabilityTypes(partner: Partner): PartnerCapabilityType[] {
  const capabilities = new Set<PartnerCapabilityType>();

  if (partner.partnerTypes.includes("factory")) {
    capabilities.add("factory");
  }
  if (partner.partnerTypes.includes("material_vendor")) {
    capabilities.add("fabric");
  }
  if (partner.partnerTypes.includes("subsidiary_vendor")) {
    capabilities.add("accessory");
  }
  if (partner.partnerTypes.includes("outsourcing_vendor")) {
    capabilities.add("outsourcing");
  }

  return [...capabilities];
}

function normalizeProcessToken(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const lowered = trimmed.toLocaleLowerCase("ko-KR");
  for (const [canonical, aliases] of Object.entries(OUTSOURCING_PROCESS_ALIASES)) {
    if (aliases.some((alias) => alias.toLocaleLowerCase("ko-KR") === lowered)) {
      return canonical;
    }
  }

  return lowered
    .replace(/\s+/g, "_")
    .replace(/[^\p{L}\p{N}_-]+/gu, "")
    .replace(/^_+|_+$/g, "");
}

export function getPartnerSupportedProcesses(partner: Partner): string[] {
  return [...new Set((partner.supportedProcesses ?? partner.outsourcingProcessTypes ?? []).map(normalizeProcessToken).filter(Boolean))];
}

export function listActivePartnerNamesByTypes(partnerTypes: readonly PartnerType[]): string[] {
  const allowedTypes = new Set(partnerTypes);

  return listPartnerMasterItems()
    .filter((partner) => (PARTNER_INACTIVE_SELECTION_POLICY.includeInWorkOrderOptions ? true : partner.isActive) && partner.partnerTypes.some((type) => allowedTypes.has(type)))
    .map((partner) => normalizePartnerName(partner.name))
    .filter(Boolean);
}

export function findPartnerIdByNameAndTypes(name: string, partnerTypes: readonly PartnerType[]): string | null {
  const normalizedName = normalizePartnerName(name);
  if (!normalizedName) return null;

  const allowedTypes = new Set(partnerTypes);
  const target = listPartnerMasterItems().find((partner) => {
    if (!((PARTNER_INACTIVE_SELECTION_POLICY.includeInWorkOrderOptions ? true : partner.isActive))) return false;
    if (!partner.partnerTypes.some((type) => allowedTypes.has(type))) return false;
    return normalizePartnerName(partner.name) === normalizedName;
  });

  return target?.id ?? null;
}

export function listActivePartnerNamesByCapability(capability: PartnerCapabilityType): string[] {
  return listPartnerMasterItems()
    .filter((partner) => (PARTNER_INACTIVE_SELECTION_POLICY.includeInWorkOrderOptions ? true : partner.isActive) && getPartnerCapabilityTypes(partner).includes(capability))
    .map((partner) => normalizePartnerName(partner.name))
    .filter(Boolean);
}

export function listActiveMaterialPartnerNames(materialType: string): string[] {
  const normalizedType = materialType.trim();

  if (normalizedType === MATERIAL_KIND.fabric) {
    return listActivePartnerNamesByCapability("fabric");
  }
  if (normalizedType === MATERIAL_KIND.subsidiary) {
    return listActivePartnerNamesByCapability("accessory");
  }

  return [
    ...listActivePartnerNamesByCapability("fabric"),
    ...listActivePartnerNamesByCapability("accessory"),
  ].filter((value, index, values) => values.indexOf(value) === index);
}

export function listActiveOutsourcingPartnerNamesByProcess(process: string): string[] {
  const normalizedProcess = normalizeProcessToken(process);

  return listPartnerMasterItems()
    .filter((partner) => {
      if (!PARTNER_INACTIVE_SELECTION_POLICY.includeInWorkOrderOptions && !partner.isActive) return false;
      if (!getPartnerCapabilityTypes(partner).includes("outsourcing")) return false;

      const supportedProcesses = getPartnerSupportedProcesses(partner);
      if (supportedProcesses.length === 0) {
        return true;
      }

      if (!normalizedProcess) {
        return true;
      }

      return supportedProcesses.includes(normalizedProcess);
    })
    .map((partner) => normalizePartnerName(partner.name))
    .filter(Boolean);
}

export function ensurePartnerMasterItem(name: string, partnerTypes: readonly PartnerType[]) {
  const normalizedName = normalizePartnerName(name);
  if (!normalizedName) return listPartnerMasterItems();

  const currentPartners = listPartnerMasterItems();
  const existingPartner = currentPartners.find((partner) => partner.name.trim() === normalizedName);

  if (existingPartner) {
    return currentPartners;
  }

  return createPartnerMasterItem({
    name: normalizedName,
    partnerTypes: [...partnerTypes],
    isActive: true,
    contactName: "",
    phone: "",
    email: "",
    outsourcingProcessTypes: [],
    supportedProcesses: [],
    memo: "",
  });
}
