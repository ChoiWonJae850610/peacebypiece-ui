# PeaceByPiece R2 / 첨부 / 메모 점검 0.9.123

## 기준

- 기준 버전: `0.9.122`
- 결과 버전: `0.9.123`
- 목적: `0.9.77` 복구 라인을 유지한 상태에서 R2, 첨부, 메모 관련 현재 구조를 문서화하고 이후 선별 이식 범위를 정한다.
- 작업 범위: 코드 기능 변경 없음. APP_VERSION 갱신과 문서 추가/갱신만 수행한다.

## 이번 버전에서 지킨 제한

1. `0.9.108` 이후 read-only/skeleton route 변경은 가져오지 않았다.
2. DB schema는 변경하지 않았다.
3. `package.json`, `package-lock.json`, `.env.local`은 변경하지 않았다.
4. 기존 정상 UI, API, repository 동작은 변경하지 않았다.
5. R2 Worker, 업로드, 삭제, 다운로드 구현 파일은 수정하지 않고 점검 대상으로만 분류했다.

## 현재 첨부/R2 주요 흐름

### 1. 업로드 준비

관련 파일:

- `app/api/workorders/attachments/upload/route.ts`
- `lib/storage/r2/r2Client.ts`
- `lib/storage/r2/r2Config.ts`
- `lib/storage/r2/r2Keys.ts`
- `lib/storage/r2/r2ThumbnailKeys.ts`
- `lib/storage/r2/r2WorkerUpload.ts`
- `lib/workorder/persistence/workOrderAttachmentPolicy.ts`

현재 역할:

- 클라이언트가 업로드할 파일 목록을 보내면 업로드 대상 정보를 생성한다.
- Worker 설정이 있으면 `createR2WorkerUploadUrl`을 우선 사용한다.
- Worker 설정이 없고 R2 SDK 설정이 있으면 presigned PUT URL을 생성한다.
- 이미지 파일은 썸네일 key와 썸네일 업로드 URL도 함께 만든다.
- 파일 개수와 파일 정책 검증은 `workOrderAttachmentPolicy`를 통한다.

유지 판단:

- 현재 구조는 API route가 얇고 R2 key/policy/helper가 `lib` 하위로 분리되어 있다.
- 즉시 수정하지 않는다.
- 다음에 실제 동작 이슈가 있으면 upload prepare 응답과 클라이언트 consume 구조를 같이 확인한다.

### 2. 직접 서버 업로드 fallback

관련 파일:

- `app/api/workorders/attachments/upload/direct/route.ts`
- `lib/storage/r2/r2Client.ts`
- `lib/storage/r2/r2Keys.ts`
- `lib/workorder/persistence/workOrderAttachmentPolicy.ts`

현재 역할:

- form-data로 받은 파일을 서버에서 `putR2Object`로 R2에 저장한다.
- storage key 안전성 검증 후 파일 정책을 다시 확인한다.

유지 판단:

- Worker 업로드가 불가능한 환경의 fallback 성격으로 보인다.
- 정상 업로드가 되는 동안 수정하지 않는다.
- 추후 대용량 파일/모바일 업로드 문제가 있으면 fallback 사용 여부와 비용/성능을 별도 검토한다.

### 3. 업로드 완료 및 DB metadata 저장

관련 파일:

- `app/api/workorders/attachments/upload/complete/route.ts`
- `lib/workorder/persistence/attachmentMemoAdapter.ts`
- `lib/workorder/persistence/attachmentMemoRepository.ts`
- `lib/workorder/persistence/attachmentMemoTypes.ts`
- `lib/workorder/persistence/dbAttachmentMemoRepository.ts`
- `lib/storage/r2/r2UrlCache.ts`

현재 역할:

- R2 업로드가 끝난 뒤 attachment metadata를 repository에 저장한다.
- 저장된 attachment에는 `storage_key`, `thumbnail_key`, 파일명, mime type, size 등이 들어간다.
- 화면 표시 URL은 R2 key에서 API proxy URL 형태로 만들어진다.
- 업로드 완료 후 관련 R2 URL cache를 삭제한다.

유지 판단:

- 파일 원본은 R2, metadata는 DB에 두는 방향이 유지되어 있다.
- 현재 DB schema 변경 없이 유지한다.
- 대표 이미지/첨부 표시 이슈가 있으면 이 route와 repository 반환값을 우선 확인한다.

