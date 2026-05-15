# PeaceByPiece 0.12.45

## 작업 목표

직접 그리기 기능에서 tablet/mobile landscape 상태를 차단하고, portrait 사용 안내를 표시한다.

## 반영 내용

- tablet/mobile landscape 상태를 감지한다.
- landscape 상태에서는 canvas pointer 입력을 차단한다.
- landscape 상태 안내 overlay를 표시한다.
- landscape 상태에서는 도구, 색상, 굵기, 선 스타일, undo/redo, 전체 지우기, 저장 버튼을 비활성화한다.
- portrait 상태로 돌아오면 기존 직접 그리기 기능을 다시 사용할 수 있게 유지한다.
- 기존 canvas draft format version을 올려 이전 정사각형/legacy draft 복원 잔여 영향을 줄였다.
- 기존 PNG 저장/R2 디자인 첨부 업로드 흐름은 변경하지 않았다.

## 제외

- 실제 기기 orientation lock API 사용
- 확대/축소
- 손바닥 이동
- 이미지 위에 그리기
- 기본 의류 템플릿
