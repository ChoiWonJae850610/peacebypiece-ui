import { FACTORY_OPTIONS } from "@/lib/constants/workorderOptions";
import { MATERIAL_KIND } from "@/lib/constants/workorderDomain";
import {
  listActiveMaterialPartnerNames,
  listActiveOutsourcingPartnerNamesByProcess,
  listActivePartnerNamesByTypes,
} from "@/lib/admin/partnerMasterPersistence";
import { appendOption } from "@/lib/workorder/detail/detailSanitizers";
import type { Material, Outsourcing } from "@/types/workorder";
import type { OrderEntryState } from "@/components/workorder/detail/shared/detailEditorShared";

function mergeOptionLists(...sources: ReadonlyArray<ReadonlyArray<string>>): string[] {
  return sources.flat().reduce<string[]>((options, value) => appendOption(options, value), []);
}

function hasPartnerOptions(options: readonly string[] | undefined): boolean {
  return Array.isArray(options) && options.length > 0;
}

function selectDbOptionsOrFallback(partnerOptions: readonly string[] | undefined, fallbackOptions: readonly string[]): string[] {
  return hasPartnerOptions(partnerOptions) ? mergeOptionLists(partnerOptions ?? []) : mergeOptionLists(fallbackOptions);
}

export function selectSeededFactoryOptions() {
  return mergeOptionLists(
    FACTORY_OPTIONS,
    listActivePartnerNamesByTypes(["factory"]),
  );
}

export function selectFactoryOptions(orderItems: OrderEntryState[], partnerFactoryOptions: readonly string[] = []): string[] {
  if (hasPartnerOptions(partnerFactoryOptions)) {
    return mergeOptionLists(partnerFactoryOptions);
  }

  return orderItems.reduce<string[]>(
    (options, item) => appendOption(options, item.factory),
    selectSeededFactoryOptions(),
  );
}

export type PartnerMaterialVendorOptions = {
  fabric?: readonly string[];
  subsidiary?: readonly string[];
};

function selectPartnerMaterialVendorOptions(materialType: string, partnerMaterialVendorOptions: PartnerMaterialVendorOptions = {}): readonly string[] {
  if (materialType === MATERIAL_KIND.fabric) return partnerMaterialVendorOptions.fabric ?? [];
  if (materialType === MATERIAL_KIND.subsidiary) return partnerMaterialVendorOptions.subsidiary ?? [];
  return mergeOptionLists(partnerMaterialVendorOptions.fabric ?? [], partnerMaterialVendorOptions.subsidiary ?? []);
}

function selectSeededMaterialVendorOptions(materialType: string, currentVendor: string | undefined): string[] {
  return mergeOptionLists(
    listActiveMaterialPartnerNames(materialType),
    currentVendor ? [currentVendor] : [],
  );
}

export function selectMaterialVendorOptionsById(
  materialItems: Material[],
  partnerMaterialVendorOptions: PartnerMaterialVendorOptions = {},
): Record<string, string[]> {
  return Object.fromEntries(
    materialItems.map((item) => [
      item.id,
      selectDbOptionsOrFallback(
        selectPartnerMaterialVendorOptions(item.type, partnerMaterialVendorOptions),
        selectSeededMaterialVendorOptions(item.type, item.vendor),
      ),
    ]),
  );
}

export function selectOutsourcingVendorOptionsById(
  outsourcingItems: Outsourcing[],
  partnerOutsourcingVendorOptions: readonly string[] = [],
): Record<string, string[]> {
  return Object.fromEntries(
    outsourcingItems.map((item) => [
      item.id,
      selectDbOptionsOrFallback(
        partnerOutsourcingVendorOptions,
        mergeOptionLists(
          listActiveOutsourcingPartnerNamesByProcess(item.process),
          item.vendor ? [item.vendor] : [],
        ),
      ),
    ]),
  );
}

export function mapRegistryTypeToPartnerTypes(type: string) {
  switch (type) {
    case "factory":
      return ["factory"] as const;
    case "material_vendor":
      return ["material_vendor"] as const;
    case "subsidiary_vendor":
      return ["subsidiary_vendor"] as const;
    default:
      return [] as const;
  }
}
