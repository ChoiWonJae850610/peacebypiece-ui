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


## 0.9.140 — 시스템관리자 R2 실제 삭제 후보 화면 1차

전 고객 공통 30일 휴지통 정책을 기준으로 `/system/storage-usage` 화면을 추가했다. 30일 경과 또는 영구삭제 요청된 휴지통 파일을 시스템관리자가 확인할 수 있도록 고객사명, 작업지시서명, 파일명, 삭제일, 삭제 예정일, 원본 `storage_key`, 썸네일 `thumbnail_key`, purge 상태를 표시한다. 실제 R2 삭제 실행은 아직 연결하지 않았고, 선택 삭제/전체 삭제 버튼은 비활성 상태로 둔다. 기존 시스템 콘솔의 스토리지 버튼은 즉시 purge 실행 모달이 아니라 후보 목록 화면으로 이동하도록 변경했다. DB schema, R2 Worker, package 파일은 수정하지 않았다.

## 0.9.141 업데이트 — 시스템관리자 R2 purge 수동 실행 1차

- `/system/storage-usage`에서 삭제 후보를 선택해 Worker 기반 R2 실제 삭제를 요청할 수 있도록 연결했다.
- 전체 도래 항목 삭제도 수동 버튼으로 연결했다.
- 실제 삭제 대상은 원본 `storage_key`와 썸네일 `thumbnail_key`를 함께 포함한다.
- 삭제 성공 시 DB purge 상태를 완료로 표시하고, 실패 시 실패 사유를 남긴다.
- 자동 purge 스케줄러, DB schema 변경, R2 직접 SDK 삭제는 포함하지 않는다.

## 0.9.142 보완 기록

- `/system/storage-usage`의 R2 purge 후보 목록에 삭제 판단용 미리보기를 추가했다.
- 미리보기는 `thumbnail_key`를 우선 사용하고, 이미지 파일에 한해 원본 key fallback을 허용한다.
- PDF/비이미지는 파일 타입 뱃지로 표시한다.
- 선택 삭제 또는 전체 삭제 후 `router.refresh()`로 후보 목록과 요약 카드가 갱신되도록 했다.
- 0.9.141 selected purge 후보 조회 SQL의 불필요한 괄호를 보완했다.
- R2 직접 SDK 삭제 방식은 계속 금지하고 Worker 기반 삭제만 유지한다.



## 0.9.143 — 시스템관리자 R2 purge 표시/재시도 UX 보완

- `/system/storage-usage`에서 `thumbnail_key`가 없는 이미지 후보는 `썸네일 없음 · 원본 표시`로 명확히 표시한다.
- PDF/비이미지 후보는 이미지 요청 없이 파일 타입 뱃지로 유지한다.
- purge 성공/실패 결과 메시지를 성공/경고/오류 톤으로 분리한다.
- 실패 항목은 목록에 남아 다시 선택 삭제로 재시도할 수 있음을 문서화한다.
- 자동 purge 스케줄러와 DB schema 변경은 아직 하지 않는다.

### 0.9.144

자동 purge 스케줄러 도입 여부를 검토하고 문서화했다. 초기 운영에서는 자동 purge를 켜지 않고, `/system/storage-usage`에서 시스템관리자가 후보 목록을 확인한 뒤 수동 purge를 실행하는 방식을 유지한다. 향후 자동화가 필요하면 Vercel Cron이 DB 후보 조회와 상태 갱신을 담당하고, R2 객체 삭제는 기존 Cloudflare Worker가 담당하는 구조를 우선 검토한다. 실제 자동 purge 기능, DB schema, package 의존성은 변경하지 않았다.


## 0.9.145 공통 UI/레이아웃 리팩토링 1차

- 관리자 환경설정 페이지의 사용/미사용 표시 방식을 공통 `AdminUsageToggle` 기준으로 정리했다.
- 파일 정책/알림 정책/생산품 유형/단위 표준 모달의 상태 표시 크기와 문구 위치를 통일했다.
- 기존 저장 API, DB schema, R2/첨부/메모 기능은 변경하지 않았다.
- 이후 공통 UI 리팩토링은 기존 화면을 갈아엎지 않고 모달/카드/테이블 단위로 작게 나누어 진행한다.

