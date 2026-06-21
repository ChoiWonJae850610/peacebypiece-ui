# WAFL workorder device density 0.21.40

## 목적

작업지시서 PC 기준 UI를 모바일/태블릿 화면에서도 같은 WAFL Foundation 계열로 보이게 보정한다.

## 정리 범위

- 모바일/태블릿 작업지시서 header summary action
- 모바일/태블릿 비용 요약 total/process/empty row
- 모바일/태블릿 원단·부자재 card, 0수량 warning, add/empty slot
- 모바일/태블릿 제작 공정 add/empty slot
- 모바일 side panel accordion shell

## 기준

- 같은 역할의 box는 `shape="control"`을 우선 사용한다.
- 모바일은 `default` density, 태블릿은 필요 시 `spacious` density를 사용한다.
- dot, spinner, progress node는 원형 의미가 있으므로 예외로 둔다.
- 기능 로직, 저장/조회/상태 변경은 포함하지 않는다.
