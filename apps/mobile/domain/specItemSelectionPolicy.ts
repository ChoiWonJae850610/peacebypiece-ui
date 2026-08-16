import type { CompanyWorkOrderStructureOption, WorkOrderPomColumn } from "./mobileContract";
import type { WaflSystemSpecItem } from "./systemSpecItemCatalog";

export type StagedSpecItem = {
  readonly key: string;
  readonly catalogOptionId: string | null;
  readonly systemSpecItemKey: string | null;
  readonly currentPomId: string | null;
  readonly displayName: string;
  readonly sourceKind: "system" | "company" | "current";
};

export function normalizeSpecItemName(value: string) {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en-US");
}

export function createSpecItemCandidates(
  currentPoms: readonly WorkOrderPomColumn[],
  catalogOptions: readonly CompanyWorkOrderStructureOption[],
  systemItems: readonly WaflSystemSpecItem[],
): readonly StagedSpecItem[] {
  const specOptions = catalogOptions.filter((option) => option.kind === "spec_item" && option.active);
  const catalogByName = new Map(specOptions.map((option) => [normalizeSpecItemName(option.displayName), option]));
  const catalogByCode = new Map(specOptions.map((option) => [`company_spec_item:${option.id}`, option]));
  const systemByName = new Map(systemItems.map((option) => [normalizeSpecItemName(option.displayName), option]));
  const systemByCode = new Map(systemItems.map((option) => [`wafl_system_spec_item:${option.key}`, option]));
  const matchedCatalogIds = new Set<string>();
  const matchedSystemKeys = new Set<string>();
  const current = currentPoms.map((pom) => {
    const system = systemByCode.get(pom.code) ?? systemByName.get(normalizeSpecItemName(pom.displayName)) ?? null;
    const option = system ? null : catalogByCode.get(pom.code) ?? catalogByName.get(normalizeSpecItemName(pom.displayName)) ?? null;
    if (system) matchedSystemKeys.add(system.key);
    if (option) matchedCatalogIds.add(option.id);
    return {
      key: system ? `system:${system.key}` : option ? `catalog:${option.id}` : `legacy:${pom.id}`,
      catalogOptionId: option?.id ?? null,
      systemSpecItemKey: system?.key ?? null,
      currentPomId: pom.id,
      displayName: pom.displayName,
      sourceKind: system ? "system" as const : option ? "company" as const : "current" as const,
    };
  });
  return [
    ...current,
    ...systemItems.filter((option) => !matchedSystemKeys.has(option.key)).map((option) => ({
      key: `system:${option.key}`,
      catalogOptionId: null,
      systemSpecItemKey: option.key,
      currentPomId: null,
      displayName: option.displayName,
      sourceKind: "system" as const,
    })),
    ...specOptions.filter((option) => !matchedCatalogIds.has(option.id)).map((option) => ({
      key: `catalog:${option.id}`,
      catalogOptionId: option.id,
      systemSpecItemKey: null,
      currentPomId: null,
      displayName: option.displayName,
      sourceKind: "company" as const,
    })),
  ];
}

export function initialSpecItemSelection(candidates: readonly StagedSpecItem[]) {
  return candidates.filter((item) => item.currentPomId !== null).map((item) => item.key);
}

export function toggleSpecItemSelection(selectedKeys: readonly string[], key: string) {
  const selected = new Set(selectedKeys);
  if (selected.has(key)) selected.delete(key);
  else selected.add(key);
  return [...selected];
}

export function selectedSpecItems(candidates: readonly StagedSpecItem[], selectedKeys: readonly string[]) {
  const selected = new Set(selectedKeys);
  return candidates.filter((item) => selected.has(item.key));
}
