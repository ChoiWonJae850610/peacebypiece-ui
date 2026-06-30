export const SYSTEM_CATALOG_VERSION_CODE = "wafl-system-catalog-2026-0.24.27";

export type SystemCatalogDomain = "apparel" | "underwear" | "accessory";

export type SystemCatalogCategorySeed = {
  code: string;
  parentCode: string | null;
  depth: 1 | 2 | 3;
  domain: SystemCatalogDomain;
  displayName: string;
  defaultEnabled: boolean;
  isOptional: boolean;
  sortOrder: number;
};

export type SystemSizeSetSeed = {
  code: string;
  displayName: string;
  sortOrder: number;
  options: { code: string; label: string; sortOrder: number }[];
  categoryCodes: string[];
};

export type SystemPomSeed = {
  code: string;
  displayName: string;
  measurementUnit: "cm" | "inch";
  measurementType: "circumference" | "half_flat" | "quarter_pattern_reference" | "length";
  instruction: string;
  sortOrder: number;
  categoryCodes: string[];
};

const apparelEnabled = true;
const optionalDisabled = false;

export const SYSTEM_CATALOG_CATEGORIES: SystemCatalogCategorySeed[] = [
  { code: "apparel.top", parentCode: null, depth: 1, domain: "apparel", displayName: "Top", defaultEnabled: apparelEnabled, isOptional: false, sortOrder: 10 },
  { code: "apparel.top.tshirt", parentCode: "apparel.top", depth: 2, domain: "apparel", displayName: "T-shirt", defaultEnabled: apparelEnabled, isOptional: false, sortOrder: 10 },
  { code: "apparel.top.tshirt.short_sleeve", parentCode: "apparel.top.tshirt", depth: 3, domain: "apparel", displayName: "Short sleeve", defaultEnabled: apparelEnabled, isOptional: false, sortOrder: 10 },
  { code: "apparel.top.shirt_blouse", parentCode: "apparel.top", depth: 2, domain: "apparel", displayName: "Shirt/Blouse", defaultEnabled: apparelEnabled, isOptional: false, sortOrder: 20 },
  { code: "apparel.top.shirt_blouse.blouse", parentCode: "apparel.top.shirt_blouse", depth: 3, domain: "apparel", displayName: "Blouse", defaultEnabled: apparelEnabled, isOptional: false, sortOrder: 10 },
  { code: "apparel.bottom", parentCode: null, depth: 1, domain: "apparel", displayName: "Bottom", defaultEnabled: apparelEnabled, isOptional: false, sortOrder: 20 },
  { code: "apparel.bottom.pants", parentCode: "apparel.bottom", depth: 2, domain: "apparel", displayName: "Pants", defaultEnabled: apparelEnabled, isOptional: false, sortOrder: 10 },
  { code: "apparel.bottom.pants.slacks", parentCode: "apparel.bottom.pants", depth: 3, domain: "apparel", displayName: "Slacks", defaultEnabled: apparelEnabled, isOptional: false, sortOrder: 10 },
  { code: "apparel.outer", parentCode: null, depth: 1, domain: "apparel", displayName: "Outer", defaultEnabled: apparelEnabled, isOptional: false, sortOrder: 30 },
  { code: "apparel.outer.jacket", parentCode: "apparel.outer", depth: 2, domain: "apparel", displayName: "Jacket", defaultEnabled: apparelEnabled, isOptional: false, sortOrder: 10 },
  { code: "apparel.outer.jacket.tailored", parentCode: "apparel.outer.jacket", depth: 3, domain: "apparel", displayName: "Tailored jacket", defaultEnabled: apparelEnabled, isOptional: false, sortOrder: 10 },
  { code: "apparel.onepiece_set", parentCode: null, depth: 1, domain: "apparel", displayName: "One-piece/Set", defaultEnabled: apparelEnabled, isOptional: false, sortOrder: 40 },
  { code: "apparel.onepiece_set.dress", parentCode: "apparel.onepiece_set", depth: 2, domain: "apparel", displayName: "Dress", defaultEnabled: apparelEnabled, isOptional: false, sortOrder: 10 },
  { code: "apparel.onepiece_set.dress.midi", parentCode: "apparel.onepiece_set.dress", depth: 3, domain: "apparel", displayName: "Midi dress", defaultEnabled: apparelEnabled, isOptional: false, sortOrder: 10 },
  { code: "underwear.bra", parentCode: null, depth: 1, domain: "underwear", displayName: "Bra", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 110 },
  { code: "underwear.bra.general", parentCode: "underwear.bra", depth: 2, domain: "underwear", displayName: "General", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 10 },
  { code: "underwear.bra.general.wire", parentCode: "underwear.bra.general", depth: 3, domain: "underwear", displayName: "Wire", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 10 },
  { code: "underwear.panties", parentCode: null, depth: 1, domain: "underwear", displayName: "Panties", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 120 },
  { code: "underwear.panties.women", parentCode: "underwear.panties", depth: 2, domain: "underwear", displayName: "Women", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 10 },
  { code: "underwear.panties.women.brief", parentCode: "underwear.panties.women", depth: 3, domain: "underwear", displayName: "Brief", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 10 },
  { code: "underwear.innerwear", parentCode: null, depth: 1, domain: "underwear", displayName: "Innerwear", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 130 },
  { code: "underwear.innerwear.top", parentCode: "underwear.innerwear", depth: 2, domain: "underwear", displayName: "Top", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 10 },
  { code: "underwear.innerwear.top.camisole", parentCode: "underwear.innerwear.top", depth: 3, domain: "underwear", displayName: "Camisole", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 10 },
  { code: "underwear.sleepwear", parentCode: null, depth: 1, domain: "underwear", displayName: "Sleepwear", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 140 },
  { code: "underwear.sleepwear.set", parentCode: "underwear.sleepwear", depth: 2, domain: "underwear", displayName: "Set", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 10 },
  { code: "underwear.sleepwear.set.pajama", parentCode: "underwear.sleepwear.set", depth: 3, domain: "underwear", displayName: "Pajama", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 10 },
  { code: "accessory.bag", parentCode: null, depth: 1, domain: "accessory", displayName: "Bag", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 210 },
  { code: "accessory.bag.tote", parentCode: "accessory.bag", depth: 2, domain: "accessory", displayName: "Tote", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 10 },
  { code: "accessory.bag.tote.basic", parentCode: "accessory.bag.tote", depth: 3, domain: "accessory", displayName: "Basic tote", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 10 },
  { code: "accessory.hat", parentCode: null, depth: 1, domain: "accessory", displayName: "Hat", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 220 },
  { code: "accessory.hat.cap", parentCode: "accessory.hat", depth: 2, domain: "accessory", displayName: "Cap", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 10 },
  { code: "accessory.hat.cap.basic", parentCode: "accessory.hat.cap", depth: 3, domain: "accessory", displayName: "Basic cap", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 10 },
  { code: "accessory.belt", parentCode: null, depth: 1, domain: "accessory", displayName: "Belt", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 230 },
  { code: "accessory.belt.general", parentCode: "accessory.belt", depth: 2, domain: "accessory", displayName: "General", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 10 },
  { code: "accessory.belt.general.basic", parentCode: "accessory.belt.general", depth: 3, domain: "accessory", displayName: "Basic belt", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 10 },
  { code: "accessory.scarf_muffler", parentCode: null, depth: 1, domain: "accessory", displayName: "Scarf/Muffler", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 240 },
  { code: "accessory.scarf_muffler.scarf", parentCode: "accessory.scarf_muffler", depth: 2, domain: "accessory", displayName: "Scarf", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 10 },
  { code: "accessory.scarf_muffler.scarf.basic", parentCode: "accessory.scarf_muffler.scarf", depth: 3, domain: "accessory", displayName: "Basic scarf", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 10 },
  { code: "accessory.socks_legwear", parentCode: null, depth: 1, domain: "accessory", displayName: "Socks/Legwear", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 250 },
  { code: "accessory.socks_legwear.socks", parentCode: "accessory.socks_legwear", depth: 2, domain: "accessory", displayName: "Socks", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 10 },
  { code: "accessory.socks_legwear.socks.basic", parentCode: "accessory.socks_legwear.socks", depth: 3, domain: "accessory", displayName: "Basic socks", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 10 },
  { code: "accessory.jewelry", parentCode: null, depth: 1, domain: "accessory", displayName: "Jewelry", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 260 },
  { code: "accessory.jewelry.necklace", parentCode: "accessory.jewelry", depth: 2, domain: "accessory", displayName: "Necklace", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 10 },
  { code: "accessory.jewelry.necklace.basic", parentCode: "accessory.jewelry.necklace", depth: 3, domain: "accessory", displayName: "Basic necklace", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 10 },
  { code: "accessory.other", parentCode: null, depth: 1, domain: "accessory", displayName: "Other accessory", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 270 },
  { code: "accessory.other.misc", parentCode: "accessory.other", depth: 2, domain: "accessory", displayName: "Miscellaneous", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 10 },
  { code: "accessory.other.misc.basic", parentCode: "accessory.other.misc", depth: 3, domain: "accessory", displayName: "Basic accessory", defaultEnabled: optionalDisabled, isOptional: true, sortOrder: 10 },
];

