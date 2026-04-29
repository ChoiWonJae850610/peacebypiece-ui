import { applyPartnerTypeSelectionPolicy } from "@/lib/admin/partner/draft";
import { createDefaultOutsourcingProcessDefinitions, normalizeOutsourcingProcessDefinitions } from "@/lib/admin/partner/processes";
import type { BasePartnerType, OutsourcingProcessDefinition } from "@/lib/admin/partner/types";
import type { OutsourcingProcessType, PartnerDraft } from "@/types/partner";

export function applyPartnerPrimaryTypeToDraft(draft: PartnerDraft, type: BasePartnerType): PartnerDraft {
  const nextPartnerTypes = applyPartnerTypeSelectionPolicy(draft.partnerTypes, type);
  return {
    ...draft,
    partnerTypes: nextPartnerTypes,
    outsourcingProcessTypes: nextPartnerTypes.includes("outsourcing_vendor") ? draft.outsourcingProcessTypes : [],
  };
}

export function togglePartnerDraftOutsourcingProcess(draft: PartnerDraft, type: OutsourcingProcessType): PartnerDraft {
  return {
    ...draft,
    outsourcingProcessTypes: draft.outsourcingProcessTypes.includes(type)
      ? draft.outsourcingProcessTypes.filter((item) => item !== type)
      : [...draft.outsourcingProcessTypes, type],
  };
}

export function setOutsourcingProcessDefinitionActive(
  definitions: OutsourcingProcessDefinition[],
  type: OutsourcingProcessType,
  isActive: boolean,
) {
  return normalizeOutsourcingProcessDefinitions(
    definitions.map((definition) => (definition.type === type ? { ...definition, isActive } : definition)),
  );
}

export function resetOutsourcingProcessDefinitionDraft() {
  return createDefaultOutsourcingProcessDefinitions();
}
