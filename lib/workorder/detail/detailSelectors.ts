import { MATERIAL_KIND, NO_REGISTERED_PARTNER_OPTION, NO_REGISTERED_PROCESS_OPTION } from "@/lib/constants/workorderDomain";
import { appendOption } from "@/lib/workorder/detail/detailSanitizers";
import type { Material, Outsourcing } from "@/types/workorder";
import type { OrderEntryState } from "@/components/workorder/detail/shared/detailEditorShared";

function mergeOptionLists(...sources: ReadonlyArray<ReadonlyArray<string>>): string[] {
  return sources.flat().reduce<string[]>((options, value) => appendOption(options, value), []);
}

function buildRegisteredPartnerOptions(options: readonly string[] | undefined): string[] {
  const registeredOptions = mergeOptionLists(options ?? []);
  return registeredOptions.length > 0 ? registeredOptions : [NO_REGISTERED_PARTNER_OPTION];
}

function buildRegisteredProcessOptions(options: readonly string[] | undefined): string[] {
  const registeredOptions = mergeOptionLists(options ?? []);
  return registeredOptions.length > 0 ? registeredOptions : [NO_REGISTERED_PROCESS_OPTION];
}

export function selectSeededFactoryOptions() {
  return buildRegisteredPartnerOptions([]);
}

export function selectFactoryOptions(_orderItems: OrderEntryState[], partnerFactoryOptions: readonly string[] = []): string[] {
  return buildRegisteredPartnerOptions(partnerFactoryOptions);
}

export type PartnerMaterialVendorOptions = {
  fabric?: readonly string[];
  subsidiary?: readonly string[];
};

export type PartnerOutsourcingVendorOptionsByProcess = Record<string, readonly string[]>;

function selectPartnerMaterialVendorOptions(materialType: string, partnerMaterialVendorOptions: PartnerMaterialVendorOptions = {}): readonly string[] {
  if (materialType === MATERIAL_KIND.fabric) return partnerMaterialVendorOptions.fabric ?? [];
  if (materialType === MATERIAL_KIND.subsidiary) return partnerMaterialVendorOptions.subsidiary ?? [];
  return mergeOptionLists(partnerMaterialVendorOptions.fabric ?? [], partnerMaterialVendorOptions.subsidiary ?? []);
}

export function selectMaterialVendorOptionsById(
  materialItems: Material[],
  partnerMaterialVendorOptions: PartnerMaterialVendorOptions = {},
): Record<string, string[]> {
  return Object.fromEntries(
    materialItems.map((item) => [
      item.id,
      buildRegisteredPartnerOptions(selectPartnerMaterialVendorOptions(item.type, partnerMaterialVendorOptions)),
    ]),
  );
}

export function selectOutsourcingProcessOptions(partnerOutsourcingProcessOptions: readonly string[] = []): string[] {
  return buildRegisteredProcessOptions(partnerOutsourcingProcessOptions);
}

function normalizeProcessKey(value: string) {
  return value.trim().toLocaleLowerCase("ko-KR");
}

function selectPartnerOutsourcingVendorOptions(
  process: string,
  partnerOutsourcingVendorOptionsByProcess: PartnerOutsourcingVendorOptionsByProcess = {},
): readonly string[] {
  const processKey = normalizeProcessKey(process);
  if (!processKey) return [];

  return partnerOutsourcingVendorOptionsByProcess[processKey] ?? [];
}

export function selectOutsourcingVendorOptionsById(
  outsourcingItems: Outsourcing[],
  partnerOutsourcingVendorOptionsByProcess: PartnerOutsourcingVendorOptionsByProcess = {},
): Record<string, string[]> {
  return Object.fromEntries(
    outsourcingItems.map((item) => [
      item.id,
      buildRegisteredPartnerOptions(selectPartnerOutsourcingVendorOptions(item.process, partnerOutsourcingVendorOptionsByProcess)),
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
