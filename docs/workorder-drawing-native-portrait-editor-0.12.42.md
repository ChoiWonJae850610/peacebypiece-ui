# WorkOrder Drawing Native Portrait Editor — 0.12.42

## 목적

직접 그리기 화면을 tablet portrait-first 작업판으로 정리한다.

## 변경 내용

- tablet/mobile 직접 그리기 원본 canvas를 portrait 비율로 고정한다.
- desktop은 기존 landscape canvas를 유지한다.
- 실제 기기 orientation lock API는 사용하지 않는다.
- 가로모드 tablet에서도 editor 내부 drawing board는 portrait 작업판으로 표시한다.
- canvas DOM `width` / `height` 속성을 명시해 실제 drawing buffer와 CSS 표시 크기 불일치를 줄인다.
- 이전 draft snapshot 복원 시 원본 비율을 강제로 늘려 찌그러뜨리지 않고, 흰색 canvas 위에 contain 방식으로 복원한다.
- 정사각형 입력 제한을 의도하지 않도록 실제 canvas bounding rect 기준 좌표 변환을 유지한다.

## 제외

- 확대/축소
- 손바닥 이동
- 이미지 위에 그리기
- 기본 의류 템플릿
- 실제 OS/browser orientation lock
