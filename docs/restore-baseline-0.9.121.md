# PeaceByPiece 복구 기준선 0.9.129

## 기준

- 기준 브랜치: `restore-from-0.9.77`
- 기준 UI/기능: `0.9.77`
- 새 진행 버전: `0.9.129`

## 복구 판단

`0.9.77`은 기존 UI와 주요 기능이 살아 있고, 로컬에서 `.next` 삭제 후 `npm run build`가 통과한 안정 기준선이다. 이후 `0.9.108`부터 진행된 read-only/skeleton route 복구 변경은 본 기능을 대체하거나 우회한 임시 안정화 성격이 있으므로, 이 복구 라인에는 자동 병합하지 않는다.

## 유지 원칙

1. 기존 작업지시서 UI와 관리자/시스템 화면의 살아 있는 기능을 우선 보존한다.
2. `0.9.78`부터 `0.9.120`까지의 변경은 필요한 경우에만 파일 단위로 선별 이식한다.
3. read-only/skeleton 화면으로 기존 본 기능 화면을 덮어쓰지 않는다.
4. DB schema 변경은 별도 명시 전까지 금지한다.
5. `package.json`, `package-lock.json`, `.env.local`은 수정하지 않는다.
6. R2/Neon/API 관련 변경은 실제 필요성과 영향 범위를 확인한 뒤 별도 버전에서 적용한다.
7. 정상 동작 중인 업로드, 삭제, 표시, repository 흐름은 변경 목표 없이 수정하지 않는다.

## 0.9.78~0.9.120 선별 이식 판단표

| 구간 | 판단 | 처리 방향 |
| --- | --- | --- |
| 0.9.78~0.9.107 | 부분 검토 대상 | R2, Neon, 첨부/메모, 빌드 안정화처럼 현재 복구 UI와 충돌하지 않는 수정만 파일 단위로 확인한다. |
| 0.9.108~0.9.120 | 기본 제외 대상 | read-only/skeleton route 복구, 임시 화면 대체, provider 오류 회피용 화면 단순화는 자동 병합하지 않는다. |
| R2/스토리지 수정 | 별도 검증 후 선별 | 업로드, 삭제, 다운로드, 대표 이미지, 메모 첨부 흐름을 실제 동작 기준으로 나누어 검토한다. |
| Neon/repository 수정 | 별도 검증 후 선별 | 현재 살아 있는 UI가 기대하는 API 응답과 repository 계약을 유지하는 항목만 검토한다. |
| admin/system 임시 화면 | 제외 | 기존 본 기능 화면을 read-only 화면으로 덮는 변경은 가져오지 않는다. |

## 선별 이식 원칙

1. 먼저 현재 0.9.129 복구 라인의 build와 화면을 기준으로 삼는다.
2. 필요한 변경은 하나의 기능군 단위로만 가져온다.
3. 화면 대체, route skeleton, 임시 read-only 페이지는 가져오지 않는다.
4. DB schema 변경이 필요한 항목은 별도 버전에서 검토만 하고 즉시 적용하지 않는다.
5. package 의존성 변경이 필요한 항목은 현재 복구 라인에서는 제외한다.
6. 가져온 변경은 반드시 기존 UI/기능을 유지하는지 확인한 뒤 다음 버전으로 넘긴다.

## 이후 권장 순서

### 0.9.122

복구 기준 문서에 `0.9.78`부터 `0.9.120`까지의 선별 이식 판단 기준을 추가한다. 코드 기능 변경은 하지 않고, APP_VERSION과 문서만 갱신한다.

### 0.9.123

R2 업로드, 다운로드, 삭제, 대표 이미지, 메모 첨부 등 스토리지 관련 현재 구조를 `docs/attachment-memo-r2-audit-0.9.123.md`에 문서화한다. 기능 코드는 변경하지 않고 다음 이식 후보만 분류한다.

### 0.9.124

첨부 다운로드 URL 생성 로직을 최소 보완했다. `storageKey`가 있는 DB 첨부는 기존 file API를 사용하고, mock/sample/임시 URL은 직접 URL을 유지하도록 분기했다. `attachmentFileRoute`, Worker, 업로드, 삭제, 대표 이미지 코드는 수정하지 않았다.

### 0.9.125

메모 DB 저장과 상태전환 후 유지 문제를 우선 보완했다. workorder PATCH 저장에서 `memoThreads` 전체 replace를 수행하지 않도록 하여, 검토완료 등 상태 변경이 별도 메모 API로 저장된 DB 메모를 삭제하거나 재삽입하지 않게 했다. 기존 replace helper에는 `company_id`, `company_name`을 포함해 not-null 제약 위반 가능성을 줄였다.

