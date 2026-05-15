# WorkOrder Drawing Native Orientation Draft Preservation — 0.12.39

## 목적

직접 그리기 full-screen editor에서 tablet 세로/가로 전환 시 그린 내용이 사라지는 문제를 보정한다.

## 변경 기준

- 직접 그리기 canvas의 원본 좌표계는 고정한다.
- tablet 회전으로 표시 영역이 바뀌어도 저장/복원 기준은 원본 canvas bitmap이다.
- orientation change 또는 responsive remount에 의존하지 않고, 그리기 확정 시점마다 draft snapshot을 저장한다.

## 반영 내용

1. `syncHistoryState`가 dirty 상태를 React state뿐 아니라 ref에도 즉시 반영하도록 수정했다.
2. stroke, shape, undo, redo 확정 시점에 현재 canvas snapshot을 sessionStorage에 저장한다.
3. 전체 지우기 시에는 이전 draft snapshot을 제거한다.
4. resize, orientationchange, pagehide, visibilitychange 시점에 현재 dirty canvas를 한 번 더 저장한다.
5. remount 후 draft snapshot이 있으면 기존처럼 원본 canvas 크기에 맞춰 복원한다.

## 유지한 내용

- 확대/축소 없음
- 손바닥 이동 없음
- 이미지 위에 그리기 없음
- 기본 의류 템플릿 배경 없음
- 기존 PNG 저장/R2 디자인 첨부 업로드 흐름 유지
- tldraw 고급 그리기 development feature flag 정책 유지

## 확인 항목

1. tablet 세로모드에서 직접 그리기 진입
2. 펜/도형으로 몇 개 그리기
3. 저장하지 않고 가로모드로 회전
4. 그린 내용이 유지되는지 확인
5. 가로모드에서 추가로 그리고 다시 세로모드로 회전
6. 기존 내용과 추가 내용이 모두 유지되는지 확인
7. 닫기 버튼으로 저장하지 않고 닫으면 다음 진입 시 draft가 남지 않는지 확인
8. 저장 후 PNG가 디자인 첨부 목록에 추가되는지 확인
