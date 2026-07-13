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

const material = (id: string, materialType: "fabric" | "accessory", name: string, partnerName: string, colorOption: string, usageArea: string, requiredQuantity: string, allowanceQuantity: string, unitCode: string, memo: string, displayOrder: number) => ({
  id,
  materialId: null,
  materialType,
  name,
  colorOption,
  usageArea,
  partnerId: null,
  partnerName,
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
    displayDocumentNumber: "WAFN-26FW-O-LNDRS-260713-001-R0",
    revisionNumber: 0,
    issuedAt: "2026-07-13T01:30:00.000Z",
  },
  header: {
    workOrderId: "30000000-0000-0000-0000-000000000001",
    revisionId: "30000000-0000-0000-0000-000000000002",
    productName: "리넨 라운드 셔츠 원피스",
    productTypeCode: "O",
    seasonCode: "26FW",
    itemCode: "LNDRS",
    dueDate: "2026-08-15",
    totalQuantity: 144,
    memo: "봉제선은 1cm 기준으로 정리하고 완성 후 실밥과 초크 자국을 제거합니다.",
    factoryDeliveryMemo: "· 완성 후 전 색상 소프트 워싱을 진행합니다.\n· 앞여밈 단추 간격을 일정하게 맞춥니다.\n· 소매 커프스 좌우 폭과 단추 위치를 동일하게 맞춥니다.\n· 허리 스트링 좌우 노출 길이를 동일하게 마감합니다.\n· IVORY는 오염과 비침 여부를 별도 확인합니다.\n· 초도 3장을 먼저 완성하여 봉제 상태 확인 후 본 생산합니다.",
  },
  amounts: { currency: "KRW", unitPrice: "0", fabricTotal: "0", accessoryTotal: "0", processTotal: "0", estimatedTotal: "0" },
  materials: {
    fabrics: [
      material("40000000-0000-0000-0000-000000000001", "fabric", "리넨 레이온 혼방", "동대문 패브릭랩", "IVORY / NAVY / BLACK", "앞판·뒷판·소매·칼라", "288", "18", "yd", "결 방향과 워싱 후 축률을 확인합니다.", 0),
      material("40000000-0000-0000-0000-000000000002", "fabric", "폴리 안감", "서울 안감상사", "겉감 컬러 매칭", "몸판 안쪽", "132", "8", "yd", "겉감보다 1cm 짧게 마감합니다.", 1),
    ],
    accessories: [
      material("50000000-0000-0000-0000-000000000001", "accessory", "천연 자개 단추", "종로 단추상회", "18mm / 아이보리", "앞여밈·소매 커프스", "1152", "72", "개", "여분은 색상별 10개씩 별도 포장합니다.", 0),
      material("50000000-0000-0000-0000-000000000002", "accessory", "케어라벨", "을지 라벨팩토리", "백색 / 35×70mm", "왼쪽 옆선 안쪽", "144", "10", "장", "밑단 기준 12cm 위에 봉제합니다.", 1),
      material("50000000-0000-0000-0000-000000000003", "accessory", "행택끈", "동대문 패키지랩", "코튼 베이지 / 18cm", "메인라벨 고리", "144", "10", "개", "행택 인쇄면이 앞쪽을 향하게 묶습니다.", 2),
      material("50000000-0000-0000-0000-000000000004", "accessory", "플리백", "성동 포장상사", "투명 / 35×45cm", "완제품 포장", "144", "10", "장", "색상·사이즈 스티커를 우측 상단에 부착합니다.", 3),
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
      { id: "60000000-0000-0000-0000-000000000004", code: "SLEEVE", displayName: "소매길이", displayOrder: 3 },
      { id: "60000000-0000-0000-0000-000000000005", code: "HEM", displayName: "밑단단면", displayOrder: 4 },
    ],
    cells: [
      [0, [48, 50, 52]], [1, [38, 39.5, 41]], [2, [118, 119, 120]], [3, [57, 58, 59]], [4, [76, 78, 80]],
    ].flatMap(([pomIndex, values]) => (values as number[]).map((cellValue, sizeIndex) => ({ sizeRowId: sizes[sizeIndex].id, pomColumnId: `60000000-0000-0000-0000-00000000000${Number(pomIndex) + 1}`, displayValue: String(cellValue), decimalValue: String(cellValue) }))),
    entityVersion: 1,
  },
  processes: [
    ["재단", "성수 재단실", "몸판·소매·칼라", "전 색상", "결 방향을 통일하고 IVORY 재단 시 오염 방지 비닐을 사용합니다.", "2026-08-03"],
    ["봉제", "한강 봉제", "앞여밈·소매 커프스", "IVORY / NAVY / BLACK", "앞여밈 단추 간격과 소매 커프스 좌우 대칭을 확인합니다.", "2026-08-08"],
    ["워싱", "성수 워싱", "완제품 전체", "전 색상", "전 색상 소프트 워싱을 진행하고 IVORY는 이염 방지를 위해 분리 작업합니다.", "2026-08-11"],
    ["검품·포장", "본사 검품팀", "완제품 전체", "색상·사이즈별", "실밥·단추·오염을 확인한 뒤 색상·사이즈별로 분류 포장합니다.", "2026-08-14"],
  ].map(([processName, partnerName, applicationArea, applicationColorTarget, memo, dueDate], index) => ({ id: `70000000-0000-0000-0000-00000000000${index + 1}`, processTypeCode: `STEP_${index + 1}`, processName, partnerId: null, partnerName, quantity: "144", dueDate, unitCode: "장", currency: "KRW", unitPrice: "0", amount: "0", memo, applicationArea, applicationColorTarget, status: "ready", displayOrder: index, editable: false, locked: true })),
  assets: [{ assetType: "image", filename: "linen-round-dress-sketch.svg", mimeType: "image/svg+xml", displayOrder: 0, isRepresentative: true, includeInDocument: true }],
  issue: { workOrderStatus: "issued", revisionStatus: "finalized" },
  layoutMetadata: { schemaVersion: 1, sectionOrder: ["basic", "assets", "fabrics", "accessories", "sizeColor", "sizeSpec", "processes", "memo", "issue"], businessTimezone: "Asia/Seoul" },
} as unknown as WorkOrderIssuedPreviewReadModel;
