# 0.19.08 토스트/피드백 전체 소스 전수 감사

## 목적

WAFL형 floating toast와 화면 내부 inline feedback box가 섞여 있는 지점을 먼저 분류한다. 이번 버전은 실제 UI 동작 변경이 아니라 0.19.09~0.19.10 공통화 전에 변경 대상을 고정하는 감사 문서 작성이 목표다.

## 변경 범위

- 변경함: `APP_VERSION`, 루트 README 기준 버전, 문서 인덱스, 본 감사 문서
- 변경하지 않음: 화면 컴포넌트, DB/API/R2, 첨부/메모, 휴지통/purge, 권한, 작업지시서 상태 전환, 원단·부자재 계산식

## 감사 기준

### floating toast로 유지하거나 전환할 항목

사용자 액션이 끝난 뒤 짧게 알려주면 충분한 결과 메시지다.

- 저장 완료
- 삭제 완료
- 복원 완료
- 비우기 완료
- 업로드 완료
- 새로고침 완료
- 검토 요청 완료
- 발주 요청 완료
- 권한 부족 같은 일회성 액션 차단 안내
- 액션 실패 요약

### inline feedback으로 유지할 항목

화면 안에 남아 있어야 사용자가 상태를 이해하거나 수정할 수 있는 메시지다.

- 화면 로드 실패
- 초기 데이터 없음 또는 빈 상태 안내
- 입력값 검증 오류
- 권한 없음으로 화면 사용 자체가 제한되는 안내
- 설정 저장 실패 상세
- 모달 내부에서 사용자가 다시 조치해야 하는 오류
- 승인/가입 대기처럼 현재 상태를 계속 보여줘야 하는 안내

## 현재 공통 컴포넌트 상태

| 구분 | 현재 파일 | 판단 |
|---|---|---|
| WAFL floating toast 레이어 | `components/common/AppToaster.tsx` | Sonner 기반이며 `rounded-2xl`, WAFL token, bottom-center 기준이 이미 있음 |
| toast 호출 adapter | `components/common/ToastMessage.tsx` | `success`, `warning`, `danger`, `info` tone을 Sonner 호출로 연결함 |
| inline feedback box | `components/admin/common/AdminFeedbackMessage.tsx` | 화면 내부 오류/안내 박스로 유지할 대상 |
| 작업지시서 overlay | `components/workorder/WorkOrderOverlay.tsx` | 처리중 상태는 자체 floating status, 완료/실패는 `ToastMessage` 사용 |

## 화면별 감사 결과

### 작업지시서 화면

| 대상 | 발견 지점 | 현재 형태 | 후속 판단 |
|---|---|---|---|
| 작업지시서 action 결과 | `components/workorder/WorkOrderOverlay.tsx` | `ToastMessage` | floating toast 유지 |
| 처리중 안내 | `components/workorder/WorkOrderOverlay.tsx` | `pbp-toast pbp-toast--processing`, `role="status"`, `aria-live="polite"` | floating status 유지. 0.19.09에서 WAFL toast와 시각 기준만 비교 |
| workflow 검증 | `components/common/modal/WorkflowValidationModal.tsx` | 모달 내부 목록 | inline/modal feedback 유지 |
| 거절 사유 안내 | `components/workorder/detail/RejectionReasonNotice.tsx` | 화면 내부 notice | inline 유지 |

### 원단·부자재 발주/기준정보 화면

| 대상 | 발견 지점 | 현재 형태 | 후속 판단 |
|---|---|---|---|
| 저장/수정/삭제/새로고침 성공 | `features/materials/MaterialsWorkspacePage.tsx` | `ToastMessage` + eventKey | floating toast 유지 |
| 권한 부족 | `features/materials/MaterialsWorkspacePage.tsx` | warning toast | floating toast 유지 |
| API 실패 | `features/materials/MaterialsWorkspacePage.tsx` | inline message + danger toast 동시 사용 | 0.19.09에서 유지 여부 결정. 상세는 inline, 요약은 toast가 적합 |
| 화면 내부 오류 박스 | `features/materials/MaterialsWorkspacePage.tsx` | 직접 `<p className="rounded-2xl border ...">` | `AdminFeedbackMessage` 또는 별도 WorkspaceFeedback 후보 |