## 0.9.146 공통 UI/레이아웃 리팩토링 2차

- 관리자 환경설정의 로그 이벤트 모달에 남아 있던 기존 ON/OFF pill 버튼을 공통 토글 체계로 교체했다.
- `AdminSettingsToggleRow`를 추가해 라벨, 보조 설명, 사용/미사용 토글이 같은 높이와 간격으로 표시되도록 기준화했다.
- 로그 이벤트 모달과 알림 정책/파일 정책 모달의 토글 row 구조를 같은 컴포넌트 계층으로 맞췄다.
- 생산품 유형/단위 표준 모달은 목록 선택 구조가 달라 `AdminUsageToggle` inline 사용을 유지하되 토글 크기 기준은 공유한다.
- 저장 API, DB schema, R2/첨부/메모/purge 기능은 변경하지 않았다.

## 0.9.147 관리자 설정 모달 레이아웃 통일 보완

- 관리자 설정 모달의 footer 버튼 구조를 `AdminModalFooterActions`로 통일한다.
- 로그 이벤트/파일 정책/알림 정책/생산품 유형/단위 표준/외주 공정 유형 모달의 저장/기본값 복원 버튼 높이와 정렬 기준을 맞춘다.
- 저장 중에는 추가 입력, 토글, 기본값 복원, 저장 동작의 중복 실행을 막는다.
- 저장 API, DB schema, R2/첨부/메모/purge 로직은 변경하지 않는다.


## 0.9.148 작업지시서 detail 구조 리팩토링 기준

- 작업지시서 상세 화면은 기존 UI와 상태 변경 흐름을 유지한다.
- 컨테이너 내부의 모델 조립은 별도 helper로 분리하되, editor/action/presentation 계약은 변경하지 않는다.
- detail 리팩토링은 화면 변경이 아니라 책임 경계 정리 중심으로 진행한다.
- 첨부, 메모, R2 purge, 관리자 설정 안정화 흐름은 이번 리팩토링에서 건드리지 않는다.

## 0.9.149 추가 기준

- 작업지시서 detail view model의 section props 조립은 `lib/workorder/presentation/workOrderDetailSectionProps.ts`에서 담당한다.
- `workOrderDetailPresentation.ts`는 section별 builder를 조합하는 진입점으로 유지한다.
- 화면 배치, 상태 변경, 첨부, 메모, R2 purge 동작은 리팩토링 과정에서 변경하지 않는다.

## 0.9.150 업데이트

- 작업지시서 detail editor의 inline editing session 상태를 `useWorkOrderEditingSession`으로 분리했다.
- 편집 셀 시작/취소/blur 처리는 공통 hook에서 관리한다.
- 작업지시서 UI, 상태변경, 첨부, 메모, R2 purge 기능은 변경하지 않았다.

## 0.9.151 작업지시서 UI 수정사항 수집/분류

- 0.9.148~0.9.150에서 detail 구조를 먼저 정리했으므로, 0.9.151에서는 실제 UI 변경 전 수정 후보를 영역별로 분류한다.
- PC 기준 좌측 패널, 중앙 상세, header/action, 발주정보, 생산구성, 비용 요약, 첨부/메모 panel, 모달 UX를 나누어 점검한다.
- 즉시 수정 가능 항목과 구조 정리 필요 항목을 분리하고, 모바일/태블릿 큰 변경은 보류한다.
- 작업지시서 상태 변경, 첨부, 메모, R2 purge, DB schema는 변경하지 않는다.



## 0.9.152 작업지시서 PC UI 1차 정리

