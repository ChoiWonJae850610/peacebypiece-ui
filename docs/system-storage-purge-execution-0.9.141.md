# 0.9.141 시스템관리자 R2 purge 수동 실행 1차

## 목적

0.9.140에서 추가한 `/system/storage-usage` 삭제 후보 목록에 실제 실행 단계를 연결한다. 30일 경과 또는 영구삭제 요청 상태의 휴지통 파일만 대상으로 하며, R2 직접 SDK 삭제가 아니라 기존 Worker 서명 URL 삭제 흐름을 사용한다.

## 확정 정책

- 고객사별 삭제 보관 기간 설정은 사용하지 않는다.
- 모든 고객사는 공통 30일 휴지통 보관 정책을 따른다.
- 삭제 후 30일이 지난 파일 또는 고객관리자가 영구삭제 요청한 파일만 purge 후보가 된다.
- 실제 R2 삭제 시 원본 `storage_key`와 썸네일 `thumbnail_key`를 함께 삭제한다.
- 삭제 성공 후 `attachment_trash_items.purged_at`과 `purge_status='purged'`를 기록한다.
- 삭제 실패 항목은 `last_purge_error`와 `purge_attempt_count`를 갱신하고 후보 목록에 남긴다.

## 0.9.141 반영 내용

- `/system/storage-usage` 후보 목록에 체크박스와 선택 삭제 버튼을 연결한다.
- 전체 도래 항목 삭제 버튼을 연결한다.
- 실행 전 브라우저 확인창으로 파일 수와 복구 불가 경고를 표시한다.
- `/api/system/storage-usage/purge` API를 추가해 시스템관리자 화면에서 purge를 요청한다.
- `runSystemStoragePurge`에서 후보 재검증 후 Worker 삭제를 수행한다.
- 원본과 썸네일 key가 모두 있으면 둘 다 삭제한다.
- 삭제 후 R2 URL cache를 key 단위로 제거한다.

## 의도적으로 제외한 항목

- DB schema 변경
- 자동 purge 스케줄러
- Vercel Cron 또는 Cloudflare Scheduled Trigger
- 고객사별 삭제 보관 기간 설정
- R2 직접 SDK 삭제
- 첨부 업로드/다운로드/미리보기 로직 변경

## 테스트 기준

1. `/system/storage-usage` 진입
2. 삭제 후보가 표시되는지 확인
3. 후보 1개 선택 후 `선택 삭제` 실행
4. 확인창에서 취소하면 API 요청이 발생하지 않는지 확인
5. 확인창에서 확인하면 `/api/system/storage-usage/purge`가 호출되는지 확인
6. R2에서 원본 key와 썸네일 key가 삭제되는지 확인
7. DB에서 해당 trash item의 `purged_at`과 `purge_status`가 갱신되는지 확인
8. 실패 시 실패 사유가 목록에 남는지 확인

## 다음 단계

0.9.142에서는 purge 실패/재시도/로그 정리를 진행한다. 자동 purge는 아직 켜지 않는다.
