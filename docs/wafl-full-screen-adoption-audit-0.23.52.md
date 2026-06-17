# WAFL 전 화면 적용·데이터 연결 감사 — 0.23.52

## 목적

전 화면의 WAFL 공통 컴포넌트 적용 상태, 직접 브라우저 제어, 직접 fetch, mock/fixture/seed 경계를 정량·정성 감사하고 후속 버전의 우선순위를 확정한다.

## 자동 감사 결과

`node scripts/audit-wafl-ui.mjs`

- 검사 소스: 1,073개
- 금지 legacy UI: 0건
- 업무 화면 native control 허용 파일: 2개
  - `components/workorder/WorkOrderOverlay.tsx`
  - `components/workorder/drawing/WorkOrderDrawingCanvasEditor.tsx`

### 영역별 참고 지표

| 영역 | 파일 | native control | direct fetch | native confirm | WAFL import |
|---|---:|---:|---:|---:|---:|
| system | 89 | 59 | 28 | 4 | 6 |
| admin | 281 | 49 | 41 | 3 | 92 |
| worker/workorder | 234 | 18 | 9 | 1 | 45 |
| material-orders | 40 | 0 | 2 | 1 | 17 |
| user | 11 | 0 | 3 | 1 | 5 |

이 수치는 위반 건수가 아니라 전환 후보를 찾기 위한 참고 지표다. 공통 primitive 내부의 native element, PDF/print HTML, canvas 접근, API client의 정상 fetch도 포함될 수 있으므로 파일 단위 검토가 필요하다.

## 정성 판단

### 1. 시스템관리자 — 최우선

- WAFL import 수가 6건으로 가장 낮고 native control 59건, direct fetch 28건이 확인되었다.
- 기준정보 화면에 직접 input/button 조합이 집중되어 있다.
- 주요 후보:
  - `components/system/standards/SystemUnitStandardsPage.tsx`
  - `components/system/standards/SystemProductTemplateStandardsPage.tsx`
  - `components/system/standards/SystemProcessStandardsPage.tsx`
  - `components/system/category-rules/CategoryRuleEditorPanel.tsx`
  - `components/system/companies/SystemCompanyApprovalConsole.tsx`
- 승인·반려·재입력·초대 mutation을 공통 lifecycle로 이동해야 한다.
- 0.23.54~0.23.55에서 데이터/기능과 UI를 분리해 정리한다.

### 2. 관리자 — 두 번째

- WAFL/Admin 공통화가 상당 부분 존재하지만 direct fetch 41건과 native control 49건이 남아 있다.
- 주요 후보:
  - `components/admin/members/AdminMemberManagementDashboard.tsx`
  - `components/admin/settings/AdminSettingsHub.tsx`
  - `components/admin/companies/AdminCompanyOnboardingGate.tsx`
  - `components/admin/standards/AdminItemCategoryManagementModal.tsx`
- `lib/admin/mockDataAudit.ts`에 기록된 샘플·seed·fixture 경계를 실제 production 동작과 다시 대조해야 한다.
- 운영 통계 조회 실패 시 mock 수치 자동 대체는 제거 대상으로 유지한다.

### 3. worker/workorder — UI 밀도 우선

- 실제 경로는 `/worker`이며 기존 계획의 `/workers` 표현은 동일 화면을 뜻한다.
- 업무 화면 자체는 WAFL 기반이 비교적 많이 적용되어 있다.
- native control 대부분은 drawing canvas와 print HTML이며 일반 폼 위반으로 단정하지 않는다.
- 다음 버전 0.23.53에서는 전체 화면 크기, 카드 padding, 행 높이, 패널 비율, PC/태블릿/모바일 밀도를 우선 정리한다.

### 4. 자재 발주 — 비교적 안정

- native control 0건으로 공통 컴포넌트 적용 상태가 가장 안정적이다.
- direct fetch 2건은 `lib/material-orders/materialOrderWorkspaceClient.ts`의 API client 경계다.
- 목록 삭제 확인의 `window.confirm` 1건은 WAFL ConfirmModal 전환 후보로 남긴다.

### 5. 일반 사용자 — 범위는 작으나 마감 필요

- WAFL import 5건, native control 0건이다.
- `components/me/PersonalSettingsPage.tsx`의 direct fetch 3건과 native confirm 1건을 공통 API/mutation lifecycle로 옮길 필요가 있다.

## mock·fixture·seed 판단

- 단순 문자열 검색으로 production mock 배열을 확정할 수 없으므로 자동 감사 수치에 mock 건수를 직접 포함하지 않았다.
- 현재 코드에 명시된 감사 기준:
  - 시스템 관리자 샘플 운영 데이터: 실제 DB 플로우 도입 후 seed 분리
  - 권한 미리보기 fixture: 테스트 전용 격리
  - 협력업체 기본값: 회사 초기 seed로 명확화
  - 관리자 통계 fallback mock: 제거 대상
  - 작업지시서 fixture: 고객 화면과 분리
- 실제 제거는 0.23.54, 0.23.56, 0.23.64에서 화면별 API 실패 동작까지 확인하며 진행한다.

## 작업 순서 확정

1. 0.23.53 `/worker` 화면 크기·밀도 축소
2. 0.23.54 시스템관리자 실제 데이터·mutation 정리
3. 0.23.55 시스템관리자 WAFL UI 전환
4. 0.23.56 관리자 WAFL UI·저장 경로 정리
5. 0.23.57 일반 사용자 화면 전환
6. 0.23.58 작업지시서·발주서 최종 감사
7. 0.23.59 전체 반응형 통일

## 이번 버전 변경

- `audit-wafl-ui.mjs`에 영역별 참고 지표 출력 추가
- 기존 실패 판정 규칙은 변경하지 않음
- 감사 결과 문서화
- `APP_VERSION` 0.23.52 반영
- DB Migration 없음
