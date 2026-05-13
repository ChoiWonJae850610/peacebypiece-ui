# i18n 잔여 하드코딩 정리 1차 — 0.11.47

## 목적

고객관리자에게 직접 보이는 관리자 화면의 잔여 하드코딩 문구를 우선적으로 `useAdminTranslation()` 기반 key/fallback 구조로 이동한다.

## 적용 범위

- `/admin/settings` 환경설정 허브
- `/admin/settings` 정책 overview
- 고객관리자 기준정보 모달 중 단위 표준 모달
- 고객관리자 협력업체/외주공정 기준정보 모달

## 실제 변경

### `components/admin/settings/AdminSettingsHub.tsx`

다음 고객관리자 노출 문구를 `t(key, fallback)` 구조로 이동했다.

- 회사 설정 loading/failed empty state
- 환경설정 title/description
- 권한·요금제 분리 안내
- 준비중 modal title fallback
- 이메일 작성하기 / 확인
- 적용 예정 section title
- billing loading badge
- feedback email 안내 문구

### `components/admin/settings/AdminPolicyOverview.tsx`

정책 overview의 section title, description, badge, subsection heading을 `useAdminTranslation()` 기반으로 이동했다.

### `components/admin/standards/AdminUnitManagementModal.tsx`

단위 표준 모달의 description, category label, usage notice를 i18n key/fallback 구조로 이동했다.

### `components/admin/partnerMaster/PartnerProcessManagementModal.tsx`

외주공정 표준 선택 모달의 description, category label, usage notice를 i18n key/fallback 구조로 이동했다.

## 변경하지 않은 것

- 설정 저장 API
- 기준정보 저장/초기화 API
- 외주공정 사용/미사용 선택 로직
- 단위 사용/미사용 선택 로직
- 작업지시서 저장/상태변경 로직
- 저장소/R2 purge 흐름
- DB schema

## 후속 작업

0.11.48에서는 시스템관리자 화면의 하드코딩 문구를 i18n key/fallback 구조로 이동한다.
