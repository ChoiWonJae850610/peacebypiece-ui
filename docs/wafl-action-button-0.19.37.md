# WAFL ActionButton 공통화 1차 (0.19.37)

## 목적

관리자 화면에서 반복되는 아이콘형 작업 버튼의 크기, 테두리, hover, disabled, focus ring 규격을 `WaflActionButton` 기준으로 통일한다.

## 적용 범위

- `components/common/ui/WaflActionButton.tsx` 신규 추가
- 기존 `AdminIconActionButton` / `AdminIconActionLink` / `AdminCompactActionButton`을 WAFL 공통 ActionButton 어댑터로 전환
- 멤버 초대 테이블의 공유/복사/취소 버튼을 공통 ActionButton으로 전환
- 저장소 휴지통 상단 새로고침/복원/삭제/비우기 버튼을 공통 ActionButton으로 전환
- 휴지통 버튼 class helper를 WAFL ActionButton class helper 기반으로 전환

## 비변경 범위

- DB/API/R2/첨부/메모/휴지통 삭제·복원·영구삭제 흐름은 변경하지 않는다.
- 작업지시서/원단부자재 업무 흐름은 변경하지 않는다.
- package.json / package-lock.json은 변경하지 않는다.