export const SYSTEM_SIZE_SETS: SystemSizeSetSeed[] = [
  {
    code: "alpha_xs_xl",
    displayName: "XS-XL",
    sortOrder: 10,
    options: ["XS", "S", "M", "L", "XL"].map((label, index) => ({ code: label.toLowerCase(), label, sortOrder: (index + 1) * 10 })),
    categoryCodes: ["apparel.top", "apparel.bottom", "apparel.outer", "apparel.onepiece_set", "underwear.innerwear", "underwear.sleepwear"],
  },
  {
    code: "women_55_77",
    displayName: "Women 55/66/77",
    sortOrder: 20,
    options: ["55", "66", "77"].map((label, index) => ({ code: `w${label}`, label, sortOrder: (index + 1) * 10 })),
    categoryCodes: ["apparel.top", "apparel.bottom", "apparel.onepiece_set"],
  },
  {
    code: "men_90_105",
    displayName: "Men 90/95/100/105",
    sortOrder: 30,
    options: ["90", "95", "100", "105"].map((label, index) => ({ code: `m${label}`, label, sortOrder: (index + 1) * 10 })),
    categoryCodes: ["apparel.top", "apparel.outer"],
  },
  {
    code: "free",
    displayName: "Free",
    sortOrder: 40,
    options: [{ code: "free", label: "FREE", sortOrder: 10 }],
    categoryCodes: ["accessory.bag", "accessory.hat", "accessory.belt", "accessory.scarf_muffler", "accessory.socks_legwear", "accessory.jewelry", "accessory.other"],
  },
];

