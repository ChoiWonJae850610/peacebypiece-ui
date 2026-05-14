# Workorder Drawing Native Layout UX 0.12.29

## 목표

직접 그리기 native canvas 모달을 tablet 사용성 기준으로 정리한다.

## 반영 내용

- 색상과 굵기 popover가 동시에 열리지 않도록 `activePopover` 단일 상태로 정리했다.
- 도구 선택 또는 캔버스 입력 시작 시 열려 있던 popover를 닫는다.
- 지우개 선택 시 캔버스 pointer 위치에 반투명 원형 cursor를 표시한다.
- drawing modal은 backdrop click으로 닫히지 않게 했다.
- 좌측 도구 패널을 제거하고 도구를 하단 toolbar로 이동했다.
- 캔버스 영역을 전체 폭 중심으로 확장했다.
- 긴 도구 안내 문구를 제거하고 현재 도구/굵기/선 스타일 요약만 toolbar에 유지했다.

## 유지한 정책

- 기본 직접 그리기는 native canvas 기반으로 유지한다.
- tldraw 고급 그리기는 development runtimeMode + feature flag 정책을 유지한다.
- 텍스트 삽입 도구는 이번 범위에 포함하지 않는다.
- 저장은 기존 PNG 생성 후 디자인 첨부 업로드 흐름을 그대로 사용한다.
- DB schema, R2 API, 첨부 API, 휴지통/purge 흐름은 변경하지 않는다.

## 테스트 항목

1. 색상 popover를 연 뒤 굵기 popover를 열면 색상 popover가 닫히는지 확인한다.
2. 굵기 popover를 연 뒤 색상 popover를 열면 굵기 popover가 닫히는지 확인한다.
3. 캔버스를 누르면 열린 popover가 닫히는지 확인한다.
4. 지우개 선택 시 cursor 위치에 원형 영역이 보이는지 확인한다.
5. tablet에서 modal 뒷배경을 터치해도 modal이 닫히지 않는지 확인한다.
6. 하단 toolbar가 PC/tablet/mobile에서 지나치게 깨지지 않는지 확인한다.
7. 저장 시 기존 디자인 첨부 업로드/R2 저장 흐름이 유지되는지 확인한다.
