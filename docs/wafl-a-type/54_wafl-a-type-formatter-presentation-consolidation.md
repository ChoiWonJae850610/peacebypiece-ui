# 54. formatter/presentation 통합 1차

## 목적

0.15.31 작업은 숫자, 금액, 저장공간 용량, 단위 표기 formatter가 화면/도메인별로 중복 구현되어 있던 문제를 1차로 정리한다.

이번 단계는 기능 동작을 바꾸는 리팩토링이 아니라, 기존 표시 결과를 최대한 유지하면서 공통 formatter를 도입하는 안정화 작업이다.

## 적용 범위

### 추가 공통 유틸

- `lib/utils/formatters.ts`

제공 함수:

- `normalizeFiniteNumber`
- `formatPbpInteger`
- `formatPbpNumberWithUnit`
- `formatPbpKrw`
- `formatPbpBinaryBytes`

## 반영한 중복 제거

### 저장공간 용량 표기

기존에는 아래 계층에 각각 유사한 byte formatter가 있었다.

- `lib/billing/storageQuotaPolicy.ts`
- `lib/system/systemCompanyPlanSkeleton.ts`
- `lib/admin/stats/selectors.ts`
- `lib/admin/files/storageSummaryPresentation.ts`

0.15.31에서는 각 계층의 공개 함수명은 유지하되 내부 구현을 `formatPbpBinaryBytes`로 위임했다.

### 금액 표기

기존에는 요금제/청구 관련 파일마다 `toLocaleString("ko-KR") + 원` 조합을 직접 작성했다.

0.15.31에서는 다음 파일이 `formatPbpKrw`를 사용한다.

- `lib/system/systemCompanyPlanSkeleton.ts`
- `lib/admin/settings/adminBillingPlanPlaceholder.ts`
- `lib/billing/companyPlanChangePolicy.ts`

### 수량 + 단위 표기

멤버 수, 통계 count 등의 반복 표기를 `formatPbpNumberWithUnit`로 정리했다.

- `lib/system/systemCompanyPlanSkeleton.ts`
- `lib/admin/settings/adminBillingPlanPlaceholder.ts`
- `lib/billing/companyPlanChangePolicy.ts`
- `lib/admin/stats/featureGate.ts`

## 유지한 것

- 기존 public API 함수명은 유지했다.
- 화면 표시 문구 자체는 가능한 한 유지했다.
- DB/API/R2/권한/세션 흐름은 변경하지 않았다.
- i18n 리소스 shape는 변경하지 않았다.

## 다음 정리 후보

0.15.32 이후에는 다음 후보를 별도 패치로 분리한다.

- 날짜/시간 formatter 통합
- 상태 badge label/tone presentation 통합
- route label/title formatter 통합
- 작업지시서 금액/수량 formatter 통합
- TSX 내부 조건 판단을 selector/presentation으로 이동