### 0.9.126

첨부 업로드 경로를 Worker 기준으로 정리했다. 브라우저 업로드 클라이언트가 Worker PUT 실패 시 `/api/workorders/attachments/upload/direct` 서버 fallback을 호출하지 않도록 변경했고, direct upload route는 R2 SDK 업로드를 수행하지 않고 410 응답만 반환하도록 막았다. R2 직접 SDK 업로드 방식으로 되돌리지 않는다.

### 0.9.127

첨부 삭제/복구/대표 이미지 흐름의 QA 기준을 문서화했다. 작업지시서 일반 삭제와 관리자 파일관리 영구삭제/R2 물리 삭제를 분리하고, 대표 이미지 지정, 휴지통 복구, Worker purge, 메모 회귀 확인 절차를 `docs/attachment-trash-primary-qa-0.9.127.md`에 고정했다.

### 0.9.128

Neon/repository 연결 상태를 점검했다. workorder, attachment, memo, partner, admin files/settings/stats, system/company/billing/invitation 영역의 repository 경계와 직접 DB/API 접근 금지 기준을 `docs/repository-connection-audit-0.9.128.md`에 문서화했다. 기능 코드는 변경하지 않았다.


### 0.9.129

작업지시서 핵심 flow 회귀 테스트 기준을 문서화했다. 작성중, 검토요청, 검토완료, 발주요청, 생산/검수, 완료 상태 변경 후 제목, 담당자, 발주정보, 생산구성, 첨부, 대표 이미지, 메모, DB 저장 상태가 유지되는지 확인하는 체크리스트를 `docs/workorder-flow-qa-0.9.129.md`에 고정했다. 기능 코드는 변경하지 않았다.

### 0.9.130

첨부 썸네일 Worker 업로드 실패 로그를 안전화하고, 대표 이미지/썸네일 규칙을 `docs/attachment-primary-thumbnail-rules-0.9.130.md`에 문서화했다. 원본 업로드 성공 흐름을 유지하고, R2 직접 SDK fallback은 재도입하지 않았다.

### 0.9.131

첨부 표시 URL helper에서 `thumbnail_key` 기반 썸네일 URL을 우선 생성하도록 보완했다. 미리보기/다운로드는 원본 key 기준을 유지했다.

### 0.9.132

DB/API 응답 필드명이 snake_case로 넘어오는 경우를 고려해 `thumbnail_key`, `storage_key` 호환 처리를 보완했다.

### 0.9.133

DB attachments 조회 시 `thumbnail_key` hydrate 누락을 보완해 작업지시서 카드 표시에서 실제 썸네일 key를 사용할 수 있게 했다.

### 0.9.134

관리자 콘솔 현재 기능 상태를 `docs/admin-console-audit-0.9.134.md`에 문서화했다. `/admin/partners`, `/admin/files`, `/admin/settings`를 read-only/skeleton으로 대체하지 않는 기준을 고정했다.

### 0.9.135

관리자 거래처/공장관리 화면의 저장 안정성을 보완했다. 거래처 생성/수정 저장 중 중복 클릭으로 POST/PATCH가 반복 호출되지 않도록 저장 진행 상태를 추가하고, 본 기능 UI를 유지하는 QA 기준을 `docs/admin-partner-master-stability-0.9.135.md`에 문서화했다.

## 제외 대상

- 기존 본 기능을 read-only 화면으로 대체한 변경
- skeleton route 복구용 임시 화면
- audit log 설계 또는 관련 DB schema 추가
- 결제 자동화
- 이메일 발송 자동화
- 인증/회원가입 고도화
- package 의존성 변경

## 0.9.130 추가 기준 — 썸네일 Worker와 대표 이미지 미세 로직

- 원본 첨부 업로드 성공 흐름은 유지한다.
- 썸네일 업로드 실패는 전체 첨부 업로드 실패로 처리하지 않는다.
- `INVALID_WORKER_FILE_REQUEST`가 발생하면 먼저 Cloudflare Worker가 최신 `cloudflare/r2-upload-worker.js`로 배포되었는지 확인한다.
- 대표 이미지 자동 지정/삭제 후 승계는 0.9.130에서 문서화하고, 실제 코드 적용은 0.9.131 이후로 분리한다.
- R2 직접 SDK 업로드/삭제 fallback은 재도입하지 않는다.



