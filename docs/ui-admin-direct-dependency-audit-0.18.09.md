# UI Admin 직접 의존성 점검 — 0.18.09

## 목적

AdminButton/AdminCard shim 적용 이후에도 화면 파일에 남아 있는 직접 Tailwind class 반복과 App* 래퍼 미적용 지점을 다음 단계에서 안전하게 줄이기 위한 점검 문서다.

이번 버전은 동작 코드 대량 변경 없이 영향 범위를 분리한다. 작업지시서/R2/첨부/메모/휴지통/purge 흐름은 건드리지 않는다.

## 현재 확인된 우선 점검 영역

### 관리자 공통/시맨틱 계층

- `components/admin/common/adminSemanticClassNames.ts`
  - 직접 class 정의가 많은 중심 파일이다.
  - 당장 제거 대상이 아니라 Admin 전용 semantic token 보관소로 유지하는 것이 안전하다.
  - 다음 단계에서는 AppCard/AppButton/AppBadge variant와 중복되는 표현만 선별해 정리한다.

- `components/admin/common/AdminTable.tsx`
  - 테이블형 화면의 공통 구조 후보이다.
  - TanStack Table 적용 전까지는 바로 갈아엎지 않고, 저장소/멤버/감사로그 중 한 화면을 선정한 뒤 AppTable 래퍼 필요성을 판단한다.

### 직접 class 반복이 많은 관리자 화면 후보

- `components/admin/companies/AdminCompanyOnboardingGate.tsx`
  - 카드/안내/업로드 영역 class 밀도가 높다.
  - 고객사 온보딩 흐름과 파일 업로드 흐름이 엮여 있으므로 UI 래퍼 정리만 별도 진행해야 한다.

- `components/admin/files/FileStorageSummary.tsx`
  - 저장소 요약 카드/사용량 표현 class 반복이 많다.
  - AppCard/AppBadge 후보로 적합하지만 저장소 수치 계산 로직은 건드리지 않는다.

- `components/admin/dashboard/AdminOperationsDashboard.tsx`
  - 운영 홈 카드형 UI 반복이 많다.
  - AppCard variant 정리 이후 적용하는 것이 안전하다.

- `components/admin/files/fileTrashSectionPresentation.tsx`
  - 휴지통 row/상태/선택 UI class 반복이 많다.
  - 휴지통 delete/restore/purge 정상 흐름과 엮여 있으므로 기능 로직은 변경하지 않는다.

- `components/admin/settings/AdminCompanySettingsForm.tsx`
  - 폼 구조와 안내 문구 class 반복이 많다.
  - React Hook Form + Zod 전환 후보지만, 기존 저장 흐름을 먼저 유지한다.

- `components/admin/members/AdminMemberPermissionDetailBody.tsx`
  - 권한 카드/체크 영역 class 반복이 많다.
  - 권한 도메인 로직과 UI class를 분리하는 방식으로 접근한다.

## 작업지시서/원단·부자재 쪽 후보

### 작업지시서

- `components/workorder/sidepanel/WorkOrderAttachmentPanel.tsx`
- `components/workorder/sidepanel/WorkOrderMemoPanel.tsx`
- `components/workorder/detail/shared/detailEditorShared.tsx`
- `components/workorder/detail/sections/*`

위 파일들은 카드/패널/입력/상태 class 반복이 많지만, 현재 업무 흐름이 안정화되어 있으므로 한 번에 정리하지 않는다. PC/tablet/mobile view 경계를 유지하면서 공통 UI 래퍼 적용 범위를 작게 나눈다.

### 원단·부자재

원단·부자재 화면은 PC 3분할, tablet/mobile 탭/sheet 구조가 섞여 있으므로 AppCard/AppButton/AppBadge 정리 이후 화면별로 진행한다. 모바일에서 3분할이 다시 노출되지 않도록 반응형 경계를 먼저 확인한다.

## 다음 적용 순서

1. AppCard variant 기준 확정
   - `surface`
   - `elevated`
   - `flat`
   - `interactive`
   - `compact`

2. AdminCard가 AppCard variant를 더 직접적으로 매핑하도록 정리
   - 기존 `pbp-admin-card`와 semantic class는 유지
   - variant 의미만 AppCard 기준으로 맞춘다.

3. AppButton variant 기준 확정
   - `primary`
   - `secondary`
   - `ghost`
   - `danger`
   - `subtle`
   - `icon`

4. AppBadge variant 기준 확정
   - status badge
   - count badge
   - info badge
   - warning badge
   - danger badge

5. 이후 화면별 class 반복 제거
   - 저장소 요약
   - 운영 홈 카드
   - 멤버 권한 카드
   - 휴지통 row

## 제외 범위

- DB schema 변경 없음
- API route 변경 없음
- R2/첨부/메모/휴지통/purge 흐름 변경 없음
- 작업지시서 상태 변경 로직 변경 없음
- package.json/package-lock.json 변경 없음
