import seedJson from "./waflBasicSpecV1Seed.json" with { type: "json" };
import basicFitSeedJson from "./waflBasicFitSeedV01.json" with { type: "json" };

import type { WorkOrderMajorCategoryCode } from "../catalog/workOrderCategoryPolicy.ts";
import { listWaflSystemSpecItems } from "../catalog/systemSpecItemCatalog.mjs";

type SeedTemplate = {
  readonly name: string;
  readonly poms: readonly string[];
  readonly valuesCm: Readonly<Record<string, Readonly<Record<string, number>>>>;
};

type Seed = {
  readonly version: string;
  readonly sizeLabels: readonly string[];
  readonly templates: Readonly<Record<string, SeedTemplate>>;
  readonly providedPomAddons: Readonly<Record<string, { readonly poms: readonly string[]; readonly defaultsCm: Readonly<Record<string, number | string>> }>>;
};

type BasicFitSeedTemplate = {
  readonly poms: readonly string[];
  readonly valuesCm: Readonly<Record<string, readonly number[]>>;
};

type BasicFitSeed = {
  readonly version: string;
  readonly templates: Readonly<Record<string, BasicFitSeedTemplate>>;
};

const SEED = seedJson as Seed;
const BASIC_FIT_SEED = basicFitSeedJson as BasicFitSeed;

const CATEGORY_LABELS: Readonly<Record<"T" | "B" | "O" | "D", keyof Seed["templates"]>> = {
  T: "상의", B: "하의", O: "아우터", D: "원피스",
};

const LEGACY_TEMPLATE_IDS: Readonly<Record<"T" | "B" | "O" | "D", string>> = {
  T: "a6700001-0000-5000-8000-000000000001",
  B: "a6700001-0000-5000-8000-000000000002",
  O: "a6700001-0000-5000-8000-000000000003",
  D: "a6700001-0000-5000-8000-000000000004",
};

const TARGET_TEMPLATE_IDS = {
  여성: {
    T: "a6900001-0000-5000-8000-000000000001",
    B: "a6900001-0000-5000-8000-000000000002",
    O: "a6900001-0000-5000-8000-000000000003",
    D: "a6900001-0000-5000-8000-000000000004",
  },
  남성: {
    T: "a6900001-0000-5000-8000-000000000011",
    B: "a6900001-0000-5000-8000-000000000012",
    O: "a6900001-0000-5000-8000-000000000013",
  },
} as const;

export type WaflBasicSpecTargetAudience = "여성" | "남성";

export type WaflBasicSpecPom = { readonly code: string; readonly name: string; readonly displayOrder: number };
export type WaflBasicSpecTemplate = {
  readonly id: string;
  readonly categoryCode: "T" | "B" | "O" | "D";
  readonly targetAudience: WaflBasicSpecTargetAudience | null;
  readonly name: string;
  readonly templateVersion: 1;
  readonly sizes: readonly string[];
  readonly poms: readonly WaflBasicSpecPom[];
  readonly valuesCm: Readonly<Record<string, Readonly<Record<string, number>>>>;
};

function isBasicCategory(code: WorkOrderMajorCategoryCode | null): code is "T" | "B" | "O" | "D" {
  return code === "T" || code === "B" || code === "O" || code === "D";
}

function targetTemplateId(targetAudience: WaflBasicSpecTargetAudience, categoryCode: "T" | "B" | "O" | "D") {
  return TARGET_TEMPLATE_IDS[targetAudience][categoryCode as keyof (typeof TARGET_TEMPLATE_IDS)[typeof targetAudience]] ?? null;
}

function basicFitTemplateKey(
  targetAudience: WaflBasicSpecTargetAudience,
  categoryCode: "T" | "B" | "O" | "D",
) {
  const target = targetAudience === "여성" ? "women" : "men";
  const category = categoryCode === "T" ? "tops"
    : categoryCode === "B" ? "bottoms"
      : categoryCode === "O" ? "outerwear"
        : "dresses";
  return `${target}_${category}`;
}

