# 0.19.53 소스 전체 리팩토링 분석 1차

## 목적

0.19.37~0.19.52에서 WAFL UI 공통화가 빠르게 진행되었으므로, 다음 기능 개발 전에 전체 소스 구조를 점검하고 리팩토링 우선순위를 분리한다.

이번 버전은 분석 문서화가 목적이다. 실제 기능 코드, DB/API/R2/PDF/첨부/메모/휴지통/작업지시서/원단·부자재 발주 흐름은 변경하지 않는다.

## 현재 기준

- 기준 버전: 0.19.52
- 다음 버전: 0.19.53
- 분석 기준 파일 수
  - app: 118 files
  - components: 308 files
  - features: 17 files
  - lib: 531 files
  - db: 20 files
  - docs: 339 files
- TypeScript/TSX 대상: 약 972 files
- TS/TSX 총 라인 수: 약 117,944 lines
- `use client` 파일: 약 198 files
- app/api route 파일: 68 files, 약 4,996 lines

## 구조 판단

### 1. UI 공통화 상태

공통 UI 기반은 1차로 구축된 상태다.

이미 도입된 주요 공통 계층:

- `WaflButton`
- `WaflActionButton`
- `WaflToast`
- `WaflModal`
- `WaflStateBlock / WaflEmptyState / WaflLoadingState / WaflErrorState`
- `WaflDataTable`
- `WaflSettingCard`
- `WaflSettingsSectionGroup`
- `AdminButton` adapter
- `AdminIconActionButton` adapter
- `WorkOrderActionButton` adapter
- `MaterialOrderActionButton` adapter

판단:

- 고객사 관리자 주요 화면은 제품 UI 기준이 어느 정도 맞춰졌다.
- 작업지시서와 원단·부자재 발주 화면은 복잡도가 높아 제한 적용만 되어 있다.
- 시스템관리자/개발·디버그/일부 모달/문서 미리보기 영역에는 직접 style class가 아직 많이 남아 있다.

### 2. 직접 style class 잔여

검색 기준으로 `bg-white`, `stone-*`, `slate-*`, `gray-*`, `zinc-*`, `neutral-*`, `gradient`, `from-*`, `to-*` 등 직접 class가 아직 약 1,198건 남아 있다.

상위 잔여 파일 예시:

- `components/common/modal/orderRequest/OrderRequestDocumentPreview.tsx`
- `components/system/invitations/SystemCustomerInviteSkeleton.tsx`
- `components/system/billing/SystemCompanyPlanSkeleton.tsx`
- `components/admin/invitations/CompanyMemberInviteSkeleton.tsx`
- `components/debug/AdminHistoryDebugPanel.tsx`
- `components/admin/standards/AdminFilePolicySettingsModal.tsx`
- `components/debug/OrderInfoHubDebugPanel.tsx`
- `app/dev/test-console/DevTestConsoleClient.tsx`
- `components/system/audit/SystemAuditLogsDesignPage.tsx`
- `components/workorder/detail/sections/device/WorkOrderDetailMobileOrderInfoSection.tsx`
- `components/workorder/detail/sections/device/WorkOrderDetailTabletOrderInfoSection.tsx`
- `components/common/date/PbpSingleDatePicker.tsx`

판단:

- 고객사 관리자 메인 5화면보다 시스템관리자/디버그/작업지시서 세부 섹션/미리보기 쪽 잔여가 많다.
- 0.19.54에서 전체를 한 번에 지우면 위험하다.
- 화면군별로 분리해서 2~4회에 나누어 정리해야 한다.

### 3. 대형 파일과 복잡도

라인 수 기준 대형 파일:

