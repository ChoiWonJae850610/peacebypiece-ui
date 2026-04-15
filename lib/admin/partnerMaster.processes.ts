import { DEFAULT_OUTSOURCING_PROCESS_META, DEFAULT_OUTSOURCING_PROCESS_TYPES } from "@/lib/admin/partnerMaster.constants";
import type { OutsourcingProcessDefinition } from "@/lib/admin/partnerMaster.types";
import type { OutsourcingProcessType } from "@/types/partner";

export function createDefaultOutsourcingProcessDefinitions(): OutsourcingProcessDefinition[] {
  return DEFAULT_OUTSOURCING_PROCESS_TYPES.map((type, index) => ({
    type,
    label: DEFAULT_OUTSOURCING_PROCESS_META[type].label,
    tone: DEFAULT_OUTSOURCING_PROCESS_META[type].tone,
    isActive: true,
    sortOrder: index + 1,
  }));
}

export function normalizeOutsourcingProcessDefinitions(definitions: OutsourcingProcessDefinition[]) {
  return definitions
    .map((definition, index) => ({
      ...definition,
      label: definition.label.trim(),
      sortOrder: index + 1,
    }))
    .filter((definition) => Boolean(definition.label));
}

export function createOutsourcingProcessTypeKey(label: string) {
  const normalized = label
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || "outsourcing_process";
}

export function createOutsourcingProcessDefinition(
  label: string,
  currentDefinitions: OutsourcingProcessDefinition[],
): OutsourcingProcessDefinition {
  const existingTypes = new Set(currentDefinitions.map((definition) => definition.type));
  const baseType = createOutsourcingProcessTypeKey(label);
  let nextType = baseType;
  let suffix = 2;

  while (existingTypes.has(nextType)) {
    nextType = `${baseType}_${suffix}`;
    suffix += 1;
  }

  return {
    type: nextType,
    label: label.trim(),
    tone: "bg-slate-200 text-slate-700",
    isActive: true,
    sortOrder: currentDefinitions.length + 1,
  };
}

export function moveOutsourcingProcessDefinition(
  definitions: OutsourcingProcessDefinition[],
  type: OutsourcingProcessType,
  direction: "up" | "down",
) {
  const sorted = definitions.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const index = sorted.findIndex((definition) => definition.type === type);
  if (index < 0) return definitions;

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= sorted.length) return definitions;

  [sorted[index], sorted[targetIndex]] = [sorted[targetIndex], sorted[index]];

  return sorted.map((definition, orderIndex) => ({
    ...definition,
    sortOrder: orderIndex + 1,
  }));
}

export function removeOutsourcingProcessDefinition(
  definitions: OutsourcingProcessDefinition[],
  type: OutsourcingProcessType,
) {
  return normalizeOutsourcingProcessDefinitions(definitions.filter((definition) => definition.type !== type));
}
