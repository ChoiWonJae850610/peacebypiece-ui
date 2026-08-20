export type ReadinessDestinationIntent = WorkOrderVisibleReadinessSection | "fabric" | "accessory";

const READINESS_SECTION_BY_CODE: Readonly<Record<string, ReadinessDestinationIntent>> = {
  PRODUCT_NAME_REQUIRED: "overview",
  PRODUCT_TYPE_REQUIRED: "overview",
  SEASON_REQUIRED: "overview",
  ITEM_REQUIRED: "overview",
  DUE_DATE_REQUIRED: "overview",
  REPRESENTATIVE_IMAGE_REQUIRED: "media",
  TOTAL_QUANTITY_REQUIRED: "sizes",
  QUANTITY_TOTAL_MISMATCH: "sizes",
  QUANTITY_MEMO_FALLBACK: "sizes",
  MATERIAL_REQUIRED: "fabric",
  ACCESSORY_STATE_REQUIRED: "accessory",
  ACCESSORY_CONFIRM_LATER: "accessory",
  PARTNER_REQUIRED: "production",
  PROCESS_PARTNER_UNASSIGNED: "production",
  NO_INCLUDED_ATTACHMENT: "output",
};

export const WORK_ORDER_SECTION_LABELS: Readonly<Record<WorkOrderVisibleReadinessSection, string>> = {
  overview: "개요",
  media: "이미지·첨부",
  sizes: "사이즈·색상",
  materials: "원부자재",
  production: "제작",
  output: "문서",
};

export type WorkOrderVisibleReadinessSection = "overview" | "media" | "sizes" | "materials" | "production" | "output";

export function resolveReadinessIssueDestination(code: string): {
  readonly intent: ReadinessDestinationIntent;
  readonly section: WorkOrderVisibleReadinessSection;
  readonly label: string;
} | null {
  const intent = READINESS_SECTION_BY_CODE[code];
  if (!intent) return null;
  const section = intent === "fabric" || intent === "accessory" ? "materials" : intent;
  return { intent, section, label: WORK_ORDER_SECTION_LABELS[section] };
}
