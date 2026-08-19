import type { WorkOrderMajorCategoryCode } from "@/domain/workOrderCategoryPolicy";
import type { WaflGarmentViewSide } from "./staticGarmentAssetDefinitions";

export type WaflDiagramPoint = readonly [x: number, y: number];

export type WaflDiagramLabel = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

export type WaflDiagramSegment = readonly [from: WaflDiagramPoint, to: WaflDiagramPoint];

export type WaflSpecMeasurementGuide = {
  readonly specKey: string;
  readonly code: string;
  readonly displayName: string;
  /** Stable authored side owner within the category's front/back technical-flat pair. */
  readonly side: WaflGarmentViewSide;
  /** Deliberately authored apparel measurement path. Never generated from label position. */
  readonly measurementPoints: readonly WaflDiagramPoint[];
  /** Deliberately authored short rail connector. Empty means the label sits on the measurement. */
  readonly connectorPoints: readonly WaflDiagramPoint[];
  readonly extensionLines: readonly WaflDiagramSegment[];
  readonly label: WaflDiagramLabel;
  readonly lineStyle: "solid" | "dashed";
};

export type WaflSpecMeasurementDiagramDefinition = {
  readonly categoryCode: "T" | "B" | "O" | "D";
  readonly categoryLabel: string;
  readonly viewBox: "0 0 360 280";
  readonly guides: readonly WaflSpecMeasurementGuide[];
};

const L = (x: number, y: number, width = 68, height = 17): WaflDiagramLabel => ({ x, y, width, height });
const S = (from: WaflDiagramPoint, to: WaflDiagramPoint): WaflDiagramSegment => [from, to];

/**
 * Product-authored side routing. The stable system key, not translated display copy,
 * owns whether its one focused explanation belongs to the front or back view.
 */
export const WAFL_SPEC_MEASUREMENT_SIDE_BY_KEY: Readonly<Record<string, WaflGarmentViewSide>> = {
  "T:body_length": "front", "T:front_length": "front", "T:back_length": "back", "T:shoulder_width": "back",
  "T:chest_width": "front", "T:waist_width": "front", "T:hem_width": "front", "T:armhole_depth": "front",
  "T:sleeve_length": "back", "T:upper_arm_width": "front", "T:cuff_width": "front", "T:neck_width": "front",
  "T:front_neck_depth": "front", "T:back_neck_depth": "back",
  "B:body_length": "front", "B:waist_width": "front", "B:hip_width": "front", "B:front_rise": "front",
  "B:back_rise": "back", "B:thigh_width": "front", "B:knee_width": "front", "B:hem_width": "front",
  "B:inseam": "front", "B:outseam": "front", "B:waistband_height": "front",
  "O:body_length": "front", "O:front_length": "front", "O:back_length": "back", "O:shoulder_width": "back",
  "O:across_back": "back", "O:chest_width": "front", "O:waist_width": "front", "O:hem_width": "front",
  "O:armhole_depth": "front", "O:sleeve_length": "back", "O:upper_arm_width": "front", "O:cuff_width": "front",
  "O:neck_width": "front", "O:lapel_width": "front", "O:vent_length": "back",
  "D:body_length": "front", "D:front_length": "front", "D:back_length": "back", "D:shoulder_width": "back",
  "D:chest_width": "front", "D:waist_width": "front", "D:hip_width": "front", "D:hem_width": "front",
  "D:armhole_depth": "front", "D:sleeve_length": "back", "D:upper_arm_width": "front", "D:cuff_width": "front",
  "D:neck_width": "front", "D:front_neck_depth": "front", "D:back_neck_depth": "back",
} as const;

const projectPoint = (side: WaflGarmentViewSide, [x, y]: WaflDiagramPoint): WaflDiagramPoint => [
  (side === "front" ? 14 : 194) + x * 0.42,
  12 + y * 0.7,
];

function guide(
  categoryCode: WaflSpecMeasurementDiagramDefinition["categoryCode"],
  code: string,
  displayName: string,
  measurementPoints: readonly WaflDiagramPoint[],
  _connectorPoints: readonly WaflDiagramPoint[],
  _label: WaflDiagramLabel,
  extensionLines: readonly WaflDiagramSegment[] = [],
  lineStyle: WaflSpecMeasurementGuide["lineStyle"] = "dashed",
): WaflSpecMeasurementGuide {
  const specKey = `${categoryCode}:${code}`;
  const side = WAFL_SPEC_MEASUREMENT_SIDE_BY_KEY[specKey];
  if (!side) throw new Error(`Missing front/back measurement owner: ${specKey}`);
  return {
    specKey,
    code,
    displayName,
    side,
    measurementPoints: measurementPoints.map((point) => projectPoint(side, point)),
    connectorPoints: [],
    extensionLines: extensionLines.map(([from, to]) => [projectPoint(side, from), projectPoint(side, to)]),
    label: { x: side === "front" ? 48 : 244, y: 260, width: 68, height: 17 },
    lineStyle,
  };
}