- `lib/i18n/en/admin.ts` 약 2,353 lines
- `lib/i18n/ko/admin.ts` 약 2,280 lines
- `lib/invitations/joinRequestRepository.ts` 약 1,906 lines
- `lib/admin/adminFiles.serverActions.ts` 약 1,329 lines
- `components/workorder/drawing/WorkOrderDrawingCanvasEditor.tsx` 약 1,210 lines
- `components/admin/members/AdminMemberManagementDashboard.tsx` 약 1,103 lines
- `lib/workorder/api/workOrderRouteHandlers.ts` 약 1,047 lines
- `lib/system/storagePurgeCandidates.ts` 약 988 lines
- `components/system/companies/SystemCompanyApprovalConsole.tsx` 약 948 lines
- `components/admin/companies/AdminCompanyOnboardingGate.tsx` 약 932 lines

판단:

- 대형 파일은 바로 분해하지 말고, 먼저 책임 단위와 테스트 포인트를 문서화해야 한다.
- 특히 `joinRequestRepository`, `adminFiles.serverActions`, `workOrderRouteHandlers`, `storagePurgeCandidates`는 DB/R2/권한/상태와 연결되어 있어 저위험 정리 대상이 아니다.
- UI 파일 중 `AdminMemberManagementDashboard`, `SystemCompanyApprovalConsole`, `AdminCompanyOnboardingGate`는 컴포넌트 분리 후보지만 기능 상태와 권한 흐름을 먼저 확인해야 한다.

### 4. API route thin 여부

app/api route는 68개, 약 4,996 lines다.

상대적으로 긴 route:

- `app/api/material-orders/route.ts` 약 287 lines
- `app/api/workorders/memos/route.ts` 약 281 lines
- `app/api/workorders/[workOrderId]/generated/order-request-pdf/route.ts` 약 274 lines
- `app/api/admin/companies/onboarding/route.ts` 약 270 lines
- `app/api/workorders/attachments/upload/complete/route.ts` 약 255 lines
- `app/api/admin/files/snapshot/route.ts` 약 199 lines
- `app/api/admin/partners/route.ts` 약 197 lines
- `app/api/workorders/attachments/delete/route.ts` 약 189 lines
- `app/api/workorders/status/route.ts` 약 180 lines
- `app/api/workorders/attachments/upload/route.ts` 약 172 lines

판단:

- 일부 route는 아직 thin하지 않다.
- 다만 기존 정상 동작 중인 DB/R2/PDF 흐름과 직접 연결되어 있으므로 바로 route 분해 작업을 하지 않는다.
- 기능 추가 전에 route별 책임 분리 후보를 문서화한 뒤, 가장 안전한 읽기 전용 route부터 정리하는 편이 낫다.

### 5. 클라이언트 컴포넌트 비중

`use client` 파일이 약 198개다.

대형 client 파일:

- `components/workorder/drawing/WorkOrderDrawingCanvasEditor.tsx`
- `components/admin/members/AdminMemberManagementDashboard.tsx`
- `components/system/companies/SystemCompanyApprovalConsole.tsx`
- `components/admin/companies/AdminCompanyOnboardingGate.tsx`
- `lib/hooks/workorder/useWorkOrderWorkflowActions.ts`
- `features/workorders/controllers/useWorkOrderWorkspaceController.ts`
- `components/admin/settings/AdminSettingsHub.tsx`
- `components/admin/files/fileTrashSectionModals.tsx`

판단:

- 대형 client 파일은 렌더링·상태·API 호출이 섞여 있을 가능성이 높다.
- 기능 추가 전에는 hooks/controller/view-model 분리를 늘리는 것이 좋다.
- 단, 작업지시서와 원단·부자재 발주는 현재 안정 흐름을 우선 보존한다.

## 위험도별 리팩토링 분류

### A. 저위험 — 바로 가능

다음은 0.19.54~0.19.55에서 처리해도 비교적 안전하다.

- 공통 UI 문서와 실제 export 명칭 정렬
- 사용되지 않는 docs 중복 링크 정리 문서화
- `AdminButton`, `AdminIconActionButton`, `AppButton` adapter 사용 규칙 문서 보강
- 고객사 관리자 화면 잔여 hardcoded class 검색 문서 추가
- 시스템관리자/디버그 화면은 실제 변경 전 목록만 분류
- 이미 공통 컴포넌트로 대체된 wrapper의 import 경로 통일

