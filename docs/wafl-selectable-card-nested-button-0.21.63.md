# WAFL selectable card nested button fix 0.21.63

## 목적

0.21.62에서 `WaflSelectableCard`가 button으로 렌더링되는 경로와 카드 내부 action button이 중첩되면서 React hydration 오류가 발생했다.

## 수정 기준

- `WaflSelectableCard`는 선택 가능한 surface 역할이므로 native `button`을 직접 렌더링하지 않는다.
- 카드 내부의 주 클릭 영역, 더보기 메뉴, 삭제 버튼 같은 실제 액션 버튼은 독립적인 button으로 유지한다.
- `component` prop을 허용해 기존 WAFL audit/component tag 기준을 유지한다.
- disabled 상태는 `data-disabled`/`aria-disabled`로 표현한다.

## 확인 대상

- 발주서 목록 카드 hydration 오류가 사라지는지 확인한다.
- 작업지시서 목록 카드의 선택/더보기 버튼이 유지되는지 확인한다.
- 협력업체 유형 카드처럼 `component` prop을 넘기는 화면의 타입 오류가 사라지는지 확인한다.