// Every category owns its label rails and measurement routing. These paths intentionally
// avoid label-to-measurement auto-layout so the technical flat never becomes a graph mesh.
const UPPER_GUIDES = [
  guide("T", "body_length", "총장", [[88, 78], [88, 294]], [[88, 190], [73, 190]], L(3, 181), [S([88, 78], [124, 78]), S([88, 294], [116, 294])], "solid"),
  guide("T", "front_length", "앞길이", [[158, 70], [158, 292]], [[158, 292], [126, 316]], L(91, 316), [], "solid"),
  guide("T", "back_length", "뒷길이", [[202, 70], [202, 292]], [[202, 292], [200, 316]], L(165, 316)),
  guide("T", "shoulder_width", "어깨너비", [[124, 80], [236, 80]], [[124, 80], [88, 65], [73, 65]], L(3, 57), [], "solid"),
  guide("T", "chest_width", "가슴단면", [[114, 145], [246, 145]], [[114, 145], [82, 126], [73, 126]], L(3, 118), [], "solid"),
  guide("T", "waist_width", "허리단면", [[122, 211], [238, 211]], [[122, 211], [82, 155], [73, 155]], L(3, 147)),
  guide("T", "hem_width", "밑단단면", [[116, 292], [244, 292]], [[244, 292], [270, 316]], L(239, 316), [], "solid"),
  guide("T", "armhole_depth", "암홀", [[116, 92], [116, 151]], [[116, 123], [83, 96], [73, 96]], L(3, 88)),
  guide("T", "sleeve_length", "소매길이", [[236, 80], [260, 109], [293, 247]], [[272, 157], [287, 157]], L(289, 149), [], "solid"),
  guide("T", "upper_arm_width", "소매통", [[244, 119], [270, 113]], [[270, 113], [287, 117]], L(289, 109)),
  guide("T", "cuff_width", "소매단", [[277, 243], [299, 238]], [[299, 238], [306, 196], [287, 196]], L(289, 188), [], "solid"),
  guide("T", "neck_width", "목너비", [[151, 66], [209, 66]], [[180, 66], [108, 25]], L(74, 8), [], "solid"),
  guide("T", "front_neck_depth", "앞목깊이", [[180, 66], [180, 101]], [[180, 66], [180, 25]], L(146, 8)),
  guide("T", "back_neck_depth", "뒷목깊이", [[196, 66], [196, 84]], [[196, 66], [252, 25]], L(218, 8)),
] as const;

const LOWER_GUIDES = [
  guide("B", "body_length", "총장", [[98, 64], [98, 309]], [[98, 181], [73, 181]], L(3, 172), [S([98, 64], [128, 64]), S([98, 309], [106, 309])], "solid"),
  guide("B", "waist_width", "허리단면", [[128, 64], [232, 64]], [[180, 64], [180, 25]], L(146, 8), [], "solid"),
  guide("B", "hip_width", "힙단면", [[118, 125], [242, 125]], [[242, 125], [274, 125], [274, 62], [287, 62]], L(289, 54), [], "solid"),
  guide("B", "front_rise", "앞밑위", [[173, 64], [173, 157]], [[173, 116], [82, 75], [73, 75]], L(3, 67)),
  guide("B", "back_rise", "뒷밑위", [[188, 64], [188, 164]], [[188, 142], [82, 113], [73, 113]], L(3, 105)),
  guide("B", "thigh_width", "허벅지단면", [[188, 171], [234, 171]], [[234, 171], [274, 171], [274, 100], [287, 100]], L(289, 92)),
  guide("B", "knee_width", "무릎단면", [[196, 228], [244, 228]], [[244, 228], [278, 228], [278, 143], [287, 143]], L(289, 135)),
  guide("B", "hem_width", "밑단단면", [[204, 309], [254, 309]], [[254, 309], [282, 309], [282, 190], [287, 190]], L(289, 182), [], "solid"),
  guide("B", "inseam", "인심", [[180, 162], [160, 309]], [[160, 309], [180, 322]], L(146, 320), [], "solid"),
  guide("B", "outseam", "아웃심", [[128, 58], [106, 309]], [[112, 224], [82, 225], [73, 225]], L(3, 217), [], "solid"),
  guide("B", "waistband_height", "허리벨트높이", [[224, 57], [224, 74]], [[224, 70], [282, 70], [282, 237], [287, 237]], L(289, 229)),
] as const;

