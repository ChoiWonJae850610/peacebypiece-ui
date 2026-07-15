export const ALPHA42_REALISTIC_FIXTURE = Object.freeze({
  legacySourceId: "wafl-v2-alpha42-realistic-issued-v1",
  productName: "리넨 라운드 셔츠 원피스",
  productTypeCode: "apparel.onepiece_set",
  productTypeLabel: "여성 원피스",
  seasonCode: "26FW",
  itemCode: "O-LNDRS",
  totalQuantity: 144,
  dueDate: "2026-08-15",
  factoryName: "성수 어패럴",
  image: Object.freeze({
    sourcePath: "public/dev-samples/linen-round-dress-sketch.svg",
    filename: "linen-round-dress-sketch.svg",
    mimeType: "image/svg+xml",
    title: "리넨 라운드 셔츠 원피스 앞면·뒷면 제품 도식",
  }),
  factoryDeliveryMemo: [
    "성수 어패럴 전달사항",
    "완성 후 전 색상 소프트 워싱을 진행합니다.",
    "앞여밈 단추 간격을 일정하게 맞춥니다.",
    "소매 커프스 좌우 폭과 단추 위치를 동일하게 맞춥니다.",
    "허리 스트링 좌우 노출 길이를 동일하게 마감합니다.",
    "IVORY는 오염과 비침 여부를 별도 확인합니다.",
    "초도 3장을 먼저 완성하여 봉제 상태 확인 후 본 생산합니다.",
  ].join("\n"),
  colors: Object.freeze([
    Object.freeze({ code: "IVORY", displayName: "IVORY", hexValue: "#F3EFE3", displayOrder: 0 }),
    Object.freeze({ code: "NAVY", displayName: "NAVY", hexValue: "#24344D", displayOrder: 1 }),
    Object.freeze({ code: "BLACK", displayName: "BLACK", hexValue: "#202124", displayOrder: 2 }),
  ]),
  sizes: Object.freeze(["S", "M", "L"]),
  matrix: Object.freeze({
    IVORY: Object.freeze({ S: 8, M: 16, L: 8 }),
    NAVY: Object.freeze({ S: 12, M: 24, L: 12 }),
    BLACK: Object.freeze({ S: 16, M: 32, L: 16 }),
  }),
  materials: Object.freeze([
    Object.freeze({ type: "fabric", name: "리넨 레이온 혼방", colorOption: "IVORY / NAVY / BLACK", usageArea: "앞판·뒷판·소매·칼라", requiredQuantity: "288.000", allowanceQuantity: "18.000", unitCode: "yd", memo: "결 방향을 통일하고 워싱 후 축률 확인" }),
    Object.freeze({ type: "fabric", name: "폴리 안감", colorOption: "겉감 컬러 매칭", usageArea: "몸판 안쪽", requiredQuantity: "132.000", allowanceQuantity: "8.000", unitCode: "yd", memo: "겉감보다 1cm 짧게 마감" }),
    Object.freeze({ type: "accessory", name: "천연 자개 단추", colorOption: "18L · 천연색", usageArea: "앞여밈·소매 커프스", requiredQuantity: "1584.000", allowanceQuantity: "48.000", unitCode: "ea", memo: "색상과 두께 편차를 선별하여 사용" }),
    Object.freeze({ type: "accessory", name: "케어라벨", colorOption: "백색 바탕 · 흑색 인쇄", usageArea: "왼쪽 옆선 안쪽", requiredQuantity: "144.000", allowanceQuantity: "8.000", unitCode: "ea", memo: "밑단에서 12cm 위에 봉제" }),
    Object.freeze({ type: "accessory", name: "행택끈", colorOption: "오프화이트 면끈 18cm", usageArea: "브랜드 행택", requiredQuantity: "144.000", allowanceQuantity: "8.000", unitCode: "ea", memo: "메인라벨 고리에 연결" }),
    Object.freeze({ type: "accessory", name: "플리백", colorOption: "투명 · 35×45cm", usageArea: "완제품 개별 포장", requiredQuantity: "144.000", allowanceQuantity: "10.000", unitCode: "ea", memo: "색상·사이즈 스티커 부착" }),
  ]),
  sizeSpec: Object.freeze({
    measurementUnit: "cm",
    rows: Object.freeze([
      Object.freeze({ code: "TOTAL_LENGTH", name: "총장", type: "length", values: Object.freeze({ S: "116.0", M: "118.0", L: "120.0" }) }),
      Object.freeze({ code: "SHOULDER", name: "어깨너비", type: "length", values: Object.freeze({ S: "38.0", M: "39.5", L: "41.0" }) }),
      Object.freeze({ code: "CHEST_HALF", name: "가슴단면", type: "half_flat", values: Object.freeze({ S: "50.0", M: "52.5", L: "55.0" }) }),
      Object.freeze({ code: "SLEEVE_LENGTH", name: "소매길이", type: "length", values: Object.freeze({ S: "57.0", M: "58.0", L: "59.0" }) }),
      Object.freeze({ code: "HEM_HALF", name: "밑단단면", type: "half_flat", values: Object.freeze({ S: "76.0", M: "78.5", L: "81.0" }) }),
    ]),
  }),
  processes: Object.freeze([
    Object.freeze({ typeCode: "cutting", name: "재단", partnerName: "성수 재단실", dueDate: "2026-07-28", memo: "원단 결 방향을 통일하고 IVORY 오염 방지용 작업대를 사용합니다." }),
    Object.freeze({ typeCode: "sewing", name: "봉제", partnerName: "한강 봉제", dueDate: "2026-08-05", memo: "앞여밈 단추 간격과 소매 커프스 좌우 폭을 동일하게 맞춥니다." }),
    Object.freeze({ typeCode: "washing", name: "워싱", partnerName: "성수 워싱", dueDate: "2026-08-09", memo: "전 색상 소프트 워싱 후 축률과 NAVY·BLACK 이염을 확인합니다." }),
    Object.freeze({ typeCode: "inspection_packing", name: "검품·포장", partnerName: "본사 검품팀", dueDate: "2026-08-12", memo: "초도 3장 봉제 상태 확인 후 색상·사이즈별 수량을 대조해 개별 포장합니다." }),
  ]),
});

export function assertAlpha42RealisticFixture(fixture = ALPHA42_REALISTIC_FIXTURE) {
  const total = Object.values(fixture.matrix).flatMap((row) => Object.values(row)).reduce((sum, value) => sum + value, 0);
  if (total !== fixture.totalQuantity) throw new Error("ALPHA42_MATRIX_TOTAL_INVALID");
  if (fixture.materials.filter((item) => item.type === "fabric").length !== 2
      || fixture.materials.filter((item) => item.type === "accessory").length !== 4
      || fixture.colors.length !== 3
      || fixture.sizes.length !== 3
      || fixture.sizeSpec.rows.length !== 5
      || fixture.processes.length !== 4) {
    throw new Error("ALPHA42_FIXTURE_SHAPE_INVALID");
  }
  const displayed = JSON.stringify(fixture);
  if (/synthetic|runtime|fixture|approved dev\/test/i.test(displayed.replace(fixture.legacySourceId, ""))) {
    throw new Error("ALPHA42_FIXTURE_DISPLAY_TEXT_INVALID");
  }
  return fixture;
}
