import seedJson from "./waflBasicSpecV1Seed.json" with { type: "json" };

import type { WorkOrderMajorCategoryCode } from "../catalog/workOrderCategoryPolicy.ts";

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

const SEED = seedJson as Seed;

const CATEGORY_LABELS: Readonly<Record<"T" | "B" | "O" | "D", keyof Seed["templates"]>> = {
  T: "상의", B: "하의", O: "아우터", D: "원피스",
};

const TEMPLATE_IDS: Readonly<Record<"T" | "B" | "O" | "D", string>> = {
  T: "a6700001-0000-5000-8000-000000000001",
  B: "a6700001-0000-5000-8000-000000000002",
  O: "a6700001-0000-5000-8000-000000000003",
  D: "a6700001-0000-5000-8000-000000000004",
};

const POM_CODES: Readonly<Record<string, string>> = {
  "총장": "body_length", "앞길이": "front_length", "뒷길이": "back_length", "어깨너비": "shoulder_width",
  "가슴단면": "chest_width", "허리단면": "waist_width", "힙단면": "hip_width", "밑단단면": "hem_width",
  "암홀": "armhole_depth", "소매길이": "sleeve_length", "화장": "sleeve_reach", "소매통": "upper_arm_width",
  "소매단": "cuff_width", "목너비": "neck_width", "앞목깊이": "front_neck_depth", "뒷목깊이": "back_neck_depth",
  "등너비": "across_back", "앞밑위": "front_rise", "뒷밑위": "back_rise", "허벅지단면": "thigh_width",
  "무릎단면": "knee_width", "인심": "inseam", "아웃심": "outseam", "허리선높이": "waistline_height",
  "카라높이": "collar_height", "카라너비": "collar_width", "앞여밈폭": "front_placket_width", "후드높이": "hood_height",
  "후드폭": "hood_width", "지퍼길이": "zipper_length",
};

export type WaflBasicSpecPom = { readonly code: string; readonly name: string; readonly displayOrder: number };
export type WaflBasicSpecTemplate = {
  readonly id: string;
  readonly categoryCode: "T" | "B" | "O" | "D";
  readonly name: string;
  readonly templateVersion: 1;
  readonly sizes: readonly string[];
  readonly poms: readonly WaflBasicSpecPom[];
  readonly valuesCm: Readonly<Record<string, Readonly<Record<string, number>>>>;
};

function isBasicCategory(code: WorkOrderMajorCategoryCode | null): code is "T" | "B" | "O" | "D" {
  return code === "T" || code === "B" || code === "O" || code === "D";
}

function addonNames(itemCode: string | null): readonly string[] {
  const item = itemCode?.trim() ?? "";
  if (["셔츠", "블라우스", "폴로"].includes(item)) return SEED.providedPomAddons["셔츠/블라우스/폴로"].poms;
  if (item === "후드") return SEED.providedPomAddons["후드"].poms;
  if (["재킷", "코트"].includes(item)) return SEED.providedPomAddons["재킷/코트"].poms;
  if (["점퍼", "패딩"].includes(item)) return SEED.providedPomAddons["점퍼/패딩"].poms;
  return [];
}

export function getWaflBasicSpecTemplate(categoryCode: WorkOrderMajorCategoryCode | null, itemCode: string | null = null): WaflBasicSpecTemplate | null {
  if (!isBasicCategory(categoryCode)) return null;
  const base = SEED.templates[CATEGORY_LABELS[categoryCode]];
  const names = [...base.poms, ...addonNames(itemCode)].filter((name, index, all) => all.indexOf(name) === index);
  const valuesCm = Object.fromEntries(SEED.sizeLabels.map((size) => {
    const baseValues = base.valuesCm[size] ?? {};
    const values: Record<string, number> = { ...baseValues };
    for (const name of addonNames(itemCode)) {
      if (name === "지퍼길이") values[name] = Math.max(0, (baseValues["총장"] ?? 0) - 5);
      else {
        const group = ["셔츠", "블라우스", "폴로"].includes(itemCode ?? "") ? "셔츠/블라우스/폴로"
          : ["재킷", "코트"].includes(itemCode ?? "") ? "재킷/코트" : "후드";
        const candidate = SEED.providedPomAddons[group]?.defaultsCm[name];
        if (typeof candidate === "number") values[name] = candidate;
      }
    }
    return [size, values];
  }));
  return {
    id: TEMPLATE_IDS[categoryCode], categoryCode, name: base.name, templateVersion: 1,
    sizes: SEED.sizeLabels,
    poms: names.map((name, displayOrder) => ({ code: POM_CODES[name], name, displayOrder })),
    valuesCm,
  };
}

export function findWaflBasicSpecTemplateById(templateId: string, itemCode: string | null = null): WaflBasicSpecTemplate | null {
  const category = (Object.entries(TEMPLATE_IDS).find(([, id]) => id === templateId)?.[0] ?? null) as WorkOrderMajorCategoryCode | null;
  return getWaflBasicSpecTemplate(category, itemCode);
}

export function waflBasicSpecTemplateNameById(templateId: string | null): string | null {
  return templateId ? findWaflBasicSpecTemplateById(templateId)?.name ?? null : null;
}

export function projectWaflBasicSpecValues(template: WaflBasicSpecTemplate, selectedSizes: readonly string[]): Readonly<Record<string, Readonly<Record<string, number>>>> {
  const selected = new Set(selectedSizes.map((size) => size.trim().toUpperCase()));
  return Object.fromEntries(Object.entries(template.valuesCm).filter(([size]) => selected.has(size.toUpperCase())));
}

export const WAFL_BASIC_SPEC_V1_VERSION = SEED.version;
export const WAFL_BASIC_SPEC_V1_TEMPLATE_IDS = TEMPLATE_IDS;
