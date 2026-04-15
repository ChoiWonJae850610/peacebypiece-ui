import {
  createDefaultOutsourcingProcessDefinitions,
  type OutsourcingProcessDefinition,
} from "@/lib/admin/partnerMaster";
import {
  createPartnerMasterItem,
  listPartnerMasterItems,
  updatePartnerMasterItem,
} from "@/lib/admin/partnerMasterRepository";
import {
  loadPersistedOutsourcingProcesses,
  persistOutsourcingProcesses,
} from "@/lib/repositories/outsourcingProcessPersistence";
import type { Partner, PartnerDraft, PartnerType } from "@/types/partner";

export function loadPartnerMasterInitialState(): {
  partners: Partner[];
  processDefinitions: OutsourcingProcessDefinition[];
} {
  return {
    partners: listPartnerMasterItems(),
    processDefinitions: loadPersistedOutsourcingProcesses() ?? createDefaultOutsourcingProcessDefinitions(),
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

export function listActivePartnerNamesByTypes(partnerTypes: readonly PartnerType[]): string[] {
  const allowedTypes = new Set(partnerTypes);

  return listPartnerMasterItems()
    .filter((partner) => partner.isActive && partner.partnerTypes.some((type) => allowedTypes.has(type)))
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
    memo: "",
  });
}
