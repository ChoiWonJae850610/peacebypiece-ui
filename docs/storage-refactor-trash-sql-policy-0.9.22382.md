# 0.9.22382 저장소 관리 리팩토링 3차 — 휴지통 SQL 상태 정책 정리

## 목적

저장소 휴지통과 시스템관리자 실제 삭제 후보 로직에서 `pending`, `purge_requested`, `purged`, `restored`, `failed`, `active`, `none` 같은 상태 문자열이 SQL 안에 직접 반복되는 범위를 줄인다.

## 반영 내용

- `lib/admin/files/trashPolicy.ts`에 휴지통 상태 SQL literal과 상태 목록 SQL literal을 중앙화했다.
- 고객관리자 휴지통 복원/선택 삭제/작업지시서 묶음 복원/선택 삭제 SQL이 중앙 정책 값을 참조하도록 정리했다.
- 시스템관리자 실제 삭제 후보 조회/처리 SQL이 중앙 정책 값을 참조하도록 정리했다.
- 시스템관리자 실제 삭제 처리 actor id 하드코딩을 `ADMIN_FILE_TRASH_ACTOR_IDS.systemStoragePurge` 참조로 교체했다.

## 유지한 범위

- DB schema 변경 없음.
- `delete_reason` 컬럼은 기존 구조를 유지한다.
- 작업지시서 삭제 묶음 판단은 기존 사유 문자열 컬럼을 계속 사용하되, 직접 문자열 비교가 아니라 중앙 정책 상수를 통해 사용한다.
- R2 삭제는 기존 Worker 기반 흐름을 유지한다.

## 다음 검토

`delete_reason`을 장기적으로 문장 비교가 아닌 reason code 기반으로 바꾸려면 DB schema 변경이 필요하다. 이 작업은 별도 명시 요청이 있을 때 `delete_reason_code` 또는 별도 코드 테이블 설계와 함께 진행하는 것이 안전하다.