- 발주정보 표 안의 검수여부 컬럼을 제거하고, 상태는 표 위 요약 배지로 표시한다.
- 원단/부자재 테이블 컬럼 순서를 거래처 → 자재명 흐름으로 정리한다.
- 메모/댓글 작성자 표시에서 역할/권한 텍스트를 제거하고, 관리자 역할은 대표로 표시한다.
- 메모/댓글 시간 표시를 YY.MM.DD HH:mm 형식으로 정리한다.
- 첨부/디자인 삭제 모달 문구를 30일 휴지통 복원 정책에 맞게 변경한다.
- 상태 변경, 첨부/메모 저장, R2/Worker/purge 로직은 변경하지 않는다.

## 0.9.153 작업지시서 발주요청 확인 영역 정렬

- 발주요청 확인 모달의 대표 이미지 영역과 요청사항 영역을 같은 카드 구조로 정리했다.
- 대표 이미지/요청사항 영역은 동일한 header 높이, border, padding, 최소 높이를 사용한다.
- 대표 이미지 우선 사용 안내 문구는 본문 균형을 깨지 않도록 제거했다.
- 출력/PDF 생성 로직, 상태 변경, 첨부/메모 저장, R2/Worker/purge 로직은 변경하지 않았다.

## 0.9.154 추가 기준

- 작업지시서 출력/PDF 마지막 표 하단 테두리 보정

## 0.9.155 작업지시서 디자인/첨부 영역 UX 1차

- PC 우측 디자인/첨부 panel에서 업로드 진입점이 더 명확히 보이도록 점선 안내 영역을 추가한다.
- 디자인/첨부 header의 직접 `+` 버튼을 `...` 액션 메뉴로 정리해 파일 추가 진입점을 통일한다.
- 디자인 영역에는 향후 태블릿/PC 직접 그리기 기능을 연결할 수 있도록 `직접 그리기` 메뉴 항목을 준비 상태로 표시한다.
- 이번 버전은 실제 drag-and-drop 업로드 로직이나 그리기 라이브러리 연결을 추가하지 않는다.
- 기존 첨부 업로드/삭제/썸네일/메모 저장, R2/Worker/purge 로직은 변경하지 않는다.


## 0.9.156 — 디자인/첨부 드래그 업로드 연결

- 디자인/첨부 패널의 점선 안내 영역에 실제 drag-and-drop 업로드를 연결했다.
- 기존 파일 선택 업로드와 동일한 `uploadWorkOrderAttachmentFiles` 흐름을 재사용한다.
- 디자인 영역에 drop하면 design scope, 첨부 영역에 drop하면 attachment scope로 저장한다.
- R2 업로드는 기존 Worker 기반 흐름을 유지한다.
- 직접 그리기 기능은 아직 준비 상태 메뉴로 유지하고, 라이브러리 연결은 별도 버전으로 분리한다.

## 0.9.157 — 디자인/첨부 드래그 업로드 런타임 에러 보완

- 0.9.156에서 추가한 drag-and-drop 업로드가 일부 side panel 경로에서 `onUploadAttachmentFiles is not a function` 런타임 에러를 내던 문제를 보완한다.
- desktop 공통 section, tablet view, mobile accordion view 모두에 `onUploadAttachmentFiles` 전달을 명시한다.
- 혹시 handler가 누락된 경로에서도 drop 시 런타임이 중단되지 않도록 방어 조건을 추가한다.
- 기존 `... > 파일 추가` 업로드와 R2 Worker/썸네일/삭제/메모 저장 로직은 변경하지 않는다.


## 0.9.158 — 작업지시서 드래그 업로드 drop 이벤트 보완
- 0.9.157에서 런타임 에러는 보완됐지만 실제 drop 반응이 없는 문제를 추가 정리했다.
- 디자인/첨부 패널 전체가 dragOver/drop 이벤트를 받을 수 있도록 보완했다.
- 점선 안내 영역을 button이 아닌 role=button div로 바꾸어 drop 이벤트를 안정적으로 받게 했다.
- 기존 파일 선택 업로드, R2 Worker 업로드, 썸네일 생성, 삭제/복구 흐름은 변경하지 않았다.

## 0.9.159 — 드래그 업로드 build 오류 보완

