import { PARTNER_ITEM_CATEGORY_VALUES, PARTNER_DB_TYPE_VALUES } from "@/lib/partners/types";
import type {
  PartnerDbRecord,
  PartnerDbType,
  PartnerItemCategory,
  PartnerItemWithRelations,
  PartnerUnitRecord,
} from "@/lib/partners/types";
import type { ListPartnerItemsOptions, ListPartnersOptions, PartnerRepository } from "@/lib/partners/partnerRepository";

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

const now = new Date("2026-04-24T00:00:00.000Z").toISOString();

const MOCK_PARTNERS: PartnerDbRecord[] = PARTNER_DB_TYPE_VALUES.map((type, index) => ({
  id: `mock-partner-${type}`,
  company_id: null,
  name: {
    factory: "샘플 봉제공장",
    fabric: "샘플 원단업체",
    subsidiary: "샘플 부자재업체",
    outsourcing: "샘플 외주처",
  }[type],
  type,
  contact: null,
  email: null,
  is_active: true,
  created_at: new Date(Date.parse(now) + index).toISOString(),
  updated_at: new Date(Date.parse(now) + index).toISOString(),
}));

const MOCK_UNITS: PartnerUnitRecord[] = [
  ["piece", "개", "count", 10],
  ["sheet", "장", "count", 20],
  ["set", "세트", "count", 30],
  ["yard", "야드", "length", 40],
  ["meter", "미터", "length", 50],
  ["roll", "롤", "bundle", 60],
  ["pack", "팩", "bundle", 70],
  ["box", "박스", "bundle", 80],
  ["process", "공정", "service", 90],
  ["case", "건", "service", 100],
].map(([code, name, category, sortOrder]) => ({
  id: `mock-unit-${code}`,
  company_id: null,
  code: String(code),
  name: String(name),
  category: String(category) as PartnerUnitRecord["category"],
  is_active: true,
  sort_order: Number(sortOrder),
  created_at: now,
  updated_at: now,
}));

const ITEM_UNIT_BY_CATEGORY: Record<PartnerItemCategory, string> = {
  labor: "mock-unit-sheet",
  fabric: "mock-unit-yard",
  subsidiary: "mock-unit-piece",
  outsourcing: "mock-unit-process",
};

const ITEM_PARTNER_BY_CATEGORY: Record<PartnerItemCategory, PartnerDbType> = {
  labor: "factory",
  fabric: "fabric",
  subsidiary: "subsidiary",
  outsourcing: "outsourcing",
};

const MOCK_PARTNER_ITEMS: PartnerItemWithRelations[] = PARTNER_ITEM_CATEGORY_VALUES.map((category) => {
  const partner = MOCK_PARTNERS.find((item) => item.type === ITEM_PARTNER_BY_CATEGORY[category]) ?? null;
  const unit = MOCK_UNITS.find((item) => item.id === ITEM_UNIT_BY_CATEGORY[category]) ?? null;

  return {
    id: `mock-partner-item-${category}`,
    partner_id: partner?.id ?? "",
    category,
    name: {
      labor: "기본 공임",
      fabric: "기본 원단",
      subsidiary: "기본 부자재",
      outsourcing: "기본 외주공정",
    }[category],
    unit_id: unit?.id ?? null,
    unit_price: 0,
    currency: "KRW",
    memo: null,
    is_active: true,
    created_at: now,
    updated_at: now,
    partner_name: partner?.name ?? null,
    unit_name: unit?.name ?? null,
    unit_code: unit?.code ?? null,
  };
});

function filterPartners(partners: PartnerDbRecord[], options: ListPartnersOptions = {}) {
  return partners.filter((partner) => {
    if (options.type && partner.type !== options.type) return false;
    if (options.activeOnly && !partner.is_active) return false;
    return true;
  });
}

function filterPartnerItems(items: PartnerItemWithRelations[], options: ListPartnerItemsOptions = {}) {
  return items.filter((item) => {
    if (options.partnerId && item.partner_id !== options.partnerId) return false;
    if (options.category && item.category !== options.category) return false;
    if (options.activeOnly && !item.is_active) return false;
    return true;
  });
}

export const mockPartnerRepository: PartnerRepository = {
  getRepositoryInfo: () => ({ mode: "mock", adapterConfigured: true, supportsWrite: false }),
  listPartners: async (options) => filterPartners(cloneValue(MOCK_PARTNERS), options),
  listUnits: async (activeOnly = false) => cloneValue(MOCK_UNITS).filter((unit) => !activeOnly || unit.is_active),
  listPartnerItems: async (options) => filterPartnerItems(cloneValue(MOCK_PARTNER_ITEMS), options),
};
