# 0.9.22400 시스템 저장소 프리렌더 delete_state fallback 보정

## 배경

0.9.22399에서 삭제 상태 메타데이터 컬럼을 추가했지만, 실제 DB에 migration 또는 full reset이 아직 반영되지 않은 상태에서 `next build`가 `/system/storage-usage`를 prerender하면 `attachment_trash_items.delete_source` 컬럼 조회에서 빌드가 중단될 수 있다.

대표 오류:

```text
error: column t.delete_source does not exist
Export encountered an error on /system/storage-usage/page
```

## 적용 내용

- `lib/system/storagePurgeCandidates.ts`에 삭제 상태 메타데이터 컬럼 존재 여부 확인 함수를 추가했다.
- `attachment_trash_items`에 `delete_source`, `delete_scope`, `delete_parent_type`, `delete_parent_id`, `delete_batch_id`가 모두 있을 때만 신규 메타데이터 기준 SQL을 사용한다.
- 컬럼이 아직 없으면 기존 `delete_reason` 기반 fallback SQL을 사용한다.
- `/system/storage-usage` snapshot 조회, 선택 purge 후보 조회, 작업지시서 묶음 파일 후보 조회가 같은 fallback 기준을 사용하도록 정리했다.

## 판단

이번 보정은 schema 적용 전/후 build 안정성을 위한 방어 코드다. 0.9.22399의 DB schema 리팩토링 방향은 유지한다.

## DB 변경

없음.

다만 신규 삭제 상태 메타데이터를 실제 운영 기준으로 사용하려면 0.9.22399에서 추가한 migration SQL 또는 full reset 적용이 필요하다.

## 확인 항목

1. migration/full reset 적용 전 DB에서도 `npm run build`가 `/system/storage-usage`에서 중단되지 않는지 확인한다.
2. migration/full reset 적용 후에도 `/system/storage-usage` 실제 삭제 후보가 정상 표시되는지 확인한다.
3. 작업지시서 묶음 삭제 후보가 신규 컬럼 기준으로 집계되는지 확인한다.
4. 기존 `delete_reason` 기반 데이터가 fallback으로 계속 처리되는지 확인한다.
