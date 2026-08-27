import type { MaterialPartnerOption, MaterialType } from "@/domain/mobileContract";

const MATERIAL_CAPABILITY: Record<MaterialType, "fabric" | "subsidiary"> = {
  fabric: "fabric",
  accessory: "subsidiary",
};

export function materialPartnerOptionsFor(
  options: readonly MaterialPartnerOption[],
  materialType: MaterialType,
) {
  const capability = MATERIAL_CAPABILITY[materialType];
  return options.filter((option) => option.capabilityTypes.includes(capability));
}
