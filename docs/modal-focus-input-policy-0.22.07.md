# WAFL modal focus and numeric input policy 0.22.07

## 공통 포커스 정책

- 입력 필드, 셀렉트, 버튼을 누르기 직전에 활성 입력을 강제로 blur하지 않는다.
- 모달 내부의 비상호작용 여백을 누른 경우에만 현재 모달 입력의 포커스를 해제한다.
- footer action은 첫 pointer/touch 이벤트에서 포커스를 강제로 해제하지 않고 정상 click까지 전달한다.
- 모달 종료 시 포커스와 body scroll-lock 정리는 기존 `useModalEnvironment`가 담당한다.
- 모바일과 태블릿에서는 입력 필드 간 이동, 키보드 닫힘, 적용 버튼 동작이 동일한 흐름을 사용한다.

## 숫자 입력 정책

- `AppNumberInput`은 입력 중 표시 문자열과 숫자 상태를 동기화한다.
- pointer/touch 시작 시 화면별 `onBeforeInteract` blur 보정을 실행하지 않는다.
- Enter 키와 모달 비상호작용 여백 탭으로만 명시적인 키보드 종료를 허용한다.

## 발주 수량 표시 정책

- 발주대상, 발주 품목 카드와 진행 문구의 수량은 `ko-KR` 그룹 구분자를 사용한다.
- 소수는 최대 세 자리까지 유지한다.