## 0.9.131 업데이트

- 첨부 카드/목록 표시에서 `thumbnail_key` 기반 썸네일 URL을 우선 사용할 수 있도록 보완했다.
- 원본 미리보기/다운로드 흐름은 기존 원본 `storage_key` 기준을 유지한다.
- 대표 이미지 자동 지정/삭제 후 승계 로직은 0.9.132 이후 별도 작업으로 분리한다.

## 0.9.132 보완 — 썸네일 표시 필드 호환

- 카드/목록 표시 URL 생성 시 `thumbnailKey`뿐 아니라 DB/API에서 넘어올 수 있는 `thumbnail_key`도 읽도록 보완했다.
- 다운로드 URL 생성 시 `storageKey`뿐 아니라 `storage_key`도 읽도록 보완했다.
- 미리보기/다운로드 원본 경로는 유지하고, 카드 표시만 썸네일 우선 규칙을 적용한다.
- 대표 이미지 자동 지정/삭제 후 승계 로직은 별도 버전으로 분리한다.

## 0.9.133 보완 기록

- DB `attachments.thumbnail_key`는 저장되어 있었으나 작업지시서 snapshot 조회 SELECT 목록에서 누락되어 프론트 attachment 객체까지 전달되지 않는 문제가 있었다.
- `dbAttachmentMemoRepository.listSnapshotByWorkOrderId`의 attachments 조회에 `thumbnail_key`를 포함해 카드/목록 표시 helper가 썸네일 URL을 선택할 수 있도록 보완했다.
- 원본 미리보기/다운로드, Worker 기반 R2 처리, DB schema는 변경하지 않았다.


## 0.9.134 관리자 콘솔 점검 기준

- 0.9.77 복구 라인 기준의 `/admin` 계열 화면을 본 기능, 부분 기능, redirect, API only 기준으로 분류한다.
- `/admin/partners`, `/admin/files`, `/admin/settings`는 기존 본 기능을 유지해야 하며, 0.9.108 이후의 read-only/skeleton 화면으로 대체하지 않는다.
- 기능 TS/TSX/API 코드는 변경하지 않고, 화면 진입 및 route 역할 점검 결과만 문서화한다.
- 관리자 콘솔 점검 이후에는 거래처/공장관리, 파일관리, 설정 화면 순서로 실제 기능 안정화를 진행한다.

### 0.9.136

관리자 파일관리 화면의 삭제/복구/영구삭제 요청 중복 실행을 방지했다. `/admin/files`의 본 기능 UI를 유지하면서 액션 진행 중 버튼 비활성화와 `처리 중` 표시를 추가했고, R2 실제 삭제는 기존 Worker 기반 purge 흐름으로 유지했다. DB schema, API 응답 포맷, 업로드/다운로드/미리보기 흐름은 변경하지 않았다.

### 0.9.137

관리자 설정 화면의 저장 안정성을 보완했다. `/admin/settings` 본 기능 UI는 유지하면서 테마/언어, 파일 정책, 알림 정책, 외주 공정 유형 저장 중 중복 클릭과 추가 변경을 제한했다. 고객사별 파일 보관 기간은 향후 시스템관리자 R2 purge 후보 산정의 기준값으로 문서화했지만, DB schema와 실제 purge 기능은 변경하지 않았다.

### 0.9.138

시스템관리자 콘솔의 현재 기능 상태를 문서화했다. `/system`은 부분 기능 shell, `/system/billing`과 `/system/invites`는 skeleton, `/system/category-rules`는 본 기능 유지 대상, `/api/system/*`는 API only/부분 기능으로 분류했다. 전체 고객사 파일 보관 정책과 R2 purge 후보 관리 기능은 `/system/storage-usage` 또는 `/system/files` 후보로 분리해 0.9.139 이후 설계하기로 했다. DB schema와 실제 purge action은 변경하지 않았다.

### 0.9.139

전 고객 공통 30일 휴지통 보관 정책을 확정했다. 고객관리자 저장정책 모달에서 삭제 방식과 보관기간 선택 UI를 제거하고, 삭제된 파일은 항상 휴지통으로 이동해 30일 동안 복원 가능하다는 안내로 정리했다. 기존 DB에 다른 보관기간 또는 즉시삭제 값이 남아 있어도 런타임 정책은 `softDeleteEnabled=true`, `trashRetentionDays=30`으로 고정한다. R2 실제 삭제는 즉시 수행하지 않고, 시스템관리자 purge 후보/실행 기능은 0.9.140 이후로 분리한다.
