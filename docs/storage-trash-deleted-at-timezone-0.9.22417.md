# 0.9.22417 저장소/휴지통 삭제일시 시간대 표시 기준 보정

## 목표
작업지시서 삭제일시와 문서/디자인 휴지통 삭제일시가 같은 삭제 액션에서도 서로 다른 시각처럼 보이는 문제를 보정한다.

## 원인
`spec_sheets.deleted_at`은 `timestamp without time zone`이었고, `attachments` / `attachment_trash_items` / `memos`의 `deleted_at`은 `timestamptz`였다. 같은 `now()` 기반 삭제라도 DB column type과 JS Date 변환 경로가 달라 화면에서 9시간 차이처럼 표시될 수 있었다.

## 반영
- `spec_sheets.deleted_at`을 `timestamptz`로 변경
- 기존 `spec_sheets.deleted_at` 값은 한국 시간으로 입력된 값으로 보고 `AT TIME ZONE 'Asia/Seoul'` 기준 변환
- 저장소관리 날짜 표시를 `Asia/Seoul` 기준 formatter로 중앙화
- `/admin/files`와 `/system/storage-usage`의 저장소 날짜 표시가 같은 formatter를 사용하도록 정리

## DB 적용
개발 DB reset이 가능한 상태이므로 full reset을 권장한다. migration을 적용할 경우 `db/schema/patch_0_9_22417_spec_sheets_deleted_at_timestamptz.sql`을 사용한다.
