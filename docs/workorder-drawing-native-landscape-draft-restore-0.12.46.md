# 0.12.46 직접 그리기 landscape 차단 상태 draft 유지 보정

## 목적

태블릿 세로모드에서 직접 그리기를 사용하다가 가로모드로 회전해 안내 메시지를 확인한 뒤 다시 세로모드로 돌아왔을 때, 기존 그림이 사라지는 문제를 보정한다.

## 변경 요약

- tablet-like viewport 판정을 회전 중에도 쉽게 해제되지 않도록 보정했다.
- touch tablet-like viewport를 한 번 감지하면 해당 직접 그리기 세션에서는 portrait canvas 기준을 유지한다.
- landscape 차단 상태로 들어갈 때 현재 canvas snapshot을 저장한다.
- landscape 차단 상태에서는 canvas를 초기화하지 않고 입력만 막는다.
- landscape 차단 상태로 들어가면 진행 중인 stroke/shape preview 상태만 정리한다.
- 다시 portrait 상태로 돌아오면 기존 canvas bitmap을 유지한 채 이어서 그릴 수 있게 한다.

## 유지한 정책

- 실제 기기 orientation lock API는 사용하지 않는다.
- tablet/mobile landscape에서는 입력을 막고 세로모드 사용 안내를 표시한다.
- PNG 저장/R2 디자인 첨부 흐름은 변경하지 않는다.
- 확대/축소, 손바닥 이동, 이미지 위에 그리기, 기본 의류 템플릿은 제외한다.