const OUTER_GUIDES = [
  guide("O", "body_length", "총장", [[88, 64], [88, 306]], [[88, 184], [73, 184]], L(3, 176), [S([88, 64], [122, 64]), S([88, 306], [116, 306])], "solid"),
  guide("O", "front_length", "앞길이", [[154, 64], [154, 305]], [[154, 305], [108, 320]], L(74, 320), [], "solid"),
  guide("O", "back_length", "뒷길이", [[205, 64], [205, 305]], [[205, 305], [252, 320]], L(218, 320)),
  guide("O", "shoulder_width", "어깨너비", [[122, 83], [238, 83]], [[238, 83], [287, 62]], L(289, 54), [], "solid"),
  guide("O", "across_back", "등너비", [[132, 113], [228, 113]], [[132, 113], [98, 101], [73, 101]], L(3, 93)),
  guide("O", "chest_width", "가슴단면", [[114, 145], [246, 145]], [[114, 145], [82, 133], [73, 133]], L(3, 125), [], "solid"),
  guide("O", "waist_width", "허리단면", [[121, 215], [239, 215]], [[121, 215], [82, 218], [73, 218]], L(3, 210)),
  guide("O", "hem_width", "밑단단면", [[116, 305], [244, 305]], [[116, 305], [82, 262], [73, 262]], L(3, 254), [], "solid"),
  guide("O", "armhole_depth", "암홀", [[242, 94], [242, 160]], [[242, 126], [278, 126], [278, 94], [287, 94]], L(289, 86)),
  guide("O", "sleeve_length", "소매길이", [[238, 83], [264, 112], [300, 264]], [[275, 158], [287, 139]], L(289, 131), [], "solid"),
  guide("O", "upper_arm_width", "소매통", [[247, 121], [274, 115]], [[274, 115], [280, 176], [287, 176]], L(289, 168)),
  guide("O", "cuff_width", "소매단", [[284, 259], [306, 254]], [[306, 254], [306, 214], [287, 214]], L(289, 206), [], "solid"),
  guide("O", "neck_width", "목너비", [[153, 61], [207, 61]], [[180, 61], [108, 25]], L(74, 8), [], "solid"),
  guide("O", "lapel_width", "라펠너비", [[179, 88], [214, 132]], [[197, 110], [180, 25]], L(146, 8), [], "solid"),
  guide("O", "vent_length", "트임길이", [[180, 253], [180, 305]], [[180, 305], [180, 320]], L(146, 320)),
] as const;

const DRESS_GUIDES = [
  guide("D", "body_length", "총장", [[88, 54], [88, 316]], [[88, 190], [73, 190]], L(3, 182), [S([88, 54], [126, 54]), S([88, 316], [96, 316])], "solid"),
  guide("D", "front_length", "앞길이", [[158, 52], [158, 315]], [[158, 315], [108, 320]], L(74, 320), [], "solid"),
  guide("D", "back_length", "뒷길이", [[202, 52], [202, 315]], [[202, 315], [252, 320]], L(218, 320)),
  guide("D", "shoulder_width", "어깨너비", [[126, 75], [234, 75]], [[234, 75], [287, 62]], L(289, 54), [], "solid"),
  guide("D", "chest_width", "가슴단면", [[118, 127], [242, 127]], [[118, 127], [82, 95], [73, 95]], L(3, 87), [], "solid"),
  guide("D", "waist_width", "허리단면", [[136, 184], [224, 184]], [[136, 184], [82, 128], [73, 128]], L(3, 120)),
  guide("D", "hip_width", "힙단면", [[119, 230], [241, 230]], [[119, 230], [82, 226], [73, 226]], L(3, 218)),
  guide("D", "hem_width", "밑단단면", [[96, 315], [264, 315]], [[96, 315], [82, 265], [73, 265]], L(3, 257), [], "solid"),
  guide("D", "armhole_depth", "암홀", [[240, 88], [240, 145]], [[240, 116], [278, 116], [278, 96], [287, 96]], L(289, 88)),
  guide("D", "sleeve_length", "소매길이", [[234, 75], [258, 104], [293, 247]], [[270, 155], [287, 137]], L(289, 129), [], "solid"),
  guide("D", "upper_arm_width", "소매통", [[243, 117], [269, 111]], [[269, 111], [280, 176], [287, 176]], L(289, 168)),
  guide("D", "cuff_width", "소매단", [[277, 243], [299, 238]], [[299, 238], [305, 214], [287, 214]], L(289, 206), [], "solid"),
  guide("D", "neck_width", "목너비", [[155, 50], [205, 50]], [[180, 50], [108, 25]], L(74, 8), [], "solid"),
  guide("D", "front_neck_depth", "앞목깊이", [[180, 50], [180, 83]], [[180, 50], [180, 25]], L(146, 8)),
  guide("D", "back_neck_depth", "뒷목깊이", [[195, 50], [195, 68]], [[195, 50], [252, 25]], L(218, 8)),
] as const;

export const WAFL_SPEC_MEASUREMENT_DIAGRAMS: Readonly<Partial<Record<WorkOrderMajorCategoryCode, WaflSpecMeasurementDiagramDefinition>>> = {
  T: {
    categoryCode: "T", categoryLabel: "상의", viewBox: "0 0 360 280",
    guides: UPPER_GUIDES,
  },
  B: {
    categoryCode: "B", categoryLabel: "하의", viewBox: "0 0 360 280",
    guides: LOWER_GUIDES,
  },
  O: {
    categoryCode: "O", categoryLabel: "아우터", viewBox: "0 0 360 280",
    guides: OUTER_GUIDES,
  },
  D: {
    categoryCode: "D", categoryLabel: "원피스", viewBox: "0 0 360 280",
    guides: DRESS_GUIDES,
  },
} as const;

export function getWaflSpecMeasurementDiagram(categoryCode: WorkOrderMajorCategoryCode | null) {
  return categoryCode ? WAFL_SPEC_MEASUREMENT_DIAGRAMS[categoryCode] ?? null : null;
}