### B. 중위험 — 화면별로 나누어 가능

다음은 작은 패치 단위로만 진행한다.

- 시스템관리자 화면 style token 정리
- 작업지시서 detail device section의 직접 class 정리
- 모달별 footer/button 정렬 통일
- skeleton/preview 컴포넌트 token 정리
- `AdminMemberManagementDashboard` 일부 표시 컴포넌트 분리
- `AdminSettingsHub` 하위 섹션 추가 분리

### C. 고위험 — 기능 추가 전 설계 필요

다음은 바로 리팩토링하지 않는다.

- `lib/invitations/joinRequestRepository.ts`
- `lib/admin/adminFiles.serverActions.ts`
- `lib/workorder/api/workOrderRouteHandlers.ts`
- `lib/workorder/persistence/dbAttachmentMemoRepository.ts`
- `lib/system/storagePurgeCandidates.ts`
- `lib/material-orders/repository.ts`
- R2 upload/delete/purge 흐름
- PDF 생성 route
- 작업지시서 workflow 상태 변경 hooks
- 원단·부자재 자재 할당/상태 변경 repository

## 기능 추가 전 권장 순서

### 0.19.54 — 저위험 UI/export 정리 1차

목표:

- 공통 UI export/import 경로 점검
- adapter 명칭과 문서 기준 정렬
- 공통 UI 사용 규칙 문서 보강
- 실제 기능 코드 변경 최소화

### 0.19.55 — 시스템관리자/디버그 legacy style 잔여 분류

목표:

- 시스템관리자 화면과 디버그 화면의 직접 style class 목록화
- 실제 style 변경은 최소화
- 다음 token cleanup 범위 결정

### 0.19.56 — 작업지시서/원단부자재 위험 영역 상세 분석

목표:

- 작업지시서 workflow, PDF, R2, 첨부, 메모, 담당자 변경 흐름 분석
- 원단·부자재 발주 생성, 상태 변경, PDF, 자재 할당 흐름 분석
- 기능 추가 시 건드리면 안 되는 경계 정의

### 0.19.57 — 기능 추가 로드맵 재정렬

목표:

- 사용자가 추가하려는 기능 목록을 화면/DB/API/권한 영향도별로 재정렬
- 작은 UI 보정, DB/API 필요 기능, 운영 기능, 시스템관리자 기능으로 분류

## 기능 개발 우선순위 제안

현재 상태에서는 다음 순서가 안전하다.

1. 핵심 업무 화면의 작은 기능 수정
   - 작업지시서 버튼/문구/상태 표시
   - 원단·부자재 입력/표시 보정
   - PDF 문구/표시 보정
   - 권한별 버튼 표시 보정

2. 멤버/권한/운영 관리
   - 멤버 탈퇴/비활성/승인 흐름
   - 멤버 권한 변경 이력
   - 고객사 관리자 요청 관리

3. 환경설정 실제 기능
   - 회사정보 변경 요청 처리
   - 기준정보 설정 완성
   - 정책/약관 표시와 변경 이력

4. 시스템관리자 운영 화면
   - 고객사 관리
   - 요금제/용량
   - 감사로그
   - 결제 이력

5. 외부 연동
   - 이메일 발송 자동화
   - 결제/PG
   - 데이터 내보내기
   - SMS/카카오 공유

## 결론

UI 1차 공통화는 다음 기능 개발로 넘어갈 수 있는 수준까지 왔다. 다만 코드베이스 전체는 아직 안정화 전이다.

다음 2~4개 버전은 대규모 리팩토링이 아니라, 분석 기반의 저위험 정리로 진행하는 것이 맞다. 기능 개발은 0.19.57 이후에 화면·DB·API·권한 영향도별로 재정렬한 뒤 시작하는 편이 안전하다.
