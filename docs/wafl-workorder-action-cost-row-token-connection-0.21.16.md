# WAFL 작업지시서 action / cost row token 연결 0.21.16

## 목표

작업지시서 화면에서 아직 둥근 알약처럼 보이던 진행 단계 action button과 비용 요약 row를 WAFL shape token 기준에 더 직접 연결한다.

## 변경 기준

- 진행 단계의 `검토 완료` 등 workflow action은 직접 `rounded-[var(--pbp-radius-wafl)]`을 쓰지 않고 `WaflButton` class generator를 사용한다.
- 비용 요약의 `원단 합계`, `부자재 합계`, `공임비`, `로스비 합계` row는 surface radius가 아니라 control radius를 사용한다.
- 모바일/태블릿 비용 row의 `rounded-xl` 직접 사용을 제거하고 `wafl-shape-control`로 전환한다.
- 진행 단계 dot/spinner처럼 원형 의미가 있는 요소는 예외로 둔다.

## 확인 포인트

- `검토 완료` 버튼이 과한 pill 형태가 아니라 WAFL control button처럼 보이는지 확인한다.
- 비용 요약 row가 큰 surface radius가 아니라 작은 control radius로 보이는지 확인한다.
- 작업지시서 workflow action 클릭 로직은 변경하지 않는다.
