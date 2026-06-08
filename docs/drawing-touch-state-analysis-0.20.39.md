# 0.20.39 직접그리기 터치/상태 보정 분석

## 원인

모바일/태블릿 브라우저는 터치 입력을 `pointerType === "touch"`인 PointerEvent로 먼저 전달하는 경우가 많다.

0.20.37의 touch fallback 추가 후에도 `handlePointerDown`, `handlePointerMove`, `stopDrawing`에서 `pointerType === "touch"` 이벤트를 즉시 return하고 있었다. 이 구조에서는 PointerEvent 기반 터치 런타임에서 실제 드로잉 시작/이동/종료가 처리되지 않는다.

## 보정

- PointerEvent handler가 touch pointer도 처리하도록 early return을 제거했다.
- legacy TouchEvent fallback은 PointerEvent가 없는 런타임에서만 작동하도록 제한했다.
- 작업지시서 추가정보 sheet가 닫힐 때 active related section을 attachment로 초기화하도록 보정했다.
- 가로/세로 전환 후 디자인 탭 또는 직접그리기 상태가 추가정보 재진입 시 남는 가능성을 줄였다.

## 영향 범위

- 작업지시서 직접그리기 모바일/태블릿 입력 이벤트
- 작업지시서 추가정보 sheet close 상태 초기화
- PC drawing mouse 입력은 기존 PointerEvent 경로를 그대로 사용한다.

## 변경하지 않은 것

- 상태전환 로직
- 권한 로직
- API/DB/R2 흐름
- 첨부/메모/휴지통/purge 흐름
