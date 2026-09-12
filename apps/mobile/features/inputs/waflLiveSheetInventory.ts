import type { WaflSheetSizing } from "@/domain/waflSheetDetentPolicy";

export type WaflLiveSheetClassification = "STATIC_BOTTOM_SHEET" | "STATIC_BOTTOM_SHEET_SCROLLABLE" | "STATIC_REEL_PICKER" | "CENTER_DIALOG_CANDIDATE" | "FULLSCREEN_KEEP" | "SPECIAL_FIXED_MODAL_KEEP";
export type WaflLiveSheetPhysicalState = "OWNER_PHASE2_PASS" | "AUTOMATED_ONLY" | "NOT_TESTED_PHASE3";

export type WaflLiveSheetInventoryEntry = {
  readonly surface: string;
  readonly owner: string;
  readonly root: "WaflInputSheet" | "WaflReelPickerSheet" | "WaflDecisionSheet" | "InlineDatePicker" | "NativeFullscreenModal";
  readonly sizing: WaflSheetSizing | "calendar-fixed" | "fullscreen-fixed";
  readonly classification: WaflLiveSheetClassification;
  readonly nested: boolean;
  readonly keyboardText: boolean;
  readonly actions: "X/V" | "explicit-create" | "decision" | "calendar-actions" | "viewer-close";
  readonly physicalPolicy: string;
  readonly physicalState: WaflLiveSheetPhysicalState;
};

export const WAFL_PRESENTATION_SOURCE_COUNTS = {
  decisionCallsites: 3,
  inlineDatePickerCallsites: 1,
  pairedReelCallsites: 1,
  rawNativeModalHosts: 8,
  reelPickerCallsites: 8,
  waflInputSheetJsxInstances: 26,
} as const;

const STATIC_ROOT = "fixed header and derived root geometry; content movement belongs to the body; completion never requires drag";
const REEL_ROOT = "derived static root; wheel/haptics belong only to the Reel body; X/V remain stable";
const DECISION_ROOT = "current shared Decision compatibility presentation; centered dialog remains a candidate only";
const FULLSCREEN_ROOT = "validated fullscreen interaction owner; outside common Static Sheet root semantics";

