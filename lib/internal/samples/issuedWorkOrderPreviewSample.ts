import type { WorkOrderIssuedPreviewReadModel } from "@/lib/domain/work-orders/contracts";

const sizes = [
  { id: "10000000-0000-0000-0000-000000000001", code: "S", displayLabel: "S", displayOrder: 0 },
  { id: "10000000-0000-0000-0000-000000000002", code: "M", displayLabel: "M", displayOrder: 1 },
  { id: "10000000-0000-0000-0000-000000000003", code: "L", displayLabel: "L", displayOrder: 2 },
];
const colors = [
  { id: "20000000-0000-0000-0000-000000000001", displayName: "IVORY", hexValue: "#ece5d5", displayOrder: 0 },
  { id: "20000000-0000-0000-0000-000000000002", displayName: "NAVY", hexValue: "#182b4b", displayOrder: 1 },
  { id: "20000000-0000-0000-0000-000000000003", displayName: "BLACK", hexValue: "#242424", displayOrder: 2 },
];

const material = (id: string, materialType: "fabric" | "accessory", name: string, colorOption: string, usageArea: string, requiredQuantity: string, allowanceQuantity: string, unitCode: string, memo: string, displayOrder: number) => ({
  id,
  materialId: null,
  materialType,
  name,
  colorOption,
  usageArea,
  partnerId: null,
  partnerName: "동대문 샘플 거래처",
  requiredQuantity,
  allowanceQuantity,
  inventoryUsageQuantity: "0",
  orderQuantity: "0",
  unitCode,
  currency: "KRW",
  unitPrice: "0",
  amount: "0",
  memo,
  status: "completed",
  displayOrder,
  editable: false,
  locked: true,
});

