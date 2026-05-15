# 0.12.40 직접 그리기 canvas 고정 비율/bitmap 보존 보정

## 목적

태블릿 세로/가로 전환 후 직접 그리기 canvas의 그림이 찌그러지는 문제를 보정한다.

## 문제

0.12.39에서는 회전 시 draft snapshot은 보존되었지만, canvas 표시 영역이 화면 비율에 맞춰 강제로 늘어나면서 정사각형이 직사각형처럼 보이는 문제가 있었다.

원인은 canvas의 실제 drawing buffer 크기와 화면 표시 크기를 분리하지 않고 `h-full w-full`로 늘려 보여준 데 있다.

## 수정 기준

- 원본 canvas 크기는 고정한다.
- canvas DOM의 `width` / `height` 속성은 원본 크기를 유지한다.
- 화면 표시 크기는 container 크기 안에서 원본 비율을 유지하는 contain 방식으로 계산한다.
- 세로/가로 전환 후에도 snapshot은 원본 canvas 크기 그대로 복원한다.
- 그림 좌표는 화면 방향에 맞춰 재매핑하지 않는다.

## 적용 내용

- canvas 표시 크기 계산용 `CanvasDisplaySize`를 추가했다.
- `ResizeObserver`로 canvas container 크기 변경을 감지한다.
- container 크기와 원본 canvas 비율을 기준으로 표시 width/height를 계산한다.
- canvas CSS의 `h-full w-full` 강제 stretch를 제거했다.
- canvas는 계산된 px 크기로만 표시된다.
- canvas wrapper는 중앙 정렬 surface가 되고, 실제 흰색 canvas만 고정 비율로 표시된다.
- 지우개 cursor도 실제 canvas bounding rect 기준으로 크기를 계산한다.
- canvas 밖 pointer에서는 지우개 cursor를 숨긴다.

## 제외 항목

- 확대/축소 재도입 없음
- 손바닥 이동 재도입 없음
- 이미지 위에 그리기 없음
- 기본 의류 템플릿 배경 없음
- DB/R2/첨부 API 변경 없음

## 확인 항목

1. 가로모드에서 정사각형을 그린다.
2. 세로모드로 회전한다.
3. 정사각형이 직사각형처럼 찌그러지지 않는지 확인한다.
4. 세로모드에서 추가로 그리고 가로모드로 다시 회전한다.
5. 기존 그림과 추가 그림 모두 비율이 유지되는지 확인한다.
6. 저장 후 PNG도 같은 비율로 보존되는지 확인한다.