// Product-facing logical inventory. Equivalent route variants are grouped only
// when they share the same component, presentation owner, and action semantics.
// WAFL_PRESENTATION_SOURCE_COUNTS separately locks every JSX/native host count.
export const WAFL_LIVE_SHEET_INVENTORY: readonly WaflLiveSheetInventoryEntry[] = [
  { surface: "새 레시피", owner: "features/work-orders/create/WorkOrderCreateSheet.tsx", root: "WaflInputSheet", sizing: "adaptiveExpandable", classification: "STATIC_BOTTOM_SHEET", nested: false, keyboardText: true, actions: "X/V", physicalPolicy: STATIC_ROOT, physicalState: "OWNER_PHASE2_PASS" },
  { surface: "스케치 텍스트 추가", owner: "features/work-orders/drawing/WorkOrderSketchEditor.tsx", root: "WaflInputSheet", sizing: "adaptiveExpandable", classification: "STATIC_BOTTOM_SHEET", nested: true, keyboardText: true, actions: "explicit-create", physicalPolicy: STATIC_ROOT, physicalState: "OWNER_PHASE2_PASS" },
  { surface: "시즌 직접입력", owner: "features/work-orders/overview/WorkOrderOverviewPickerSheets.tsx", root: "WaflInputSheet", sizing: "adaptiveExpandable", classification: "STATIC_BOTTOM_SHEET", nested: true, keyboardText: true, actions: "X/V", physicalPolicy: STATIC_ROOT, physicalState: "AUTOMATED_ONLY" },
  { surface: "세부 품목 직접입력", owner: "features/work-orders/overview/WorkOrderOverviewPickerSheets.tsx", root: "WaflInputSheet", sizing: "adaptiveExpandable", classification: "STATIC_BOTTOM_SHEET", nested: true, keyboardText: true, actions: "X/V", physicalPolicy: STATIC_ROOT, physicalState: "AUTOMATED_ONLY" },
  { surface: "직접 사이즈 만들기", owner: "features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx", root: "WaflInputSheet", sizing: "adaptiveExpandable", classification: "STATIC_BOTTOM_SHEET", nested: true, keyboardText: true, actions: "explicit-create", physicalPolicy: STATIC_ROOT, physicalState: "OWNER_PHASE2_PASS" },
  { surface: "직접 스펙 만들기/이름 관리", owner: "features/work-orders/size-color/SpecItemSelectionSheet.tsx", root: "WaflInputSheet", sizing: "adaptiveExpandable", classification: "STATIC_BOTTOM_SHEET", nested: true, keyboardText: true, actions: "explicit-create", physicalPolicy: STATIC_ROOT, physicalState: "OWNER_PHASE2_PASS" },
  { surface: "리오더 만들기", owner: "features/work-orders/reorder/WorkOrderReorderSheets.tsx", root: "WaflInputSheet", sizing: "adaptiveExpandable", classification: "STATIC_BOTTOM_SHEET", nested: false, keyboardText: false, actions: "X/V", physicalPolicy: STATIC_ROOT, physicalState: "NOT_TESTED_PHASE3" },

  { surface: "레시피 구분 필터", owner: "features/work-orders/list/WorkOrderListScreen.tsx", root: "WaflInputSheet", sizing: "adaptiveExpandable", classification: "STATIC_BOTTOM_SHEET_SCROLLABLE", nested: false, keyboardText: false, actions: "X/V", physicalPolicy: STATIC_ROOT, physicalState: "NOT_TESTED_PHASE3" },
  { surface: "작업 이력", owner: "features/work-orders/reorder/WorkOrderReorderSheets.tsx", root: "WaflInputSheet", sizing: "adaptiveExpandable", classification: "STATIC_BOTTOM_SHEET_SCROLLABLE", nested: false, keyboardText: false, actions: "X/V", physicalPolicy: STATIC_ROOT, physicalState: "NOT_TESTED_PHASE3" },
  { surface: "스펙 불러오기", owner: "features/work-orders/size-color/MeasurementTemplateSheets.tsx", root: "WaflInputSheet", sizing: "adaptiveExpandable", classification: "STATIC_BOTTOM_SHEET_SCROLLABLE", nested: false, keyboardText: false, actions: "X/V", physicalPolicy: STATIC_ROOT, physicalState: "NOT_TESTED_PHASE3" },
  { surface: "스펙 저장/업데이트", owner: "features/work-orders/size-color/MeasurementTemplateSheets.tsx", root: "WaflInputSheet", sizing: "adaptiveExpandable", classification: "STATIC_BOTTOM_SHEET_SCROLLABLE", nested: false, keyboardText: true, actions: "X/V", physicalPolicy: STATIC_ROOT, physicalState: "AUTOMATED_ONLY" },
  { surface: "발행 전 확인", owner: "features/work-orders/overview/WorkOrderDetailOverview.tsx", root: "WaflInputSheet", sizing: "adaptiveExpandable", classification: "STATIC_BOTTOM_SHEET_SCROLLABLE", nested: false, keyboardText: false, actions: "X/V", physicalPolicy: STATIC_ROOT, physicalState: "NOT_TESTED_PHASE3" },
  { surface: "원단/부자재 추가", owner: "features/work-orders/overview/WorkOrderDetailOverview.tsx", root: "WaflInputSheet", sizing: "expandable", classification: "STATIC_BOTTOM_SHEET_SCROLLABLE", nested: false, keyboardText: true, actions: "X/V", physicalPolicy: STATIC_ROOT, physicalState: "AUTOMATED_ONLY" },
  { surface: "주소 검색", owner: "features/work-orders/documents/QuickDeliveryAddressSearchSheet.tsx", root: "WaflInputSheet", sizing: "expandable", classification: "STATIC_BOTTOM_SHEET_SCROLLABLE", nested: true, keyboardText: true, actions: "X/V", physicalPolicy: STATIC_ROOT, physicalState: "AUTOMATED_ONLY" },
  { surface: "스펙 항목 선택", owner: "features/work-orders/size-color/SpecItemSelectionSheet.tsx", root: "WaflInputSheet", sizing: "expandable", classification: "STATIC_BOTTOM_SHEET_SCROLLABLE", nested: true, keyboardText: false, actions: "X/V", physicalPolicy: STATIC_ROOT, physicalState: "NOT_TESTED_PHASE3" },
  { surface: "퀵 출발지/도착지 직접 입력", owner: "features/work-orders/documents/QuickDeliveryFoundation.tsx", root: "WaflInputSheet", sizing: "expandable", classification: "STATIC_BOTTOM_SHEET_SCROLLABLE", nested: true, keyboardText: true, actions: "X/V", physicalPolicy: STATIC_ROOT, physicalState: "OWNER_PHASE2_PASS" },
  { surface: "퀵 전달 요청 미리보기", owner: "features/work-orders/documents/QuickDeliveryFoundation.tsx", root: "WaflInputSheet", sizing: "adaptiveExpandable", classification: "STATIC_BOTTOM_SHEET_SCROLLABLE", nested: true, keyboardText: false, actions: "X/V", physicalPolicy: STATIC_ROOT, physicalState: "NOT_TESTED_PHASE3" },
  { surface: "퀵 전달 편집", owner: "features/work-orders/documents/WorkOrderDocumentWorkbench.tsx", root: "WaflInputSheet", sizing: "expandable", classification: "STATIC_BOTTOM_SHEET_SCROLLABLE", nested: false, keyboardText: true, actions: "X/V", physicalPolicy: STATIC_ROOT, physicalState: "OWNER_PHASE2_PASS" },
  { surface: "문서에 포함할 첨부", owner: "features/work-orders/documents/WorkOrderDocumentWorkbench.tsx", root: "WaflInputSheet", sizing: "expandable", classification: "STATIC_BOTTOM_SHEET_SCROLLABLE", nested: false, keyboardText: false, actions: "X/V", physicalPolicy: STATIC_ROOT, physicalState: "NOT_TESTED_PHASE3" },
  { surface: "사이즈·색상별 수량", owner: "features/work-orders/documents/WorkOrderDocumentWorkbench.tsx", root: "WaflInputSheet", sizing: "expandable", classification: "STATIC_BOTTOM_SHEET_SCROLLABLE", nested: false, keyboardText: false, actions: "X/V", physicalPolicy: STATIC_ROOT, physicalState: "NOT_TESTED_PHASE3" },
  { surface: "색상/사이즈/완성 스펙 전체보기", owner: "features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx", root: "WaflInputSheet", sizing: "fullView", classification: "STATIC_BOTTOM_SHEET_SCROLLABLE", nested: false, keyboardText: true, actions: "X/V", physicalPolicy: STATIC_ROOT, physicalState: "NOT_TESTED_PHASE3" },
  { surface: "사이즈 선택", owner: "features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx", root: "WaflInputSheet", sizing: "expandable", classification: "STATIC_BOTTOM_SHEET_SCROLLABLE", nested: true, keyboardText: false, actions: "X/V", physicalPolicy: STATIC_ROOT, physicalState: "NOT_TESTED_PHASE3" },
  { surface: "색상 선택", owner: "features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx", root: "WaflInputSheet", sizing: "expandable", classification: "STATIC_BOTTOM_SHEET_SCROLLABLE", nested: true, keyboardText: false, actions: "X/V", physicalPolicy: STATIC_ROOT, physicalState: "NOT_TESTED_PHASE3" },
  { surface: "직접 색상 만들기", owner: "features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx", root: "WaflInputSheet", sizing: "adaptiveExpandable", classification: "STATIC_BOTTOM_SHEET_SCROLLABLE", nested: true, keyboardText: true, actions: "explicit-create", physicalPolicy: STATIC_ROOT, physicalState: "AUTOMATED_ONLY" },

  { surface: "대상 PICK", owner: "features/work-orders/overview/WorkOrderDetailOverview.tsx", root: "WaflReelPickerSheet", sizing: "reelAdaptive", classification: "STATIC_REEL_PICKER", nested: false, keyboardText: false, actions: "X/V", physicalPolicy: REEL_ROOT, physicalState: "NOT_TESTED_PHASE3" },
  { surface: "대분류 PICK", owner: "features/work-orders/overview/WorkOrderDetailOverview.tsx", root: "WaflReelPickerSheet", sizing: "reelAdaptive", classification: "STATIC_REEL_PICKER", nested: false, keyboardText: false, actions: "X/V", physicalPolicy: REEL_ROOT, physicalState: "NOT_TESTED_PHASE3" },
  { surface: "세부 품목 PICK", owner: "features/work-orders/overview/WorkOrderOverviewPickerSheets.tsx", root: "WaflReelPickerSheet", sizing: "reelAdaptive", classification: "STATIC_REEL_PICKER", nested: true, keyboardText: false, actions: "X/V", physicalPolicy: REEL_ROOT, physicalState: "AUTOMATED_ONLY" },
  { surface: "시즌 paired PICK", owner: "features/work-orders/overview/WorkOrderOverviewPickerSheets.tsx", root: "WaflReelPickerSheet", sizing: "reelAdaptive", classification: "STATIC_REEL_PICKER", nested: true, keyboardText: false, actions: "X/V", physicalPolicy: REEL_ROOT, physicalState: "AUTOMATED_ONLY" },
  { surface: "신규 원부자재 단위/수량/로스 PICK", owner: "features/materials/WorkOrderMaterialEditor.tsx", root: "WaflReelPickerSheet", sizing: "reelAdaptive", classification: "STATIC_REEL_PICKER", nested: true, keyboardText: true, actions: "X/V", physicalPolicy: REEL_ROOT, physicalState: "NOT_TESTED_PHASE3" },
  { surface: "저장 원부자재 단위/수량/로스 PICK", owner: "features/materials/WorkOrderMaterialsReadOnly.tsx", root: "WaflReelPickerSheet", sizing: "reelAdaptive", classification: "STATIC_REEL_PICKER", nested: true, keyboardText: true, actions: "X/V", physicalPolicy: REEL_ROOT, physicalState: "NOT_TESTED_PHASE3" },
  { surface: "원부자재/퀵 등록장소 거래처 PICK", owner: "features/materials/MaterialPartnerPickerSheet.tsx", root: "WaflReelPickerSheet", sizing: "reelAdaptive", classification: "STATIC_REEL_PICKER", nested: true, keyboardText: false, actions: "X/V", physicalPolicy: REEL_ROOT, physicalState: "NOT_TESTED_PHASE3" },
  { surface: "제작 공장/공정/거래처 PICK", owner: "features/work-orders/production/WorkOrderProductionAuthoring.tsx", root: "WaflReelPickerSheet", sizing: "reelAdaptive", classification: "STATIC_REEL_PICKER", nested: true, keyboardText: false, actions: "X/V", physicalPolicy: REEL_ROOT, physicalState: "NOT_TESTED_PHASE3" },
  { surface: "완성 스펙 측정 단위 PICK", owner: "features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx", root: "WaflReelPickerSheet", sizing: "reelAdaptive", classification: "STATIC_REEL_PICKER", nested: true, keyboardText: false, actions: "X/V", physicalPolicy: REEL_ROOT, physicalState: "NOT_TESTED_PHASE3" },

  { surface: "전역 destructive/feedback Decision", owner: "features/feedback/WaflFeedbackHost.tsx", root: "WaflDecisionSheet", sizing: "reelAdaptive", classification: "CENTER_DIALOG_CANDIDATE", nested: false, keyboardText: false, actions: "decision", physicalPolicy: DECISION_ROOT, physicalState: "NOT_TESTED_PHASE3" },
  { surface: "레시피 action confirmation", owner: "features/MobileWorkOrderExperience.tsx", root: "WaflDecisionSheet", sizing: "reelAdaptive", classification: "CENTER_DIALOG_CANDIDATE", nested: false, keyboardText: false, actions: "decision", physicalPolicy: DECISION_ROOT, physicalState: "NOT_TESTED_PHASE3" },
  { surface: "스케치 미저장 종료 Decision", owner: "features/work-orders/drawing/WorkOrderSketchEditor.tsx", root: "WaflDecisionSheet", sizing: "reelAdaptive", classification: "CENTER_DIALOG_CANDIDATE", nested: true, keyboardText: false, actions: "decision", physicalPolicy: DECISION_ROOT, physicalState: "NOT_TESTED_PHASE3" },
  { surface: "저장하지 못한 변경 recovery", owner: "features/MobileWorkOrderExperience.tsx", root: "WaflInputSheet", sizing: "contentFit", classification: "CENTER_DIALOG_CANDIDATE", nested: false, keyboardText: false, actions: "decision", physicalPolicy: DECISION_ROOT, physicalState: "NOT_TESTED_PHASE3" },
  { surface: "작업지시서 공유", owner: "features/work-orders/documents/WorkOrderDocumentWorkbench.tsx", root: "WaflInputSheet", sizing: "contentFit", classification: "CENTER_DIALOG_CANDIDATE", nested: false, keyboardText: false, actions: "decision", physicalPolicy: DECISION_ROOT, physicalState: "NOT_TESTED_PHASE3" },

  { surface: "Product Sketch", owner: "features/work-orders/drawing/WorkOrderSketchEditor.tsx", root: "NativeFullscreenModal", sizing: "fullscreen-fixed", classification: "FULLSCREEN_KEEP", nested: false, keyboardText: false, actions: "viewer-close", physicalPolicy: FULLSCREEN_ROOT, physicalState: "OWNER_PHASE2_PASS" },
  { surface: "DEV Drawing renderer PoC", owner: "features/drawing-poc/DrawingRendererPocModal.tsx", root: "NativeFullscreenModal", sizing: "fullscreen-fixed", classification: "FULLSCREEN_KEEP", nested: false, keyboardText: false, actions: "viewer-close", physicalPolicy: FULLSCREEN_ROOT, physicalState: "AUTOMATED_ONLY" },
  { surface: "인증 PDF Viewer", owner: "features/work-orders/documents/WaflAuthenticatedPdfViewer.tsx", root: "NativeFullscreenModal", sizing: "fullscreen-fixed", classification: "FULLSCREEN_KEEP", nested: false, keyboardText: false, actions: "viewer-close", physicalPolicy: FULLSCREEN_ROOT, physicalState: "NOT_TESTED_PHASE3" },
  { surface: "첨부 Viewer", owner: "features/work-orders/images/WaflNativeAttachmentViewer.tsx", root: "NativeFullscreenModal", sizing: "fullscreen-fixed", classification: "FULLSCREEN_KEEP", nested: false, keyboardText: false, actions: "viewer-close", physicalPolicy: FULLSCREEN_ROOT, physicalState: "NOT_TESTED_PHASE3" },
  { surface: "이미지 전체화면 carousel", owner: "features/work-orders/images/WorkOrderImageGallery.tsx", root: "NativeFullscreenModal", sizing: "fullscreen-fixed", classification: "FULLSCREEN_KEEP", nested: false, keyboardText: false, actions: "viewer-close", physicalPolicy: FULLSCREEN_ROOT, physicalState: "NOT_TESTED_PHASE3" },

  { surface: "납기일 달력", owner: "components/InlineDatePicker.tsx", root: "InlineDatePicker", sizing: "calendar-fixed", classification: "SPECIAL_FIXED_MODAL_KEEP", nested: false, keyboardText: false, actions: "calendar-actions", physicalPolicy: "fixed month grid; X/backdrop/back are child-local cancel and preserve unrelated Overview staged values", physicalState: "NOT_TESTED_PHASE3" },
] as const;

