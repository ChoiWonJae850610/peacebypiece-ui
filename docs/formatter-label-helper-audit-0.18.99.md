# 0.18.99 formatter/label helper 점검

## 목적

전체 소스 리팩토링 전에 날짜, 금액, 파일 크기, 수량, 퍼센트, 상태 label helper가 어디에 흩어져 있는지 먼저 분류한다.

이번 버전은 동작을 바꾸지 않는 저위험 감사 문서다. 테스트 가능 상태가 명확히 확인되기 전까지 formatter 동작, locale, DB/API/R2/권한/작업지시서 상태 흐름은 변경하지 않는다.

## 1차 정적 지표

0.18.98 소스 기준으로 `app/`, `components/`, `features/`, `lib/`의 `.ts/.tsx` 파일을 정적으로 확인했다. 아래 수치는 리팩토링 우선순위 선별용이며, 모든 항목이 곧바로 삭제 또는 통합 대상이라는 뜻은 아니다.

| 항목 | 발생 수 | 파일 수 | 해석 |
| --- | ---: | ---: | --- |
| `toLocaleString(` 직접 사용 | 87 | 33 | 숫자/금액/수량 formatter 공통화 후보가 많음 |
| `toLocaleDateString(` 직접 사용 | 3 | 3 | 날짜 표시 helper 기준과 맞출 수 있음 |
| `Intl.DateTimeFormat` | 9 | 7 | 날짜/시간 formatter 위치 통합 후보 |
| `Intl.NumberFormat` | 2 | 2 | 숫자 formatter 기준과 맞출 후보 |
| `formatPbp*` 사용 | 43 | 12 | 이미 공통 formatter가 일부 사용 중 |
| `format*Date*` 계열 | 64 | 20 | 날짜 helper 명명과 책임 분리 필요 |
| `format*Currency*` 계열 | 50 | 7 | 작업지시서/발주/PDF 금액 표시 기준 통일 필요 |
| `format*Bytes/FileSize/Storage*` 계열 | 71 | 22 | 저장소/요금제/파일 표시 기준 통일 필요 |

## 현재 공통 formatter 기반

현재 이미 존재하는 공통 기반은 유지한다.

- `lib/utils/formatters.ts`
  - `formatPbpInteger`
  - `formatPbpNumberWithUnit`
  - `formatPbpKrw`
  - `formatPbpBinaryBytes`
  - `normalizeFiniteNumber`
- `lib/i18n/adminTermFormatters.ts`
  - 관리자 용어/카운트 label formatter
  - 파일 타입 표시 label 변환
- `lib/workorder/presentation/statusPresentation.ts`
  - 작업지시서 workflow/inspection 상태 표시
- `lib/workorder/presentation/workOrderStatusPresentation.ts`
  - i18n 주입형 작업지시서 상태 label helper
- `lib/admin/adminFiles.datePresentation.ts`
  - 저장소관리 날짜/시간 표시
- `lib/workorder/presentation/dateTimePresentation.ts`
  - 작업지시서 KST 날짜/시간 표시

## 중복 가능성이 큰 영역

### 1. 작업지시서 상세 숫자/금액 표시

후보 파일:

- `components/workorder/detail/sections/OrderInfoSection.tsx`
- `components/workorder/detail/sections/device/WorkOrderDetailMobileOrderInfoSection.tsx`
- `components/workorder/detail/sections/device/WorkOrderDetailTabletOrderInfoSection.tsx`
- `components/workorder/detail/WorkOrderCostSummarySection.tsx`
- `lib/workorder/detail/detailFormatting.ts`

판단:

- 주문 정보와 비용 요약 표시가 PC/태블릿/모바일 컴포넌트에 나뉘어 있다.
- `toLocaleString` 직접 사용이 반복되므로 표시용 helper를 먼저 좁게 뽑는 것이 적합하다.
- 단, 입력값 편집/저장 로직과 엮여 있으므로 테스트 가능 전까지 실제 동작 변경은 보류한다.

### 2. 발주 요청 문서/PDF 금액 표시

후보 파일:

- `components/common/modal/orderRequest/OrderRequestDocumentPreview.tsx`
- `lib/workorder/presentation/orderRequestDocumentPrint.ts`
- `lib/workorder/serverOrderRequestPdf.ts`

판단:

- 화면 미리보기, 인쇄 문서, 서버 PDF가 같은 금액/수량 표시 규칙을 가져야 한다.
- 기능 영향이 큰 영역이므로 바로 통합하지 말고 공통 순수 formatter를 먼저 만들고 snapshot/화면 비교가 가능할 때 적용한다.

### 3. 저장소/요금제 파일 크기 표시

후보 파일:

- `lib/utils/formatters.ts`
- `lib/admin/adminFiles.presentation.ts`
- `lib/admin/files/storageSummaryPresentation.ts`
- `lib/admin/adminFiles.serverActions.ts`
- `lib/system/storagePurgeCandidates.ts`
- `lib/billing/storageQuotaPolicy.ts`
- `lib/system/systemCompanyPlanSkeleton.ts`

판단:

- `formatPbpBinaryBytes`가 이미 기준점이다.
- 남은 직접 file size formatter는 이 함수로 단계적으로 흡수하는 방향이 맞다.
- 저장소/요금제 표시는 고객에게 노출되는 숫자라서 단위 반올림 기준을 먼저 고정해야 한다.

### 4. 날짜/시간 표시

후보 파일:

- `lib/admin/adminFiles.datePresentation.ts`
- `lib/workorder/presentation/dateTimePresentation.ts`
- `lib/date/localDate.ts`
- `components/admin/common/AdminDateRangePicker.tsx`
- `components/common/date/PbpSingleDatePicker.tsx`
- `lib/admin/billing/adminSubscription.presentation.ts`

판단:

- 날짜 입력용 값, 화면 표시용 값, 서버 저장용 값, KST 표시용 값의 역할을 나눠야 한다.
- 모든 날짜를 하나의 formatter로 합치면 오히려 위험하다.
- 권장 분리는 `input date value`, `display date`, `display date time`, `KST storage/admin date` 네 종류다.

## 권장 리팩토링 순서

테스트 가능 상태가 명확해진 뒤 아래 순서로 적용한다.

1. `lib/utils/formatters.ts`에 이미 있는 `formatPbpInteger`, `formatPbpKrw`, `formatPbpBinaryBytes` 사용 기준을 문서화한다.
2. 저장소/요금제 영역부터 file size formatter 중복을 줄인다.
3. 작업지시서 상세의 숫자 표시 helper를 PC/태블릿/모바일 공통으로 묶는다.
4. 발주 요청 미리보기/인쇄/PDF 금액 formatter는 마지막에 적용한다.
5. 날짜 formatter는 통합보다 역할별 분리를 먼저 한다.
6. 상태 label은 i18n 주입형 helper와 전역 i18n helper가 섞이지 않도록 호출 위치 기준을 정한다.

## 금지 기준

아래 작업은 테스트 가능하다고 명시되기 전까지 보류한다.

- 입력값 저장 형태 변경
- 금액/수량 계산식 변경
- PDF 표시값 변경
- 날짜 time zone 정책 변경
- 권한/상태 판단 로직 변경
- API route 응답값 변경
- DB schema 또는 seed SQL 변경

## 다음 작업 후보

- 0.19.00: 저장소/요금제 file size formatter 공통화 후보를 실제 코드 기준으로 좁게 적용
- 0.19.01: 작업지시서 상세 숫자 표시 helper 후보 문서화 또는 적용
- 0.19.02: 발주 요청 문서/PDF 금액 formatter 적용 전 비교 기준 문서화