function createTemplate(
  categoryCode: "T" | "B" | "O" | "D",
  targetAudience: WaflBasicSpecTargetAudience | null,
): WaflBasicSpecTemplate | null {
  const id = targetAudience ? targetTemplateId(targetAudience, categoryCode) : LEGACY_TEMPLATE_IDS[categoryCode];
  if (!id) return null;
  if (!isBasicCategory(categoryCode)) return null;
  const base = SEED.templates[CATEGORY_LABELS[categoryCode]];
  const systemItems = listWaflSystemSpecItems(categoryCode);
  const systemByName = new Map(systemItems.map((item) => [item.displayName, item]));
  const systemByCode = new Map(systemItems.map((item) => [item.code, item]));
  const targetSeed = targetAudience ? BASIC_FIT_SEED.templates[basicFitTemplateKey(targetAudience, categoryCode)] : null;
  const baseItems = targetSeed
    ? targetSeed.poms.flatMap((code) => {
      const item = systemByCode.get(code);
      return item ? [item] : [];
    })
    : base.poms.flatMap((name) => {
      const item = systemByName.get(name);
      return item ? [item] : [];
    });
  const sizes = targetSeed ? Object.keys(targetSeed.valuesCm) : SEED.sizeLabels;
  const valuesCm = targetSeed
    ? Object.fromEntries(Object.entries(targetSeed.valuesCm).map(([size, row]) => [size, Object.fromEntries(
      targetSeed.poms.flatMap((code, index) => {
        const item = systemByCode.get(code);
        const value = row[index];
        return item && Number.isFinite(value) ? [[item.displayName, value]] : [];
      }),
    )]))
    : Object.fromEntries(sizes.flatMap((size) => {
      const baseValues = base.valuesCm[size] ?? {};
      if (Object.keys(baseValues).length === 0) return [];
      return [[size, Object.fromEntries(Object.entries(baseValues).filter(([name]) => base.poms.includes(name)))]];
    }));
  return {
    id, categoryCode, targetAudience,
    name: targetAudience ? `WAFL 추천 ${targetAudience} ${CATEGORY_LABELS[categoryCode]} 스펙` : base.name,
    templateVersion: 1,
    sizes,
    poms: baseItems.map((item, displayOrder) => ({ code: item.code, name: item.displayName, displayOrder })),
    valuesCm,
  };
}

export function getWaflBasicSpecTemplate(
  categoryCode: WorkOrderMajorCategoryCode | null,
  itemCode: string | null = null,
  targetAudience: WaflBasicSpecTargetAudience | null = null,
): WaflBasicSpecTemplate | null {
  void itemCode; // Legacy call compatibility; numeric starter identity no longer depends on detail item.
  return isBasicCategory(categoryCode) ? createTemplate(categoryCode, targetAudience) : null;
}

export function findWaflBasicSpecTemplateById(templateId: string): WaflBasicSpecTemplate | null {
  const legacyCategory = (Object.entries(LEGACY_TEMPLATE_IDS).find(([, id]) => id === templateId)?.[0] ?? null) as WorkOrderMajorCategoryCode | null;
  if (isBasicCategory(legacyCategory)) return createTemplate(legacyCategory, null);
  for (const targetAudience of ["여성", "남성"] as const) {
    const categoryCode = (Object.entries(TARGET_TEMPLATE_IDS[targetAudience]).find(([, id]) => id === templateId)?.[0] ?? null) as WorkOrderMajorCategoryCode | null;
    if (isBasicCategory(categoryCode)) return createTemplate(categoryCode, targetAudience);
  }
  return null;
}

export function waflBasicSpecTemplateNameById(templateId: string | null): string | null {
  return templateId ? findWaflBasicSpecTemplateById(templateId)?.name ?? null : null;
}

export function projectWaflBasicSpecValues(template: WaflBasicSpecTemplate, selectedSizes: readonly string[]): Readonly<Record<string, Readonly<Record<string, number>>>> {
  const selected = new Set(selectedSizes.map((size) => size.trim().toUpperCase()));
  return Object.fromEntries(Object.entries(template.valuesCm).filter(([size]) => selected.has(size.toUpperCase())));
}

export const WAFL_BASIC_SPEC_V1_VERSION = SEED.version;
export const WAFL_BASIC_FIT_SEED_V01_VERSION = BASIC_FIT_SEED.version;
export const WAFL_BASIC_SPEC_V1_TEMPLATE_IDS = LEGACY_TEMPLATE_IDS;
export const WAFL_BASIC_SPEC_V1_TARGET_TEMPLATE_IDS = TARGET_TEMPLATE_IDS;
