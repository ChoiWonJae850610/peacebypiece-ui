import { isBasePartnerType } from "@/lib/admin/partner/draft";
import type { OutsourcingProcessDefinition } from "@/lib/admin/partner/types";
import type { OutsourcingProcessType, PartnerDraft } from "@/types/partner";

function sortProcessesByLabel(items: OutsourcingProcessDefinition[]) {
  return items.slice().sort((a, b) => a.label.localeCompare(b.label, "ko-KR"));
}

export function selectPartnerDraftPrimaryTypes(draft: PartnerDraft) {
  return draft.partnerTypes.filter(isBasePartnerType);
}

export function selectIsOutsourcingEnabled(draft: PartnerDraft) {
  return draft.partnerTypes.includes("outsourcing_vendor");
}

export function selectAvailableOutsourcingProcessDefinitions(
  draft: PartnerDraft,
  definitions: OutsourcingProcessDefinition[],
) {
  const assignedTypes = new Set<OutsourcingProcessType>(draft.outsourcingProcessTypes);
  return sortProcessesByLabel(definitions.filter((definition) => definition.isActive && !assignedTypes.has(definition.type)));
}

export function selectAssignedOutsourcingProcessDefinitions(
  draft: PartnerDraft,
  definitions: OutsourcingProcessDefinition[],
) {
  const assignedTypes = new Set<OutsourcingProcessType>(draft.outsourcingProcessTypes);
  return sortProcessesByLabel(definitions.filter((definition) => assignedTypes.has(definition.type)));
}

export function selectActiveOutsourcingProcessDefinitions(definitions: OutsourcingProcessDefinition[]) {
  return sortProcessesByLabel(definitions.filter((definition) => definition.isActive));
}

export function selectInactiveOutsourcingProcessDefinitions(definitions: OutsourcingProcessDefinition[]) {
  return sortProcessesByLabel(definitions.filter((definition) => !definition.isActive));
}
