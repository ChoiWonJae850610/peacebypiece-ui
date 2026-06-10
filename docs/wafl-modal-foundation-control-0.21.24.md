# WAFL modal foundation control 0.21.24

## 목적
작업지시서 모달 안의 select, preview, summary, empty, selectable row가 같은 WAFL foundation control 계열로 보이도록 정리한다.

## 기준
- shape는 `control` 기준으로 고정한다.
- 선택됨, 현재값, 빈 상태는 `selected/current/empty` state와 tone으로 구분한다.
- 모달 내부에서 직접 radius를 추가하지 않는다.
- 기능 로직, 저장/조회/상태 변경 흐름은 변경하지 않는다.

## 적용
- 기본정보 수정 모달의 preview card에 control/current 기준을 명시한다.
- 재고 수정 모달의 현재/반영 후 예상, 안내, 이력 row, empty state를 control shape로 맞춘다.
- 담당자 변경 모달 후보 row에 current state를 추가하고 selected/current/default가 같은 shape를 공유하게 한다.
- `/ui` Foundation primitive 샘플에 modal preview/empty 예시를 추가한다.
