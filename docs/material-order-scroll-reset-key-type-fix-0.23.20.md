# Material Order Scroll Reset Key Type Fix — 0.23.20

## 목적
0.23.19에서 발주서 반응형 View를 분리한 뒤, 선택된 발주서가 없는 상태의 `null` 값이 공통 Workspace Frame의 `string` 타입과 충돌해 production build가 실패한 문제를 수정합니다.

## 변경 내용
- 모바일·태블릿·데스크톱 View 경계에서 `scrollResetKey`의 `null`을 빈 문자열로 정규화합니다.
- 상위 editor의 선택 상태 타입과 공통 Workspace Frame의 입력 계약을 각각 유지합니다.
- 발주서 선택·저장·API·레이아웃 동작은 변경하지 않습니다.

## DB Migration
없음
