# 58. member/workorder/storage status constants 후보 조사

## 목적

0.15.34에서 회사/가입/초대 계열 status constants를 만든 뒤, 다음으로 분리해야 할 member/workorder/storage 상태값 후보를 확인하고 일부 저위험 항목을 상수화한다.

이번 문서는 기능 추가가 아니라 도메인 상태값 정리 기준 문서다. 화면 문구, DB 저장값, API 응답값, presentation label을 섞지 않는 것을 목표로 한다.

## 이번 버전 반영 범위

- `lib/domain/memberStatus.ts` 추가
- `lib/domain/storageStatus.ts` 추가
- 멤버 관리 repository/route 일부 직접 문자열 비교를 member status constants 기반으로 치환
- admin storage selector의 파일 lifecycle normalize 로직을 storage domain helper로 위임
- workorder 상태값은 이미 `lib/constants/workorderStates.ts`에 주요 상수와 helper가 있으므로 이번 버전에서는 추가 이동 없이 후보 문서화만 한다.

DB schema, SQL check constraint, API 응답 포맷, R2 흐름은 변경하지 않는다.

## member status 기준

도메인 값:

```txt
approved
pending
rejected
suspended
```

정리 기준:

- DB 저장값은 영문 code만 사용한다.
- 화면 label은 i18n/presentation 계층에서 만든다.
- `current.status === "approved"` 같은 비교는 `isApprovedAdminCompanyMemberStatus` 또는 `ADMIN_COMPANY_MEMBER_STATUS.approved` 기준으로 정리한다.
- route query의 `all`은 DB status가 아니라 filter value로 분리해서 관리한다.

후속 후보:

```txt
lib/admin/members/memberManagementPresentation.ts
- status: "ready" | "planned" | "pending" 계열은 화면 준비 상태라 member DB status와 분리 유지

lib/admin/members/memberRouteHandlers.ts
- error code/status code 매핑은 다음 error domain 정리 때 분리 후보

lib/admin/settings/sessionScope.ts
- company_admin 예외와 approved member 판정 helper 추가 후보
```

## storage status 기준

현재 구분:

```txt
AdminFileLifecycleStatus:
- ACTIVE
- DELETED
- TEMP

AdminTrashPurgeStatus:
- pending
- purge_requested
- processing
- purged
- failed
- restored
```

정리 기준:

- lifecycle status는 UI tab/filter를 위한 정규화 값이다.
- purge status는 DB/R2 삭제 진행 상태다.
- `active`, `trashed`, `purged`, `temp` raw value를 화면 selector 안에서 직접 비교하지 않고 domain helper로 모은다.
- 고객사 휴지통 표시 정책과 시스템관리자 purge 후보 정책은 계속 `lib/admin/files/trashPolicy.ts`를 기준으로 유지한다.

후속 후보:

```txt
lib/admin/files/trashPolicy.ts
- purge status SQL list와 TS constants 동기화 강화

lib/system/storagePurgeCandidates.ts
- candidateKind file/workorder constants 분리 후보
- purgeStatus summary count helper 분리 후보

lib/admin/adminFiles.serverActions.ts
- workorder status label 변환 로직을 workorder presentation/helper로 이동 후보
```

## workorder status 기준

현재 기준 파일:

```txt
lib/constants/workorderStates.ts
```

이미 존재하는 주요 값:

```txt
WORKFLOW_STATES
DISPLAY_STAGES
ORDER_INSPECTION_STATUSES
ORDER_INSPECTION_STATUS
```

주의점:

- workorder는 영향 범위가 크므로 0.15.35에서는 직접 변경하지 않는다.
- `lib/admin/adminOperations.repository.ts`, `lib/admin/adminFiles.serverActions.ts` 등에 남은 workflow string 비교는 다음 단계에서 기존 `workorderStates` helper를 재사용하는 방식으로 정리한다.
- 한글 상태 label은 i18n 또는 presentation helper에서만 생성해야 한다.

후속 후보:

```txt
0.15.36 — workorder status usage 정리 1차
- adminOperations repository의 review/inspection 직접 비교 축소
- adminFiles.serverActions의 status label 변환을 common helper로 이동
- completed/inspection/rejected 조건을 workorderStates helper로 통일
```

## 다음 권장 작업

```txt
0.15.36 — workorder status usage 정리 1차
0.15.37 — storage purge status/trash policy constants 동기화
0.15.38 — member permission/status error code presentation 분리
```
