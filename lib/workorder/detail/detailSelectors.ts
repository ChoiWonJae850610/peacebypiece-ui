import { FACTORY_OPTIONS } from "@/lib/constants/workorderOptions";
import { REGISTRY_TYPE, type RegistryTypeValue } from "@/lib/constants/workorderDomain";
import {
  listActiveMaterialPartnerNames,
  listActiveOutsourcingPartnerNamesByProcess,
  listActivePartnerNamesByTypes,
} from "@/lib/admin/partnerMasterPersistence";
import { appendOption } from "@/lib/workorder/detail/detailSanitizers";
import type { Material, Outsourcing } from "@/types/workorder";
import type { PartnerType } from "@/types/partner";
import type { OrderEntryState } from "@/components/workorder/detail/shared/detailEditorShared";

function mergeOptionLists(...sources: ReadonlyArray<ReadonlyArray<string>>): string[] {
  return sources.flat().reduce<string[]>((options, value) => appendOption(options, value), []);
}

export function selectSeededFactoryOptions() {
  return mergeOptionLists(
    FACTORY_OPTIONS,
    listActivePartnerNamesByTypes(["factory"]),
  );
}

export function selectFactoryOptions(orderItems: OrderEntryState[]): string[] {
  return orderItems.reduce<string[]>(
    (options, item) => appendOption(options, item.factory),
    selectSeededFactoryOptions(),
  );
}

export function selectMaterialVendorOptionsById(materialItems: Material[]): Record<string, string[]> {
  return Object.fromEntries(
    materialItems.map((item) => [
      item.id,
      mergeOptionLists(
        listActiveMaterialPartnerNames(item.type),
        item.vendor ? [item.vendor] : [],
      ),
    ]),
  );
}

export function selectOutsourcingVendorOptionsById(outsourcingItems: Outsourcing[]): Record<string, string[]> {
  return Object.fromEntries(
    outsourcingItems.map((item) => [
      item.id,
      mergeOptionLists(
        listActiveOutsourcingPartnerNamesByProcess(item.process),
        item.vendor ? [item.vendor] : [],
      ),
    ]),
  );
}

export function mapRegistryTypeToPartnerTypes(type: RegistryTypeValue): PartnerType[] {
  if (type === REGISTRY_TYPE.factory) {
    return ["factory"];
  }
  if (type === REGISTRY_TYPE.materialVendor) {
    return ["material_vendor"];
  }
  if (type === REGISTRY_TYPE.subsidiaryVendor) {
    return ["subsidiary_vendor"];
  }

  return ["material_vendor", "subsidiary_vendor"];
}
