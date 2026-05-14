# 0.12.36 직접 그리기 build 오류 수정

## 목적

0.12.35 기준 build에서 `setViewportScale` 참조가 남아 TypeScript 오류가 발생한 문제를 수정한다.

## 원인

0.12.35에서 확대/축소와 손바닥 이동 기능은 제거했지만, `WorkOrderDrawingModal.tsx` 내부에 `handleZoom` / `resetViewport` 관련 잔여 함수가 남아 있었다.

해당 함수는 제거된 viewport state와 상수에 의존하고 있었기 때문에 다음 오류가 발생했다.

- `Cannot find name 'setViewportScale'`

## 반영 내용

- `handleZoom` 잔여 함수 제거
- `resetViewport` 잔여 함수 제거
- 확대/축소 관련 잔여 참조 제거
- 직접 그리기는 100% 기준 native canvas 도구로 유지

## 유지한 정책

- 확대/축소 기능 제외
- 손바닥 이동 기능 제외
- 이미지 위에 그리기 제외
- 기존 PNG 저장 / R2 디자인 첨부 업로드 흐름 유지
- tldraw 고급 그리기 development flag 정책 유지
