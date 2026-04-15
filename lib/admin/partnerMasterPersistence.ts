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
import type { Partner, PartnerDraft } from "@/types/partner";

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
