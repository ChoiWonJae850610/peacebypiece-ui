# 0.11.49 작업지시서 i18n 잔여 정리

## 목적

작업지시서 업무 화면에서 고객에게 직접 보일 수 있는 남은 하드코딩 문구를 i18n 리소스 기반으로 정리한다.

## 반영 범위

- 작업지시서 메모 패널 작성자 fallback 문구
- 메모 댓글 marker 문구
- 모바일/태블릿/PC 공통 섹션 접기 버튼의 하드코딩 한국어 aria label 제거

## 수정 내용

### `components/workorder/sidepanel/WorkOrderMemoPanel.tsx`

- `대표` fallback을 `ui.memo.adminAuthorFallback`으로 이동했다.
- `이름 없음` fallback을 `ui.memo.unknownAuthorFallback`으로 이동했다.
- 댓글 marker `ㄴ`을 `ui.memo.replyMarker`로 이동했다.
- 메모 작성자 표시 로직은 그대로 유지하고 표시 문구만 i18n 리소스 기반으로 변경했다.

### `components/workorder/detail/shared/detailEditorShared.tsx`

- `SectionHeader` 내부의 `열기/접기` 하드코딩 aria label을 제거했다.
- 필요 시 상위 컴포넌트에서 `toggleLabel`을 넘길 수 있도록 optional prop을 추가했다.
- 기존 섹션 열림/접힘 동작은 변경하지 않았다.

### `lib/i18n/ko/workorder.ts`, `lib/i18n/en/workorder.ts`

- 메모 작성자 fallback과 댓글 marker key를 추가했다.

## 변경하지 않은 것

- 작업지시서 저장 로직
- workflow 상태 변경 로직
- 발주정보/생산구성 저장 정책
- 첨부/R2 upload/download/delete/restore/purge 흐름
- 메모 생성/수정/삭제 API 흐름
- DB schema

## 후속 권장

0.11.50 제품화 전 QA 체크리스트 작성으로 이동하기 전에 build log에서 i18n key 누락이나 타입 오류가 없는지 확인한다.
