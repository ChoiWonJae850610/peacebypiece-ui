# WAFL FilterBar / Section 세부 보정 0.19.31

## 목표

- 멤버관리와 협력업체관리 검색·필터 영역의 depth, 높이, 배경, 테두리, 간격을 `WaflFilterBar` 기준으로 통일한다.
- 섹션 header 우측 count label을 제거하고, 필요한 수량 정보는 상단 summary card 또는 별도 pagination/count 영역에서 다루도록 정리한다.
- 멤버관리 summary card 숫자에는 `명`, 협력업체 summary card 숫자에는 `개` 단위를 붙인다.
- 저장소 휴지통 action group은 section description 라인의 우측 action slot에 정렬한다.
- 협력업체 목록 위에서 마우스 휠 스크롤이 막히는 문제를 다시 보정한다.

## 공통 UI 규칙

- 필터 영역은 `WaflFilterBar`가 spacing, radius, border, background를 결정한다.
- 필터 label/input/select의 높이와 typography는 `WaflFilterBar` export class를 공유한다.
- 섹션의 형태는 `WaflSectionPanel`이 결정하고, 화면 파일은 content와 actions만 전달한다.
- 직접 색상이나 화면별 gradient를 추가하지 않고 `var(--pbp-*)` theme token을 사용한다.

## 확인 위치

- `/workspace/members`
- `/workspace/partners`
- `/workspace/files`
