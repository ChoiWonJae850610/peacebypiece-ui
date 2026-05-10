# 0.9.22438 — 시스템관리자 실제 삭제/purge 흐름 보정

## 목적

`/system/storage-usage`에서 고객관리자가 삭제 요청한 파일/작업지시서를 실제 R2 Worker 삭제와 DB purge 상태 갱신까지 안정적으로 처리한다.

## 보정 내용

### 1. 작업지시서 purge 순서 보정

기존 흐름은 작업지시서 후보를 처리할 때 `spec_sheets`와 `memos`를 먼저 `purged`로 표시한 뒤 R2 bundle file 삭제를 시도할 수 있었다. 이 경우 R2 삭제가 실패해도 작업지시서는 이미 삭제 완료 상태가 되어 retry 후보 추적이 어색해질 수 있었다.

0.9.22438부터는 아래 순서로 처리한다.

1. 작업지시서 bundle 첨부 후보 조회
2. R2 Worker로 원본/썸네일 object 삭제
3. R2 삭제 실패 시 해당 trash item은 failed 처리하고 작업지시서는 failed 후보로 유지
4. R2 삭제 성공 후 DB에서 attachment trash item, 작업지시서, bundle memo를 purged 처리

### 2. R2 object not found 처리

`deleteR2ObjectViaWorker()`는 404, OBJECT_NOT_FOUND, NO_SUCH_KEY 계열 응답을 성공으로 처리한다. 따라서 이미 R2에 없는 더미/이전 object는 retry 시 삭제 완료 흐름으로 넘어갈 수 있다.

### 3. Worker 인증/권한/네트워크 실패 처리

Worker 인증 실패, 권한 실패, timeout, network failure는 예외로 처리한다. 이 경우 해당 file trash item은 failed로 남고, 작업지시서 후보도 failed 상태가 되어 retry 대상으로 유지된다.

### 4. 작업지시서 bundle memo purge 기준

작업지시서 실제 삭제 시 memo는 작업지시서 bundle metadata가 있는 항목만 purged 처리한다.

조건:

- `delete_source = 'workorder_bundle'`, 또는
- `delete_scope = 'bundle' AND delete_parent_type = 'workorder'`
- 그리고 `delete_parent_id = workOrderId OR delete_batch_id = workOrderId`

사용자가 작업지시서 삭제 전에 단독 삭제한 memo는 작업지시서 purge에 포함하지 않는다.

## 테스트 기준

1. `/system/storage-usage` 진입
2. 고객관리자가 삭제 요청한 file 후보 확인
3. 작업지시서 후보의 `문서 n개, 디자인 n개, 메모 n개` 확인
4. 선택 삭제 실행
5. R2 object가 있으면 삭제되고 DB가 purged 처리되는지 확인
6. R2 object가 이미 없으면 성공 처리되는지 확인
7. Worker secret/권한 실패 시 failed 후보로 유지되는지 확인
8. retry 시 failed 후보가 다시 처리 가능한지 확인

## SQL DDL

없음.
