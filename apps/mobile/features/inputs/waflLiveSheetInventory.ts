import type { WaflSheetSizing } from "@/domain/waflSheetDetentPolicy";

export type WaflLiveSheetClassification = "A_DRAGGABLE_FREE_SETTLE" | "B_FIXED" | "C_INTERACTION_EXCEPTION";

export type WaflLiveSheetInventoryEntry = {
  readonly surface: string;
  readonly owner: string;
  readonly root: "WaflInputSheet" | "WaflReelPickerSheet" | "InlineDatePicker" | "WorkOrderImageGallery";
  readonly sizing: WaflSheetSizing | "calendar-fixed" | "fullscreen-fixed";
  readonly classification: WaflLiveSheetClassification;
  readonly nested: boolean;
  readonly keyboardText: boolean;
  readonly actions: "X/V" | "explicit-create" | "calendar-actions" | "viewer-close";
  readonly physicalPolicy: string;
};

const DRAG = "canonical header follows the finger and free-settles; body interaction remains independent";

export const WAFL_LIVE_SHEET_INVENTORY: readonly WaflLiveSheetInventoryEntry[] = [
  { surface: "Overview 대상/대분류/세부 품목/시즌 PICK", owner: "features/work-orders/overview/WorkOrderDetailOverview.tsx", root: "WaflReelPickerSheet", sizing: "reelAdaptive", classification: "A_DRAGGABLE_FREE_SETTLE", nested: false, keyboardText: false, actions: "X/V", physicalPolicy: DRAG },
  { surface: "원부자재 단위/필요수량/로스·여유 PICK", owner: "features/materials/WorkOrderMaterialsReadOnly.tsx", root: "WaflReelPickerSheet", sizing: "reelAdaptive", classification: "A_DRAGGABLE_FREE_SETTLE", nested: false, keyboardText: true, actions: "X/V", physicalPolicy: DRAG },
  { surface: "원부자재 거래처 PICK", owner: "features/materials/MaterialPartnerPickerSheet.tsx", root: "WaflReelPickerSheet", sizing: "reelAdaptive", classification: "A_DRAGGABLE_FREE_SETTLE", nested: false, keyboardText: false, actions: "X/V", physicalPolicy: DRAG },
  { surface: "제작 공장/공정/거래처 PICK", owner: "features/work-orders/production/WorkOrderProductionAuthoring.tsx", root: "WaflReelPickerSheet", sizing: "reelAdaptive", classification: "A_DRAGGABLE_FREE_SETTLE", nested: true, keyboardText: false, actions: "X/V", physicalPolicy: DRAG },
  { surface: "새 레시피", owner: "features/work-orders/create/WorkOrderCreateSheet.tsx", root: "WaflInputSheet", sizing: "adaptiveExpandable", classification: "A_DRAGGABLE_FREE_SETTLE", nested: false, keyboardText: true, actions: "X/V", physicalPolicy: DRAG },
  { surface: "원단/부자재 추가", owner: "features/work-orders/overview/WorkOrderDetailOverview.tsx", root: "WaflInputSheet", sizing: "expandable", classification: "A_DRAGGABLE_FREE_SETTLE", nested: false, keyboardText: true, actions: "X/V", physicalPolicy: DRAG },
  { surface: "사이즈 선택", owner: "features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx", root: "WaflInputSheet", sizing: "expandable", classification: "A_DRAGGABLE_FREE_SETTLE", nested: true, keyboardText: false, actions: "X/V", physicalPolicy: DRAG },
  { surface: "직접 사이즈 만들기", owner: "features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx", root: "WaflInputSheet", sizing: "adaptiveExpandable", classification: "A_DRAGGABLE_FREE_SETTLE", nested: true, keyboardText: true, actions: "explicit-create", physicalPolicy: DRAG },
  { surface: "색상 선택", owner: "features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx", root: "WaflInputSheet", sizing: "expandable", classification: "A_DRAGGABLE_FREE_SETTLE", nested: true, keyboardText: false, actions: "X/V", physicalPolicy: DRAG },
  { surface: "직접 색상 만들기", owner: "features/work-orders/size-color/WorkOrderSizeColorStructureEditor.tsx", root: "WaflInputSheet", sizing: "adaptiveExpandable", classification: "A_DRAGGABLE_FREE_SETTLE", nested: true, keyboardText: true, actions: "explicit-create", physicalPolicy: DRAG },
  { surface: "스펙 항목 선택", owner: "features/work-orders/size-color/SpecItemSelectionSheet.tsx", root: "WaflInputSheet", sizing: "expandable", classification: "A_DRAGGABLE_FREE_SETTLE", nested: true, keyboardText: false, actions: "X/V", physicalPolicy: DRAG },
  { surface: "직접 스펙 만들기/이름 관리", owner: "features/work-orders/size-color/SpecItemSelectionSheet.tsx", root: "WaflInputSheet", sizing: "adaptiveExpandable", classification: "A_DRAGGABLE_FREE_SETTLE", nested: true, keyboardText: true, actions: "explicit-create", physicalPolicy: DRAG },
  { surface: "스펙 불러오기", owner: "features/work-orders/size-color/MeasurementTemplateSheets.tsx", root: "WaflInputSheet", sizing: "adaptiveExpandable", classification: "A_DRAGGABLE_FREE_SETTLE", nested: false, keyboardText: false, actions: "X/V", physicalPolicy: DRAG },
  { surface: "스펙 저장/업데이트", owner: "features/work-orders/size-color/MeasurementTemplateSheets.tsx", root: "WaflInputSheet", sizing: "adaptiveExpandable", classification: "A_DRAGGABLE_FREE_SETTLE", nested: false, keyboardText: true, actions: "X/V", physicalPolicy: DRAG },
  { surface: "색상·사이즈/완성 스펙 전체보기", owner: "features/work-orders/size-color/WorkOrderSizeColorReadOnly.tsx", root: "WaflInputSheet", sizing: "fullView", classification: "A_DRAGGABLE_FREE_SETTLE", nested: false, keyboardText: true, actions: "X/V", physicalPolicy: DRAG },
  { surface: "퀵 전달 편집", owner: "features/work-orders/documents/WorkOrderDocumentWorkbench.tsx", root: "WaflInputSheet", sizing: "expandable", classification: "A_DRAGGABLE_FREE_SETTLE", nested: false, keyboardText: true, actions: "X/V", physicalPolicy: DRAG },
  { surface: "퀵 출발지/도착지 등록장소 PICK", owner: "features/work-orders/documents/QuickDeliveryFoundation.tsx", root: "WaflReelPickerSheet", sizing: "reelAdaptive", classification: "A_DRAGGABLE_FREE_SETTLE", nested: true, keyboardText: false, actions: "X/V", physicalPolicy: DRAG },
  { surface: "퀵 출발지/도착지 직접 입력", owner: "features/work-orders/documents/QuickDeliveryFoundation.tsx", root: "WaflInputSheet", sizing: "expandable", classification: "A_DRAGGABLE_FREE_SETTLE", nested: true, keyboardText: true, actions: "X/V", physicalPolicy: DRAG },
  { surface: "주소 검색", owner: "features/work-orders/documents/QuickDeliveryAddressSearchSheet.tsx", root: "WaflInputSheet", sizing: "expandable", classification: "A_DRAGGABLE_FREE_SETTLE", nested: true, keyboardText: true, actions: "X/V", physicalPolicy: DRAG },
  { surface: "퀵 전달 요청 미리보기", owner: "features/work-orders/documents/QuickDeliveryFoundation.tsx", root: "WaflInputSheet", sizing: "adaptiveExpandable", classification: "A_DRAGGABLE_FREE_SETTLE", nested: true, keyboardText: false, actions: "X/V", physicalPolicy: DRAG },
  { surface: "문서 첨부 선택", owner: "features/work-orders/documents/WorkOrderDocumentWorkbench.tsx", root: "WaflInputSheet", sizing: "expandable", classification: "A_DRAGGABLE_FREE_SETTLE", nested: false, keyboardText: false, actions: "X/V", physicalPolicy: DRAG },
  { surface: "문서 사이즈·색상별 수량", owner: "features/work-orders/documents/WorkOrderDocumentWorkbench.tsx", root: "WaflInputSheet", sizing: "expandable", classification: "A_DRAGGABLE_FREE_SETTLE", nested: false, keyboardText: false, actions: "X/V", physicalPolicy: DRAG },
  { surface: "작업지시서 공유 기간", owner: "features/work-orders/documents/WorkOrderDocumentWorkbench.tsx", root: "WaflInputSheet", sizing: "contentFit", classification: "B_FIXED", nested: false, keyboardText: false, actions: "X/V", physicalPolicy: "short fixed choice confirmation; no handle or free-drag" },
  { surface: "납기일 달력", owner: "components/InlineDatePicker.tsx", root: "InlineDatePicker", sizing: "calendar-fixed", classification: "C_INTERACTION_EXCEPTION", nested: false, keyboardText: false, actions: "calendar-actions", physicalPolicy: "fixed month grid preserves stable day-cell geometry" },
  { surface: "이미지 전체화면 Viewer", owner: "features/work-orders/images/WorkOrderImageGallery.tsx", root: "WorkOrderImageGallery", sizing: "fullscreen-fixed", classification: "C_INTERACTION_EXCEPTION", nested: false, keyboardText: false, actions: "viewer-close", physicalPolicy: "fullscreen media viewer is not a bottom-origin input sheet" },
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