### 저장소관리

| 대상 | 발견 지점 | 현재 형태 | 후속 판단 |
|---|---|---|---|
| 삭제/복원/비우기 결과 | `components/admin/files/AdminFilesWorkspaceClient.tsx` | `ToastMessage` | floating toast 유지 |
| 결과 메시지 tone | `components/admin/files/AdminFilesWorkspaceClient.tsx` | tone 미지정 info | 0.19.09에서 성공/실패 tone 분리 후보 |
| 파일 목록 DB 조회 실패 | `components/admin/files/AdminFilesWorkspaceClient.tsx` | snapshot error message 기반 | 화면 로드 실패 성격이므로 inline 유지 후보 |
| 휴지통 confirm/상세 | `components/admin/files/fileTrashSectionModals.tsx` | modal content | toast 전환 대상 아님 |

### 멤버관리

| 대상 | 발견 지점 | 현재 형태 | 후속 판단 |
|---|---|---|---|
| 초대 생성/취소/권한 저장/승인 처리 결과 | `components/admin/members/AdminMemberManagementDashboard.tsx` | `ToastMessage` | floating toast 유지 |
| 멤버 목록/초대 목록 load 실패 | `components/admin/members/AdminMemberManagementDashboard.tsx` | section error state로 전달 | inline feedback 유지 |
| 멤버 목록 section feedback | `components/admin/members/AdminMemberDirectorySection.tsx` | `AdminFeedbackMessage` | 화면 내부 상태이므로 유지 |
| 초대 생성 panel 안내 | `components/admin/members/AdminMemberInviteBuilderPanel.tsx` | card/notice 형태 | inline 유지 |

### 환경설정

| 대상 | 발견 지점 | 현재 형태 | 후속 판단 |
|---|---|---|---|
| 회사 설정 저장 실패 | `components/admin/settings/AdminCompanySettingsForm.tsx` | `AdminFeedbackMessage` danger | inline 유지. 저장 실패 상세는 화면 내부에 남기는 편이 적합 |
| 회사 설정 저장 성공 | `components/admin/settings/AdminCompanySettingsForm.tsx` | 별도 toast 없음 | 0.19.10에서 성공 toast 추가 후보 |
| 정책/접근 preview | `components/admin/settings/AdminPolicyOverview.tsx`, `AdminUserAccessPreview.tsx` | card/notice | inline 유지 |

### 협력업체관리

| 대상 | 발견 지점 | 현재 형태 | 후속 판단 |
|---|---|---|---|
| 업체/기준정보 action 결과 | `features/materials/MaterialsWorkspacePage.tsx` 계열과 유사한 패턴 후보 | 일부 화면은 직접 message state 가능 | 0.19.10에서 실제 action result를 floating toast로 통일 후보 |
| 등록/수정 모달 오류 | `components/admin/partnerMaster/PartnerMasterFormModal.tsx`, `PartnerProcessManagementModal.tsx` | modal 내부 notice | inline/modal feedback 유지 |
| 검색/필터 빈 상태 | partner responsive/list 컴포넌트 | empty state | inline 유지 |

### 통계정보

| 대상 | 발견 지점 | 현재 형태 | 후속 판단 |
|---|---|---|---|
| 조회/분석 카드 상태 | `components/admin/dashboard/*`, stats 관련 컴포넌트 | card 내부 상태 | inline 유지 |
| 기간/그래프 값 없음 | stats period/graph 컴포넌트 | empty/notice | inline 유지 |
| 저장/삭제성 action | 현재 주 대상 아님 | - | toast 공통화 우선순위 낮음 |

### 시스템 저장소 사용량