- `useWorkOrder`가 외부로 노출하는 `attachments` 객체에 `handleAttachmentFileDrop`을 추가했다.
- `WorkOrderWorkspace`의 `onUploadAttachmentFiles` prop 연결 build 오류를 수정했다.
- 개발 환경에서만 드래그 업로드 drop 로그를 출력하도록 보완했다.
- R2 Worker, 썸네일, 삭제/복구, DB schema는 변경하지 않았다.


## 0.9.160 — 직접 그리기 placeholder와 drag upload build 보완

- `useWorkOrderAttachments`의 drag/file upload scope 타입을 `design | attachment`로 좁혀 `memo` scope가 첨부 업로드 action flow에 들어갈 수 없게 했다.
- 디자인 영역 `... > 직접 그리기` 항목을 클릭 가능한 준비 안내 모달로 연결했다.
- 실제 drawing library, canvas 저장, R2 저장 연결은 아직 하지 않았다.
- 기존 파일 선택 업로드, drag-and-drop 업로드, R2 Worker 업로드, 썸네일 생성 흐름은 유지했다.


## 0.9.161

- 작업지시서 삭제 browser confirm을 앱 내부 확인 모달로 교체했다.
- 기존 삭제 API와 첨부/메모/R2 purge 흐름은 변경하지 않았다.


## 0.9.162 — 작업지시서 삭제 정책 확정 및 build 오류 보완

- 작업지시서 삭제는 작업지시서 단독 삭제가 아니라 작업지시서 묶음 전체를 휴지통/숨김 상태로 이동하는 정책으로 확정한다.
- 연결된 디자인 파일, 일반 첨부파일, 메모 첨부는 R2에서 즉시 삭제하지 않고 함께 휴지통 대상으로 본다.
- 메모 본문은 작업지시서가 삭제된 동안 함께 숨김 처리하는 방향으로 정리한다.
- 휴지통 항목은 30일 이내 복원 가능하며, 30일 후 시스템관리자 R2 purge 후보가 된다.
- 0.9.161의 삭제 확인 모달 build 오류는 `WorkOrderListItem`과 `WorkOrder` 타입 차이 때문에 발생했으므로, 모달 입력 타입을 삭제 확인에 필요한 최소 list item 타입으로 좁힌다.
- 이번 버전은 실제 연결 첨부 전체 soft delete 로직을 적용하지 않고 정책과 타입 오류를 정리한다.


## 0.9.163 — 작업지시서 삭제 시 연결 파일/메모 휴지통 이동

- 작업지시서 삭제 시 해당 작업지시서에 연결된 디자인/첨부 파일을 함께 휴지통 상태로 전환한다.
- 연결 파일은 `attachment_trash_items`에 등록되어 기존 `/admin/files` 휴지통과 시스템관리자 purge 후보 흐름을 탄다.
- R2 원본/썸네일은 즉시 삭제하지 않는다.
- 메모 row도 작업지시서 삭제 상태에 맞춰 soft delete 처리한다.
- DB schema와 R2 Worker는 변경하지 않았다.

## 0.9.164 — 작업지시서 복원 정책과 고객관리자 저장소 탭 구조 설계

- 작업지시서 삭제는 작업지시서 본문, 디자인/첨부 파일, 메모, 메모 첨부를 하나의 묶음으로 휴지통 이동하는 정책으로 유지한다.
- 작업지시서 복원은 삭제 당시 함께 휴지통 이동된 디자인/첨부/메모를 같이 복원하는 방향으로 정리한다.
- 개별 첨부 삭제와 작업지시서 묶음 삭제를 구분해 저장소 화면에서 원인을 식별할 수 있어야 한다.
- 고객관리자 저장소는 `작업지시서 / 첨부파일목록 / 휴지통` 3탭 구조로 개편하는 방향을 기준으로 한다.
- 0.9.164는 정책과 화면 구조 설계만 추가하며 DB schema, R2 purge, 실제 복원 로직은 변경하지 않는다.