### 4. 미리보기/다운로드

관련 파일:

- `app/api/workorders/attachments/file/route.ts`
- `lib/workorder/attachments/attachmentFileRoute.ts`
- `lib/storage/r2/r2Client.ts`
- `lib/storage/r2/r2WorkerUpload.ts`
- `lib/storage/r2/r2UrlCache.ts`
- `cloudflare/r2-upload-worker.js`

현재 역할:

- API route는 `handleWorkOrderAttachmentFileGet`으로 위임되어 얇게 유지된다.
- Worker 설정이 있으면 Worker GET URL로 307 redirect한다.
- Worker 설정이 없으면 R2 SDK로 객체를 읽어 response stream을 만든다.
- `download=1` 요청은 `Content-Disposition`을 붙여 다운로드로 처리한다.
- Worker도 GET, PUT, DELETE를 처리하고 다운로드 요청 시 `Content-Disposition`을 설정한다.

유지 판단:

- 과거에 발생했던 “화면에는 보이는데 다운로드가 깨지는 문제”는 이 영역이 핵심이다.
- 현재 구현은 Worker redirect 우선 구조라 방향은 맞다.
- 0.9.124에서 실제 다운로드 문제가 재현되면 이 파일군만 최소 수정한다.
- 업로드/삭제/표시와 묶어서 한 번에 수정하지 않는다.

### 5. 삭제/휴지통/물리 삭제

관련 파일:

- `app/api/workorders/attachments/delete/route.ts`
- `app/api/admin/files/trash/restore/route.ts`
- `app/api/admin/files/trash/purge/route.ts`
- `app/api/admin/files/trash/purge-candidates/route.ts`
- `app/api/admin/files/trash/purge-worker/route.ts`
- `lib/admin/files/serverActions.ts`
- `lib/storage/r2/r2WorkerUpload.ts`
- `lib/workorder/persistence/attachmentMemoRepository.ts`

현재 역할:

- 작업지시서 첨부 삭제 route는 회사 파일 정책을 읽는다.
- soft-delete가 켜져 있으면 DB metadata만 soft-delete하고 R2 객체는 즉시 지우지 않는다.
- soft-delete가 꺼져 있으면 R2 Worker DELETE 후 DB metadata를 삭제 상태로 표시한다.
- 관리자 파일관리의 휴지통/복구/영구삭제 API는 별도 route로 분리되어 있다.

유지 판단:

- “작업지시서 일반 삭제”와 “관리자 영구삭제/R2 물리 삭제”는 계속 분리해야 한다.
- 0.9.125에서 대표 이미지, 삭제, 복구, purge 흐름을 다시 점검한다.
- 이번 0.9.123에서는 삭제 구현을 수정하지 않는다.

### 6. 대표 이미지

관련 파일:

- `app/api/workorders/attachments/primary/route.ts`
- `lib/workorder/attachments/attachmentPrimaryApiClient.ts`
- `lib/workorder/persistence/attachmentMemoRepository.ts`
- `lib/workorder/persistence/dbAttachmentMemoRepository.ts`

현재 역할:

- `attachmentId`와 `workOrderId`를 받아 디자인 첨부의 대표 여부를 DB repository에서 갱신한다.
- repository 계약에는 `setPrimaryDesignAttachment`가 포함되어 있다.

유지 판단:

- 대표 이미지는 별표 UI 반응성과 DB의 `is_primary` 반영을 같이 봐야 한다.
- 0.9.125에서 실제 UI 클릭 후 다른 디자인 첨부의 대표 해제까지 확인한다.
- 이번 버전에서는 수정하지 않는다.

## 현재 메모 주요 흐름

### 1. 메모 조회/생성/수정/삭제

관련 파일:

- `app/api/workorders/memos/route.ts`
- `lib/workorder/memo/memoApiClient.ts`
- `lib/workorder/memo/memoActions.ts`
- `lib/workorder/memo/memoMutations.ts`
- `lib/workorder/memo/memoDrafts.ts`
- `lib/workorder/persistence/attachmentMemoAdapter.ts`
- `lib/workorder/persistence/attachmentMemoRepository.ts`

