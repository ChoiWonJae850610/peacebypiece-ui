Version :
0.9.22398

Summary :
삭제 상태 DB 구조 리팩토링 설계 정리

Description :
저장소와 휴지통의 삭제 상태를 문장 기반 delete_reason 비교가 아니라 delete_source, delete_scope, delete_parent_id, purge_status 같은 구조화된 코드값으로 정리하는 설계 문서를 추가했다. 이번 버전은 실제 DB schema 변경 없이 다음 schema 적용 버전에서 사용할 SQL 초안, full_reset 반영 범위, smoke test 추가 항목을 문서화했다.

수정 파일 목록 :
- lib/constants/app.ts

추가 파일 목록 :
- docs/storage-delete-state-schema-refactor-0.9.22398.md

삭제 파일 목록 :
없음
