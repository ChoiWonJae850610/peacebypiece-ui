# WAFL modal row visual token · 0.21.17

## 목적

작업지시서 담당자 변경 모달의 현재 담당자 row와 모달 내부 패널류가 WAFL shape token 기준을 타도록 보정한다.

## 변경 기준

- 모달 내부의 작은 정보 row는 `wafl-shape-control` 기준을 사용한다.
- 모달 내부의 큰 section/empty/warning panel은 `wafl-shape-surface` 기준을 사용한다.
- `rounded-2xl` 직접 사용을 modal content class token에서 제거한다.
- 담당자 변경 모달의 현재 담당자 row는 `WaflInfoRow`로 전환해 후보 카드와 다른 목적의 정보 row임을 명확히 한다.

## 후속 꾸밈 방향

shape와 size가 정리된 뒤에는 컴포넌트를 다시 늘리는 방식이 아니라 token 위에 tone/variant/depth를 추가한다.

- shape는 고정한다.
- 역할별 tone을 추가한다.
- selected/current/disabled 상태만 색과 border로 구분한다.
- 화면별 직접 rounded/shadow/background 조합은 금지한다.
