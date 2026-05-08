# 0.9.22390 저장소 snapshot base_title 조회 오류 수정

## 목적

`/api/admin/files/snapshot`에서 실제 DB schema에 없는 `spec_sheets.base_title` 컬럼을 조회해 저장소 관리 화면이 실패하던 문제를 수정한다.

## 수정 내용

- `lib/admin/adminFiles.serverActions.ts`의 저장소 snapshot SQL에서 `s.base_title` 직접 참조를 제거했다.
- `workorder_base_title`과 `base_title`은 `NULL::text` alias로 유지해 기존 표시 formatter 입력 구조는 보존했다.
- 작업지시서명 표시는 기존 `title`, `reorder_round`, `work_order_kind`, `is_rework` 값으로 계산한다.
- 리오더 작업지시서명은 title과 reorder_round 조합으로 계속 표시된다.
- DB schema 변경은 하지 않았다.

## 빌드 확인 규칙

ChatGPT/container 환경에서는 `npm run build`를 실행하지 않는다. 빌드는 사용자가 로컬에서 확인한다.
