# 0.9.22373 — 저장소 파일 운영 요약 삭제 요청 항목 보정

## 목적

저장소 관리 상단의 파일 운영 요약 카드에서 `대용량 파일 / 검토 예정` 항목을 제거하고, 고객관리자가 영구삭제 요청했으며 시스템관리자 실제 삭제 처리를 기다리는 첨부파일 수와 용량을 표시한다.

## 기준

- 사용중 파일: 현재 활성 첨부파일 개수와 용량
- 휴지통 파일: 고객관리자 휴지통에서 복구 가능한 첨부파일 개수와 용량
- 삭제 요청: `attachment_trash_items.purge_status = 'purge_requested'`이고 아직 복구/실제 삭제되지 않은 첨부파일 개수와 용량

작업지시서가 영구삭제 요청된 경우에도 연결 첨부파일이 2개라면 삭제 요청 항목은 2개로 계산한다. 용량도 연결 첨부파일의 용량만 합산한다.

## 빌드 오류 수정

`AdminFileActionResult`에는 `requestedCount`, `affectedCount` 선택 필드가 있으나 `createAdminFileActionResult` helper의 input 타입이 좁게 선언되어 있어 build type check가 실패했다. helper input 타입을 `AdminFileActionResult`로 넓혀 actionFlow 반환 객체와 타입을 맞췄다.
