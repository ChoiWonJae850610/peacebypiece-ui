# WAFL section description action alignment — 0.19.33

## 목표

`WaflSectionPanel`의 description action slot을 섹션 설명문 라인 우측 끝 정렬 기준으로 보정한다.

## 적용 기준

- 섹션 제목/설명/divider 구조는 유지한다.
- description action은 설명문과 같은 높이에서 우측 끝에 정렬한다.
- 저장소 휴지통 버튼은 설명문 오른쪽 끝에 위치한다.
- 통계 분석 탭도 divider 바로 위 설명문 라인의 우측에 위치한다.
- 화면별 수동 위치 보정이 아니라 `WaflSectionPanel` 공통 레이아웃을 우선 보정한다.

## 영향 범위

- 저장소관리 휴지통 action group
- 통계정보 분석 탭 group
- `WaflSectionPanel` descriptionActions slot