export const SYSTEM_POMS: SystemPomSeed[] = [
  { code: "body_length", displayName: "Body length", measurementUnit: "cm", measurementType: "length", instruction: "Measure actual garment length.", sortOrder: 10, categoryCodes: ["apparel.top", "apparel.outer", "apparel.onepiece_set", "underwear.innerwear", "underwear.sleepwear"] },
  { code: "shoulder_width", displayName: "Shoulder width", measurementUnit: "cm", measurementType: "half_flat", instruction: "Measure flat shoulder width.", sortOrder: 20, categoryCodes: ["apparel.top", "apparel.outer"] },
  { code: "chest_width", displayName: "Chest width", measurementUnit: "cm", measurementType: "half_flat", instruction: "Measure finished garment flat chest.", sortOrder: 30, categoryCodes: ["apparel.top", "apparel.outer", "apparel.onepiece_set", "underwear.innerwear"] },
  { code: "waist_width", displayName: "Waist width", measurementUnit: "cm", measurementType: "half_flat", instruction: "Measure finished garment flat waist.", sortOrder: 40, categoryCodes: ["apparel.bottom", "apparel.onepiece_set", "underwear.panties"] },
  { code: "hip_width", displayName: "Hip width", measurementUnit: "cm", measurementType: "half_flat", instruction: "Measure finished garment flat hip.", sortOrder: 50, categoryCodes: ["apparel.bottom", "apparel.onepiece_set", "underwear.panties"] },
  { code: "sleeve_length", displayName: "Sleeve length", measurementUnit: "cm", measurementType: "length", instruction: "Measure actual sleeve length.", sortOrder: 60, categoryCodes: ["apparel.top", "apparel.outer"] },
  { code: "hem_width", displayName: "Hem width", measurementUnit: "cm", measurementType: "half_flat", instruction: "Measure finished garment flat hem.", sortOrder: 70, categoryCodes: ["apparel.top", "apparel.bottom", "apparel.outer", "apparel.onepiece_set"] },
  { code: "head_circumference", displayName: "Head circumference", measurementUnit: "cm", measurementType: "circumference", instruction: "Measure full head circumference for hats.", sortOrder: 80, categoryCodes: ["accessory.hat"] },
  { code: "bag_width", displayName: "Bag width", measurementUnit: "cm", measurementType: "length", instruction: "Measure actual bag width.", sortOrder: 90, categoryCodes: ["accessory.bag"] },
];

export function getSystemCatalogSeedCounts() {
  return {
    categories: SYSTEM_CATALOG_CATEGORIES.length,
    sizeSets: SYSTEM_SIZE_SETS.length,
    sizeOptions: SYSTEM_SIZE_SETS.reduce((sum, set) => sum + set.options.length, 0),
    poms: SYSTEM_POMS.length,
  };
}
