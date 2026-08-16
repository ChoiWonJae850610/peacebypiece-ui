import type { MaterialPartnerOption, WorkOrderMaterialLine } from "@/domain/mobileContract";

export type QuickDeliveryItem = {
  readonly materialLineId: string;
  readonly materialType: "fabric" | "accessory";
  readonly name: string;
  readonly colorOption: string | null;
  readonly quantity: string;
  readonly unitCode: string;
};

export type QuickDeliveryGroup = {
  readonly partnerId: string;
  readonly partnerName: string;
  readonly contactPerson: string | null;
  readonly contact: string | null;
  readonly items: readonly QuickDeliveryItem[];
};

export function buildQuickDeliveryGroups(
  lines: readonly WorkOrderMaterialLine[],
  partners: readonly MaterialPartnerOption[],
): readonly QuickDeliveryGroup[] {
  const requested = lines.filter((line) => line.lifecycle === "active" && line.status === "requested" && line.partnerId);
  const groups = new Map<string, QuickDeliveryGroup>();
  for (const line of requested) {
    const partnerId = line.partnerId!;
    const partner = partners.find((candidate) => candidate.id === partnerId);
    const current = groups.get(partnerId) ?? {
      partnerId,
      partnerName: line.partnerName?.trim() || partner?.name || "거래처 미지정",
      contactPerson: partner?.contactPerson ?? null,
      contact: partner?.contact ?? null,
      items: [],
    };
    groups.set(partnerId, {
      ...current,
      items: [...current.items, {
        materialLineId: line.id,
        materialType: line.materialType,
        name: line.name,
        colorOption: line.colorOption,
        quantity: line.orderQuantity,
        unitCode: line.unitCode,
      }],
    });
  }
  return [...groups.values()].sort((left, right) => left.partnerName.localeCompare(right.partnerName, "ko"));
}

export function quickDeliveryFactoryOptions(partners: readonly MaterialPartnerOption[]) {
  return partners.filter((partner) => partner.role === "factory");
}

export const QUICK_DELIVERY_PERSISTENCE_RESULT = "QUICK_DELIVERY_PERSISTENCE_DEFERRED" as const;
