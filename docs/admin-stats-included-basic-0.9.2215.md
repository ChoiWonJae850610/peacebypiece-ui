# 0.9.2215 관리자 통계 포함 구조 보정

## 목적

상위 요금제 화면에서 하위 요금제 통계가 보이지 않는 것처럼 느껴지는 문제를 줄인다.

## 기준

- Standard는 Basic 통계를 포함한다.
- Growth는 Basic, Standard 통계를 포함한다.
- Premium은 Basic, Standard, Growth 통계를 포함한다.
- 포함 범위 배지는 버튼이 아니라 표시 정보다.

## UI 변경

- Included Plan 영역의 배지를 클릭 버튼처럼 보이지 않게 변경한다.
- Basic이 아닌 요금제에서는 `Basic 포함 통계` 섹션을 별도로 표시한다.
- Basic 포함 통계에는 작업지시서 상태, 파일 사용량, 협력업체 분포를 표시한다.

## 제외

- DB schema 변경 없음
- API route 변경 없음
- package 의존성 변경 없음