현재 역할:

- `GET`은 workOrder별 memo snapshot을 가져온다.
- `POST`는 thread 또는 reply를 생성한다.
- `PATCH`는 memo body를 수정한다.
- `DELETE`는 thread/reply를 soft-delete한다.
- repository mode는 `ATTACHMENT_MEMO_REPOSITORY_MODE` 기준으로 `db` 또는 `mock`을 선택한다.

유지 판단:

- 메모는 첨부와 같은 persistence adapter 계층을 사용한다.
- 메모 첨부 파일 자체는 attachment scope `memo` 흐름으로 분류된다.
- 메모 본문 저장과 첨부 파일 저장은 한 번에 리팩토링하지 않는다.

### 2. 메모 첨부

관련 파일:

- `lib/storage/r2/r2Keys.ts`
- `lib/storage/r2/r2ThumbnailKeys.ts`
- `lib/workorder/persistence/workOrderAttachmentPolicy.ts`
- `components/workorder/sidepanel/WorkOrderMemoPanel.tsx`
- `components/workorder/sidepanel/shared/WorkOrderSidePanelAttachmentSections.tsx`

현재 판단:

- R2 key 구조에는 `workorders/{workOrderId}/memos/{fileId}.{ext}`가 포함되어 있다.
- Worker policy도 `memos` scope를 지원한다.
- UI에서 메모 첨부가 실제로 어느 action을 통해 저장되는지는 0.9.129 sidepanel 리팩토링 때 별도 확인한다.

## 현재 UI 연결점

관련 파일:

- `components/workorder/sidepanel/WorkOrderAttachmentPanel.tsx`
- `components/workorder/sidepanel/WorkOrderMemoPanel.tsx`
- `components/workorder/sidepanel/WorkOrderSidePanelContainer.tsx`
- `components/workorder/sidepanel/views/WorkOrderSidePanelDesktopView.tsx`
- `components/workorder/sidepanel/views/WorkOrderSidePanelTabletView.tsx`
- `components/workorder/sidepanel/views/WorkOrderSidePanelMobileView.tsx`
- `components/common/modal/AttachmentPreviewModal.tsx`
- `components/common/modal/AttachmentDeleteConfirmModal.tsx`

판단:

- 현재 복구 라인은 기존 UI가 살아 있으므로 UI 교체가 아니라 action 연결과 책임 분리 여부를 확인하는 방식으로 가야 한다.
- 첨부/메모는 sidepanel과 modal에 걸쳐 있으므로, 0.9.124~0.9.129에서 한 번에 리팩토링하지 않는다.

## 선별 이식 후보 판단

| 구분 | 현재 판단 | 다음 처리 |
| --- | --- | --- |
| Worker GET redirect 다운로드 | 유지 후보 | 0.9.124에서 실제 다운로드 실패가 있으면 이식/수정 검토 |
| R2 URL cache | 유지 후보 | 다운로드/미리보기 URL 만료 이슈가 있을 때만 수정 |
| upload prepare + complete 분리 | 유지 | 정상 업로드가 되면 수정하지 않음 |
| direct server upload fallback | 보류 | Worker 업로드가 안정적이면 건드리지 않음 |
| soft-delete / purge 분리 | 유지 | 0.9.125에서 관리자 파일관리와 함께 점검 |
| 대표 이미지 API | 유지 | UI 클릭 반응과 repository 동작 확인 후 수정 여부 판단 |
| memo CRUD API | 유지 | 메모 본문 저장 오류가 재현될 때만 수정 |
| 메모 첨부 scope | 점검 필요 | sidepanel 리팩토링 때 확인 |
| read-only/skeleton route | 제외 | 복구 라인에 가져오지 않음 |

## 다음 버전 작업 기준

### 0.9.124

- 첨부 다운로드/미리보기 안정화만 점검한다.
- 수정이 필요하면 `attachmentFileRoute`, Worker file URL, 다운로드 query 처리에 한정한다.
- 업로드/삭제/대표 이미지 코드는 함께 수정하지 않는다.

### 0.9.125

- 첨부 삭제/복구/대표 이미지 흐름을 점검한다.
- 작업지시서 일반 삭제와 관리자 파일관리 영구삭제를 분리해서 본다.

### 0.9.126