| 대상 | 발견 지점 | 현재 형태 | 후속 판단 |
|---|---|---|---|
| purge 결과 | system storage page 계열 | action result 메시지 후보 | 0.19.10에서 floating toast 적용 후보 |
| 삭제 후보 없음/조회 실패 | system storage page 계열 | 화면 내부 상태 | inline 유지 |
| 시스템 기준정보 화면 message | `components/system/standards/SystemProcessStandardsPage.tsx`, `SystemProductTemplateStandardsPage.tsx`, `SystemUnitStandardsPage.tsx` | `<p className="rounded-2xl border ...">` 직접 message 다수 | 시스템 관리자 리팩토링 단계에서 별도 정리. 고객사 관리자 0.19.09~0.19.10 범위에서는 보류 |

## 중복/혼재 패턴

| 패턴 | 예시 | 판단 |
|---|---|---|
| `ToastMessage` 직접 사용 | 저장소, 멤버관리, 원단·부자재, 작업지시서 overlay | floating toast 표준 후보 |
| `AdminFeedbackMessage` 사용 | 멤버 section, 환경설정 저장 실패 | inline feedback 표준 후보 |
| 직접 `<p className="rounded-2xl border ...">` message | 원단·부자재 inline error, 시스템 기준정보 message | 후속 공통화 후보 |
| inline + toast 동시 사용 | 원단·부자재 API 실패 | 실패 상세와 요약을 분리할 수 있으나 남발 금지 |
| 자체 floating processing toast | 작업지시서 처리중 overlay | 진행 상태 전용으로 유지 가능 |

## 0.19.09 적용 후보

1. `components/admin/files/AdminFilesWorkspaceClient.tsx`
   - action result를 tone 있는 `ToastMessage`로 정리한다.
   - load failure는 inline 유지한다.
2. `components/workorder/WorkOrderOverlay.tsx`
   - 기존 `ToastMessage`는 유지한다.
   - 처리중 floating status의 시각 token만 WAFL toast와 충돌 없는지 점검한다.
3. `features/materials/MaterialsWorkspacePage.tsx`
   - 성공/권한/실패 toast는 유지한다.
   - 직접 `<p>` inline message를 공통 feedback 컴포넌트 후보로 분리한다.
   - API 실패 시 inline + toast 중복 노출 문구가 과한지 검토한다.

## 0.19.10 적용 후보

1. `components/admin/members/AdminMemberManagementDashboard.tsx`
   - feedback message는 `ToastMessage` 유지, 필요 시 tone/eventKey 구조로 보정한다.
2. `components/admin/settings/AdminCompanySettingsForm.tsx`
   - 실패는 inline 유지.
   - 저장 성공 toast가 없다면 추가 후보로 둔다.
3. 협력업체관리/시스템 저장소 사용량
   - action result message를 floating toast로 통일한다.
   - 조회 실패/빈 상태는 inline 유지한다.

## 테스트 위치

- `/workspace/workorders`
- `/workspace/material-orders`
- `/workspace/storage`
- `/workspace/members`
- `/workspace/settings`
- `/workspace/partners`
- `/workspace/stats`
- `/system/storage-usage`

## 확인할 것

- 화면 진입 시 시각 변화가 없어야 한다.
- 새 문서가 `docs/README.md`에서 링크되어야 한다.
- `README.md`, `docs/README.md`, `lib/constants/app.ts`, `commit-meta.md`의 버전이 0.19.08로 일치해야 한다.
- npm build는 사용자가 로컬에서 실행한다.

## 바뀌면 안 되는 것

- 저장/삭제/복원/비우기/purge 동작
- 작업지시서 상태 변경, 검토 요청, 발주 요청
- 원단·부자재 계산식과 저장 흐름
- 멤버 초대/승인/거절/권한 저장
- 협력업체 등록/수정/기준정보 저장
- DB/API/R2/첨부/메모/휴지통/purge 흐름
- 권한 차단 기준

## 다음 작업

- 0.19.09: 저장소관리, 작업지시서, 원단·부자재 발주 쪽 WAFL floating toast 공통화 1차
- 0.19.10: 멤버관리, 환경설정, 협력업체관리, 시스템 저장소 사용량 쪽 WAFL floating toast 공통화 2차
