# UI Responsive Frame 0.17.89

## 목적

작업지시서와 원단·부자재 화면의 태블릿/모바일 전환 구조를 직접 className으로 반복하지 않고, WAFL 내부 공통 UI 프레임을 통해 관리한다.

## 추가한 공통 프레임

- `AppResponsiveWorkspace`
  - 화면 전체 스크롤/가로 스크롤 정책을 device 기준으로 통일한다.
  - `mobile`, `tablet`, `desktop` 값을 받는다.

- `AppResponsiveSurface`
  - 태블릿/모바일 상세 화면의 외곽 카드, 배경, 테두리, 여백을 통일한다.
  - PC 화면은 기존 3분할 구조를 유지하므로 이번 범위에서는 surface 적용 대상에서 제외했다.

## 적용 범위

- 작업지시서 모바일 상세
- 작업지시서 태블릿 상세
- 원단·부자재 모바일 workspace
- 원단·부자재 태블릿 workspace
- 원단·부자재 PC workspace

## 유지한 범위

- 저장 로직 변경 없음
- 상태 전환 로직 변경 없음
- DB/API/R2 흐름 변경 없음
- 작업지시서 PC 상세 구조 변경 없음
- 원단·부자재 PC 3분할 구조 변경 없음

## 다음 후보

- `AppSheet` 후보 설계
- 모바일에서 긴 보조 패널을 탭이 아니라 하단 Sheet로 열지 검토
- tablet/mobile 탭 sticky 위치와 실제 캡처 기준 여백 보정
