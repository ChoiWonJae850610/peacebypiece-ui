# 0.9.127 첨부 삭제/복구/대표 이미지 QA 기준

## 목적

0.9.77 복구 라인의 기존 UI를 유지하면서 첨부 삭제, 관리자 파일관리 복구, 대표 이미지 지정 흐름을 점검한다. 이 문서는 기능 변경 없이 다음 실제 수정 버전에서 확인해야 할 테스트 기준을 고정하기 위한 문서다.

## 현재 전제

- 첨부 업로드는 Worker 기반 경로를 기준으로 한다.
- 서버 direct R2 upload fallback은 사용하지 않는다.
- 작업지시서 일반 삭제와 관리자 파일관리 영구삭제는 분리한다.
- 작업지시서 일반 삭제는 DB metadata soft delete를 우선한다.
- R2 물리 삭제는 관리자 영구삭제/Worker purge 흐름에서만 다룬다.
- DB schema는 변경하지 않는다.

## 테스트 1 — 작업지시서 첨부 업로드 후 화면 유지

1. 작업지시서 상세 화면을 연다.
2. 디자인 첨부 이미지를 1개 업로드한다.
3. 첨부가 우측 패널 또는 첨부 영역에 표시되는지 확인한다.
4. 브라우저 새로고침 후 첨부가 계속 보이는지 확인한다.
5. R2 버킷에 원본 key가 생성되었는지 확인한다.
6. 서버 로그에 `/api/workorders/attachments/upload/direct 500`이 더 이상 발생하지 않는지 확인한다.

기대 결과:

- 원본 업로드는 Worker 경로로 완료된다.
- direct upload fallback 로그가 없어야 한다.
- 썸네일 업로드 실패가 있더라도 원본 첨부 등록은 유지된다.

## 테스트 2 — 대표 이미지 지정

1. 같은 작업지시서에 디자인 첨부 이미지를 2개 이상 업로드한다.
2. 첫 번째 이미지를 대표로 지정한다.
3. DB `attachments` 테이블에서 해당 작업지시서의 `type = design` 항목 중 `is_primary = true`가 1개인지 확인한다.
4. 두 번째 이미지를 대표로 지정한다.
5. 첫 번째 이미지는 `is_primary = false`, 두 번째 이미지는 `is_primary = true`로 변경되는지 확인한다.
6. 새로고침 후 대표 이미지 표시가 유지되는지 확인한다.

기대 결과:

- 같은 작업지시서의 디자인 대표 첨부는 항상 1개 이하로 유지된다.
- 삭제된 첨부는 대표 이미지 후보가 되지 않는다.

## 테스트 3 — 작업지시서 첨부 삭제

1. 작업지시서에서 첨부를 1개 삭제한다.
2. 화면 목록에서 해당 첨부가 사라지는지 확인한다.
3. DB `attachments` 테이블에서 해당 row의 `is_active = false`, `deleted_at` 값이 채워졌는지 확인한다.
4. DB `attachment_trash_items` 테이블에 해당 `attachment_id` row가 생성되었는지 확인한다.
5. R2 원본 파일이 즉시 삭제되지 않았는지 확인한다.

기대 결과:

- 일반 삭제는 soft delete다.
- R2 물리 삭제는 즉시 실행되지 않는다.
- 삭제 후 새로고침해도 삭제된 첨부는 작업지시서 화면에 다시 나타나지 않는다.

## 테스트 4 — 관리자 파일관리 복구

1. `/admin/files` 화면을 연다.
2. 휴지통 영역에서 삭제된 첨부를 확인한다.
3. 복구 버튼을 실행한다.
4. DB `attachments` row가 `is_active = true`, `deleted_at = null`로 돌아오는지 확인한다.
5. DB `attachment_trash_items` row가 `purge_status = restored`, `restored_at` 값이 채워지는지 확인한다.
6. 작업지시서 상세 화면을 새로고침해 복구된 첨부가 다시 보이는지 확인한다.

기대 결과:

- 복구는 DB metadata 복구만 수행한다.
- R2 파일이 남아 있는 상태이므로 화면 표시와 다운로드가 다시 가능해야 한다.

## 테스트 5 — 관리자 영구삭제 요청과 Worker purge

1. `/admin/files` 휴지통에서 영구삭제 가능한 후보를 확인한다.
2. 영구삭제 요청을 실행한다.
3. DB `attachment_trash_items.purge_status`가 `purge_requested`로 바뀌는지 확인한다.
4. purge worker 실행 route 또는 관리자 실행 버튼을 통해 실제 삭제를 수행한다.
5. R2 원본 key와 thumbnail key가 삭제되는지 확인한다.
6. DB `attachment_trash_items.purge_status = purged`, `purged_at` 값이 채워지는지 확인한다.

기대 결과:

- R2 물리 삭제는 Worker 기반 삭제 흐름으로만 수행한다.
- 서버 R2 SDK 직접 삭제 방식으로 되돌리지 않는다.
- 실패 시 `last_purge_error`에 원인이 남아야 한다.

## 테스트 6 — 메모 회귀 확인

0.9.125에서 수정한 메모 흐름이 첨부 테스트 중 다시 깨지지 않는지 확인한다.

1. 새 메모를 작성한다.
2. 검토완료 또는 상태 변경을 수행한다.
3. 새로고침한다.
4. 메모가 유지되는지 확인한다.

기대 결과:

- 상태 변경 PATCH가 memo table을 삭제/재삽입하지 않는다.
- 메모는 `/api/workorders/memos` 전용 흐름으로 유지된다.

## 다음 수정 판단 기준

다음 버전에서 실제 코드 수정이 필요한 경우는 아래 중 하나다.

- 대표 이미지 지정 후 DB에서 `is_primary = true`가 여러 개 남는다.
- 삭제 후 `attachment_trash_items`가 생성되지 않는다.
- 복구 후 작업지시서 화면에 첨부가 돌아오지 않는다.
- 영구삭제 요청 후 purge worker가 R2 Worker 삭제를 수행하지 않는다.
- upload/direct 500 로그가 0.9.126 이후에도 계속 발생한다.
- 메모가 상태 변경 후 다시 사라진다.

## 제외 범위

- DB schema 변경
- 첨부 UI 재설계
- read-only/skeleton 화면 재도입
- package 의존성 추가
- R2 SDK 직접 업로드/삭제 fallback 재도입
