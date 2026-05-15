# WorkOrder Drawing Native Canvas Ratio Fix 0.12.41

## 목적

0.12.40에서 mobile variant에만 `900 x 900` 정사각형 원본 canvas가 적용되어 직접 그리기 화면의 원본 비율이 variant별로 달라질 수 있었다.

이번 버전에서는 직접 그리기 원본 canvas 크기를 모든 variant에서 동일하게 고정한다.

## 변경 내용

- mobile 전용 `900 x 900` canvas 크기 분기를 제거했다.
- desktop/tablet/mobile 모두 `1280 x 900` 원본 canvas 크기를 사용한다.
- 화면 세로/가로 전환 시 원본 canvas 비율은 유지하고, CSS 표시 크기만 contain 방식으로 조정하는 방향을 유지한다.
- 기존 PNG 저장/R2 디자인 첨부 흐름은 변경하지 않았다.

## 제외한 내용

- 확대/축소
- 손바닥 이동
- 이미지 위에 그리기
- 기본 의류 템플릿
- tldraw development flag 정책 변경

## 확인 기준

- tablet 세로/가로 모두 원본 canvas 비율이 동일해야 한다.
- mobile variant에서도 canvas가 정사각형으로 강제되지 않아야 한다.
- 가로모드에서 그린 정사각형이 세로모드 회전 후 찌그러지지 않아야 한다.