- Neon/repository 계약을 점검한다.
- DB schema는 변경하지 않고 현재 API 응답과 repository 반환 타입만 확인한다.

## 0.9.124 다운로드/미리보기 안정화 반영

### 반영 범위

- `lib/permissions/attachments.ts`의 다운로드 URL 생성 로직만 보완했다.
- DB attachment처럼 `storageKey`가 있는 항목은 기존처럼 `/api/workorders/attachments/file?download=1` 경로를 사용한다.
- 이미 `/api/workorders/attachments/file?...` 형태의 proxy URL만 가진 항목은 query 안의 `key`를 다시 꺼내 다운로드 query를 붙인다.
- mock, sample, 브라우저 임시 업로드처럼 `data:`, `blob:`, `http(s)` 직접 URL만 가진 항목은 R2 file API로 억지 전송하지 않고 직접 URL을 그대로 사용한다.

### 수정 이유

복구 라인은 `0.9.77` UI와 mock/sample 흐름도 함께 보존해야 한다. 기존 다운로드 URL 생성은 `storageKey`가 없으면 `attachment.url`을 storage key처럼 다루어 `/api/workorders/attachments/file?key=...`로 보낼 수 있었다. 이 경우 R2 storage key가 아닌 `data:` URL이나 이미 만들어진 file proxy URL이 다시 key로 중첩되어 다운로드가 실패할 수 있다.

### 유지한 것

- `app/api/workorders/attachments/file/route.ts`는 수정하지 않았다.
- `lib/workorder/attachments/attachmentFileRoute.ts`는 수정하지 않았다.
- `cloudflare/r2-upload-worker.js`는 수정하지 않았다.
- 업로드, 삭제, 대표 이미지, 메모 API는 수정하지 않았다.
- DB schema와 package 파일은 수정하지 않았다.

### 다음 확인

- 실제 R2 attachment 다운로드가 `Content-Disposition`을 통해 파일명과 함께 내려오는지 확인한다.
- mock/sample attachment에서 다운로드 버튼이 invalid storage key API로 가지 않는지 확인한다.
- 이미지 preview와 PDF iframe preview는 기존 URL을 그대로 사용하므로 화면 표시 회귀 여부만 확인한다.

## 0.9.125 메모 저장/상태전환 유지 보완

### 발견 증상

- 메모 저장 직후 화면에는 보이지만, 검토완료 등 상태 변경 후 workorder가 다시 hydrate되면 메모가 사라질 수 있었다.
- 서버 로그에서 `memos.company_id` not-null 오류가 발생했다.
- 서버 로그에서 `memos_parent_id_fkey` 오류가 발생할 수 있었다.
- 첨부파일은 R2에 저장되지만, 직접 R2 접근 경로에서는 SSL handshake/EPROTO 로그가 남을 수 있었다.

### 반영 범위

- workorder PATCH 저장 과정에서 `memoThreads` 전체를 삭제 후 재삽입하지 않도록 변경했다.
- 메모는 `/api/workorders/memos` 전용 API를 통해 생성/수정/삭제하고, workorder 상태 변경 PATCH는 메모 테이블을 덮어쓰지 않는다.
- 기존 replace용 메모 삽입 helper에는 `company_id`, `company_name`을 명시적으로 포함해 not-null 제약 위반 가능성을 제거했다.
- R2 업로드/삭제/다운로드는 Worker 기반 흐름을 유지한다는 원칙을 문서에 반영하고, 이번 버전에서는 첨부 UI와 Worker 파일을 수정하지 않았다.

### 수정 이유

상태 변경 PATCH는 작업지시서 본문 상태 저장 목적이다. 이 과정에서 별도 API로 저장된 메모를 `memoThreads` payload 기준으로 다시 삭제/삽입하면, 로컬 상태와 DB 상태가 조금만 어긋나도 저장된 메모가 사라지거나 FK 오류가 발생할 수 있다. 따라서 workorder 저장과 메모 저장 책임을 분리했다.

### 유지한 것

- DB schema는 변경하지 않았다.
- 메모 생성/수정/삭제 API 경로는 유지했다.
- 첨부 업로드, 삭제, 대표 이미지, Worker 파일은 수정하지 않았다.
- R2 직접 SDK 업로드/삭제 방식으로 되돌리지 않았다.

