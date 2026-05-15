# WorkOrder Drawing Native Portrait Hit Area Reset 0.12.44

## 목적

직접 그리기 화면에서 tablet 세로/가로 전환 후 캔버스 안쪽에 남던 정사각형 경계와 입력 제한을 제거한다.

## 적용 기준

- 실제 기기 orientation lock API는 사용하지 않는다.
- tablet/mobile 직접 그리기는 portrait 작업판 기준을 유지한다.
- 가로모드에서도 세로형 작업판을 가운데 표시한다.
- canvas 표시 영역과 pointer 입력 영역을 동일하게 맞춘다.
- 이전 draft snapshot은 format version을 올려 폐기한다.

## 변경 내용

- draft snapshot format version을 3으로 올려 이전 900×900/legacy snapshot 복원을 차단했다.
- pointer 이벤트를 canvas 바깥 wrapper가 아니라 실제 canvas element에서 받도록 변경했다.
- 지우개 커서 위치도 실제 canvas bounding rect 기준으로 계산한다.
- canvas 주변 wrapper의 border와 별도 흰색 surface를 제거해 안쪽 정사각형처럼 보이는 경계를 줄였다.
- canvas container는 표시 크기 계산용으로만 사용하고, 실제 drawing hit area는 canvas와 일치시켰다.

## 유지한 것

- PNG 저장/R2 디자인 첨부 흐름 유지
- backdrop click 닫기 방지 유지
- 뒤로가기 방지 유지
- 확대/축소, 손바닥 이동, 이미지 위 그리기, 기본 의류 템플릿 제외
- tldraw development flag 정책 유지

## 확인 항목

- tablet 세로모드에서 흰색 캔버스 안쪽 정사각형 경계가 남지 않는지 확인
- 흰색 캔버스 전체에서 그림이 그려지는지 확인
- tablet 가로모드에서 세로형 작업판으로 표시되는지 확인
- 저장 후 PNG가 디자인 첨부 목록에 추가되는지 확인