export const issuedWorkOrderPreviewSample = {
  document: {
    title: "작업지시서",
    displayDocumentNumber: "WAFN-26SS-DRESS-260713-001-R0",
    revisionNumber: 0,
    issuedAt: "2026-07-13T01:30:00.000Z",
  },
  header: {
    workOrderId: "30000000-0000-0000-0000-000000000001",
    revisionId: "30000000-0000-0000-0000-000000000002",
    productName: "리넨 라운드 원피스",
    productTypeCode: "DRESS",
    seasonCode: "26SS",
    itemCode: "DRESS",
    dueDate: "2026-07-28",
    totalQuantity: 144,
    memo: "봉제선은 1cm 기준으로 정리하고 완성 후 실밥과 초크 자국을 제거합니다.",
    factoryDeliveryMemo: "대표 스케치의 넥 라인과 밑단 비율을 우선합니다.\nIVORY는 오염 방지를 위해 공정 사이에 개별 커버를 씌웁니다.",
  },
  amounts: { currency: "KRW", unitPrice: "0", fabricTotal: "0", accessoryTotal: "0", processTotal: "0", estimatedTotal: "0" },
  materials: {
    fabrics: [
      material("40000000-0000-0000-0000-000000000001", "fabric", "워시드 리넨 30수", "IVORY·NAVY·BLACK", "앞판·뒷판 몸판과 소매 겉면", "288", "18", "yd", "결 방향을 세로로 맞춥니다.", 0),
      material("40000000-0000-0000-0000-000000000002", "fabric", "코튼 안감", "IVORY", "몸판 안쪽", "142", "8", "yd", "암홀 시접 안쪽에서 고정합니다.", 1),
    ],
    accessories: [
      material("50000000-0000-0000-0000-000000000001", "accessory", "자개 단추", "15mm / IVORY", "뒤 중심 여밈", "144", "10", "개", "여분 단추 1개 동봉", 0),
      material("50000000-0000-0000-0000-000000000002", "accessory", "콘실 지퍼", "55cm / NAVY", "옆선", "144", "5", "개", "지퍼 끝 바텍 보강", 1),
      material("50000000-0000-0000-0000-000000000003", "accessory", "케어 라벨", "백색", "왼쪽 옆선 안쪽", "144", "8", "장", "밑단에서 12cm 위", 2),
      material("50000000-0000-0000-0000-000000000004", "accessory", "폴리백", "투명 / M", "완제품 포장", "144", "6", "장", "색상별 스티커 부착", 3),
    ],
  },
  sizeColors: {
    workOrderId: "30000000-0000-0000-0000-000000000001",
    revisionId: "30000000-0000-0000-0000-000000000002",
    sizes,
    colors,
    quantityCells: [
      [0, 0, 8], [0, 1, 16], [0, 2, 8],
      [1, 0, 12], [1, 1, 24], [1, 2, 12],
      [2, 0, 16], [2, 1, 32], [2, 2, 16],
    ].map(([colorIndex, sizeIndex, quantity]) => ({ colorId: colors[colorIndex].id, sizeRowId: sizes[sizeIndex].id, quantity: String(quantity) })),
    matrixTotal: "144",
    expectedTotal: "144",
    totalsMatch: true,
    memoFallback: null,
    entityVersion: 1,
  },
  sizeSpecifications: {
    workOrderId: "30000000-0000-0000-0000-000000000001",
    revisionId: "30000000-0000-0000-0000-000000000002",
    genderCode: "WOMEN",
    categoryCode: "DRESS",
    measurementUnit: "cm",
    templateId: null,
    sizes,
    pomColumns: [
      { id: "60000000-0000-0000-0000-000000000001", code: "CHEST", displayName: "가슴 단면", displayOrder: 0 },
      { id: "60000000-0000-0000-0000-000000000002", code: "SHOULDER", displayName: "어깨너비", displayOrder: 1 },
      { id: "60000000-0000-0000-0000-000000000003", code: "LENGTH", displayName: "총장", displayOrder: 2 },
      { id: "60000000-0000-0000-0000-000000000004", code: "SLEEVE", displayName: "소매장", displayOrder: 3 },
    ],
    cells: [
      [0, [48, 50, 52]], [1, [38, 39.5, 41]], [2, [118, 119, 120]], [3, [24, 25, 26]],
    ].flatMap(([pomIndex, values]) => (values as number[]).map((cellValue, sizeIndex) => ({ sizeRowId: sizes[sizeIndex].id, pomColumnId: `60000000-0000-0000-0000-00000000000${Number(pomIndex) + 1}`, displayValue: String(cellValue), decimalValue: String(cellValue) }))),
    entityVersion: 1,
  },
  processes: [
    ["재단", "몸판·소매 전체", "전 색상", "원단 결 방향과 재단 표시 확인"],
    ["봉제", "옆선·어깨·소매", "전 색상", "시접 1cm, 넥 라인 늘어남 방지"],
    ["다림질", "완제품 전체", "IVORY 저온", "리넨 광택이 생기지 않게 덧천 사용"],
    ["검수·포장", "완제품 전체", "색상별 구분", "실밥 제거 후 폴리백 포장"],
  ].map(([processName, applicationArea, applicationColorTarget, memo], index) => ({ id: `70000000-0000-0000-0000-00000000000${index + 1}`, processTypeCode: `STEP_${index + 1}`, processName, partnerId: null, partnerName: "성수 샘플 공장", quantity: "144", dueDate: "2026-07-28", unitCode: "장", currency: "KRW", unitPrice: "0", amount: "0", memo, applicationArea, applicationColorTarget, status: "ready", displayOrder: index, editable: false, locked: true })),
  assets: [{ assetType: "image", filename: "linen-round-dress-sketch.svg", mimeType: "image/svg+xml", displayOrder: 0, isRepresentative: true, includeInDocument: true }],
  issue: { workOrderStatus: "issued", revisionStatus: "finalized" },
  layoutMetadata: { schemaVersion: 1, sectionOrder: ["basic", "assets", "fabrics", "accessories", "sizeColor", "sizeSpec", "processes", "memo", "issue"], businessTimezone: "Asia/Seoul" },
} as unknown as WorkOrderIssuedPreviewReadModel;