### 다음 확인

- 새 메모 저장 후 검토완료/취소/재저장 같은 상태 변경을 수행해도 메모가 유지되는지 확인한다.
- 기존 DB에 저장된 메모가 workorder GET hydrate 후 계속 표시되는지 확인한다.
- R2 upload/direct 500 로그는 0.9.126 이후 Worker 경로 정리 작업에서 별도 확인한다.

## 0.9.126 보완 — Worker 전용 업로드 경로 고정

### 발견 증상

- 첨부 원본은 R2에 저장되지만 브라우저 콘솔/서버 로그에 `/api/workorders/attachments/upload/direct` 500과 SSL EPROTO handshake 오류가 남았다.
- 원인은 Worker PUT 실패 또는 썸네일 업로드 실패 시 클라이언트가 서버 direct upload fallback을 호출하는 구조였다.
- 현재 운영 전제에서는 R2 직접 SDK 업로드가 handshake 문제를 일으킬 수 있으므로 서버 fallback은 사용하지 않는다.

### 반영 내용

- `lib/workorder/attachments/attachmentUploadApiClient.ts`에서 Worker upload URL 실패 시 `/api/workorders/attachments/upload/direct`를 호출하지 않도록 변경했다.
- 원본 파일 업로드가 Worker에서 실패하면 즉시 upload 실패로 처리한다.
- 썸네일 업로드 실패는 기존처럼 `ATTACHMENT_THUMBNAIL_UPLOAD_SKIPPED`로 처리되며 원본 첨부 등록은 계속 가능하다.
- `app/api/workorders/attachments/upload/direct/route.ts`는 R2 SDK 업로드를 수행하지 않고 410 응답을 반환하도록 비활성화했다.

### 유지 원칙

- R2 업로드/삭제/다운로드는 Worker 기반 흐름을 기준으로 유지한다.
- R2 직접 SDK 업로드 fallback은 다시 추가하지 않는다.
- 삭제 기능은 이미 정상 동작 중이므로 이번 버전에서는 변경하지 않았다.
- DB schema와 첨부 UI는 변경하지 않았다.



## 0.9.127 보완 — 첨부 삭제/복구/대표 이미지 QA 기준

### 반영 내용

- `docs/attachment-trash-primary-qa-0.9.127.md`를 추가해 작업지시서 첨부 삭제, 관리자 휴지통 복구, 영구삭제 요청, Worker purge, 대표 이미지 지정 흐름의 확인 기준을 정리했다.
- 이번 버전에서는 기능 코드를 변경하지 않고, 0.9.126까지 정리한 Worker 기반 업로드/삭제 전제를 테스트 기준에 반영했다.
- R2 물리 삭제는 관리자 영구삭제/Worker purge 흐름에서만 다루고, 작업지시서 일반 삭제는 DB metadata soft delete로 유지한다.

### 다음 확인

- 새 첨부 업로드 후 `/api/workorders/attachments/upload/direct 500` 로그가 발생하지 않는지 확인한다.
- 대표 이미지 지정 시 같은 작업지시서의 design 첨부 중 `is_primary = true`가 1개 이하로 유지되는지 확인한다.
- 일반 삭제 후 `attachment_trash_items`가 생성되고 R2 원본은 즉시 삭제되지 않는지 확인한다.
- 관리자 복구 후 작업지시서 화면에 첨부가 다시 표시되는지 확인한다.
- 영구삭제는 Worker purge 경로로만 수행되는지 확인한다.

## 0.9.130 보완 — 썸네일 Worker 요청

- 원본 첨부 업로드와 DB 저장이 정상이라면 썸네일 업로드 실패는 차단 오류로 보지 않는다.
- 썸네일 업로드 실패 시 complete payload에서 thumbnail key를 null 처리하여 DB에 실패한 thumbnail key를 저장하지 않는다.
- Worker는 `workorders/{workOrderId}/thumbnails/{design|attachments|memos}/{fileId}.webp` key를 허용해야 한다.
- Cloudflare에 배포된 Worker가 오래된 코드이면 앱에서는 `INVALID_WORKER_FILE_REQUEST`가 계속 보일 수 있으므로 Worker 배포 상태를 별도 확인한다.

