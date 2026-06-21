# Modal And Focus Current Baseline

- 기준 앱 버전: `0.24.11`
- 목적: WAFL modal, focus, mobile/tablet input UX의 현재 해결 방식과 남은 주의사항을 정리한다.

## 현재 공통 정책

- 공통 modal 구성은 `components/common/modal/*`와 WAFL UI catalog 정책을 우선한다.
- `input`, `textarea`, `select`, `button`, link, role button은 native event order를 유지한다.
- `pointerdown` 또는 `touchstart`에서 입력을 강제로 blur하지 않는다.
- keyboard dismissal은 click/tap 완료 이후로 지연한다.
- modal panel은 세로 스크롤을 허용하고 background scroll은 containment로 막는다.
- closing cleanup에서는 active element blur가 가능하지만, Apply/Close tap을 가로채면 안 된다.

## 화면별 적용 대상

- workorder basic/process/material/inventory/manager/attachment modal
- material-order line add/edit modal
- inventory inbound/adjust/deduction modal
- tablet side panel과 mobile drawer에서 열리는 modal
- iPad mini landscape, tablet portrait/landscape, mobile portrait

## 해결된 방식

- iPad mini landscape에서 keyboard dismissal 후 버튼 첫 tap이 사라지는 문제는 공통 focus/input policy로 수렴한다.
- 개별 화면이 pointer/touch blur workaround를 추가하지 않고 공통 modal layer에서 처리한다.
- 발주 품목 추가 modal은 local input state와 저장 mutation을 분리한다.
- background scroll lock은 body 전체 touch action 차단보다 modal/shell containment를 우선한다.

## 남은 재현 조건

- 실제 iOS Safari/Chrome WebView에서 software keyboard dismissal 후 첫 tap.
- tablet landscape에서 side panel modal과 body scroll lock이 동시에 걸리는 경우.
- validation error가 footer 버튼 근처에 표시될 때 버튼 영역이 밀리거나 가려지는 경우.
- repeated tap, slow network, mutation pending 상태에서 footer button disable/enable 타이밍.

## 폐기된 접근

- `pointerdown`/`touchstart`에서 active input을 즉시 blur하는 방식.
- 화면별로 별도 focus trap workaround를 추가하는 방식.
- modal open 중 `body.style.touchAction = "none"`으로 전체 터치를 막는 방식.
- modal을 drawer로 무조건 대체하는 방식.

## 관련 테스트

- `tests/e2e/helpers/functionsResponsive.mjs`
- `tests/approved-workflow-contract.mjs`
- 수동 확인: iPad mini landscape, tablet portrait/landscape, mobile portrait