export const WAFL_HISTORICAL_SHEET_REFERENCES = [
  "components/InlineEditableFields.tsx",
  "features/production-card/ProductionCardMock.tsx",
] as const;

export const WAFL_DIRECT_INPUT_SHEET_INVENTORY = [
  { surface: "새 레시피 제품명", owner: "features/work-orders/create/WorkOrderCreateSheet.tsx", fields: 1 },
  { surface: "직접 사이즈/색상", owner: "features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx", fields: 1 },
  { surface: "직접 스펙 생성/이름 변경", owner: "features/work-orders/size-color/SpecItemSelectionSheet.tsx", fields: 1 },
  { surface: "시즌/세부 품목 직접입력", owner: "features/work-orders/overview/WorkOrderOverviewPickerSheets.tsx", fields: 1 },
  { surface: "사용자 저장 스펙 이름/이름 변경", owner: "features/work-orders/size-color/MeasurementTemplateSheets.tsx", fields: 1 },
  { surface: "퀵 전달 기사 정보", owner: "features/work-orders/documents/WorkOrderDocumentWorkbench.tsx", fields: 3 },
  { surface: "퀵 전달 상세주소/연락처", owner: "features/work-orders/documents/QuickDeliveryFoundation.tsx", fields: 2 },
] as const;
