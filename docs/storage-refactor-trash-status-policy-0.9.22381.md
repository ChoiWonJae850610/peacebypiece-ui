# 0.9.22381 저장소 관리 리팩토링 2차

## 목적

저장소 휴지통과 시스템관리자 실제 삭제 후보에서 사용하던 purge 상태 문자열 비교를 중앙 정책으로 이동했다.

## 반영 내용

- `ADMIN_FILE_TRASH_PURGE_STATUSES`를 추가했다.
- 휴지통 상태 정규화 함수와 pending/requested 판정 함수를 추가했다.
- 고객관리자 휴지통 표시 상태와 시스템관리자 삭제 후보 표시 상태가 같은 정책 함수를 사용하도록 정리했다.
- 시스템관리자 실제 삭제 처리 actor id를 중앙 상수로 정리했다.
- 시스템관리자 삭제 후보 row에서 중복 `companyName` 필드가 들어가던 부분을 제거했다.

## 현재 유지한 범위

DB schema 변경은 하지 않았다. `delete_reason`은 아직 기존 컬럼을 유지한다.

## 다음 리팩토링 후보

- `delete_reason` 문장 비교를 DB code 컬럼으로 이관하는 설계 문서 작성
- `attachment_trash_items.delete_reason_code` 또는 별도 reason code 정책 검토
- SQL 내부 `purge_status`/`delete_status` literal을 점진적으로 parameter 기반으로 정리
- 고객관리자/시스템관리자 저장소 문구 i18n key 추가 정리
