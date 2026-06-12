# WAFL 컴포넌트 전환 0.21.58~0.21.62

## 0.21.58 발주 품목 수정 모달 공통 모달화
- 발주 품목 수정 모달의 직접 fixed overlay 구조를 제거했다.
- ModalShell, WaflModalSection, WaflButton, WaflInput, AppSelect 기준으로 교체했다.
- 배경 dim/blur, header/body/footer, 닫기/취소/적용 구조는 WAFL 공통 모달 기준을 따른다.

## 0.21.59 카드 액션 메뉴 공통화
- WaflActionMenuPanel, WaflActionMenuItem을 추가했다.
- 작업지시서/발주서/메모/발주 품목에서 쓰는 더보기 메뉴가 같은 action menu primitive를 타도록 정리했다.
- 삭제 액션은 휴지통 아이콘과 danger tone을 유지한다.

## 0.21.60 선택 카드 primitive 추가
- WaflSelectableCard를 추가했다.
- 작업지시서 목록 카드와 발주서 목록 카드의 outer surface를 같은 selected/normal 상태 primitive로 맞췄다.
- 목록 카드 선택/해제 흐름은 기존 로직을 유지한다.

## 0.21.61 비용 요약 primitive 추가
- WaflCostSummaryGrid, WaflCostSummaryCard, WaflCostSummaryRow를 추가했다.
- 발주 기본정보 하단 요약 카드와 발주 요약 footer의 금액/수량 row를 공통 primitive로 정리했다.

## 0.21.62 모바일/태블릿 후속 기준 기록
- 이번 패치에서는 모바일 drawer/topbar를 전면 변경하지 않았다.
- 다음 전환 대상은 MobileDrawer, MobileTopBar, WorkOrderMobileListPanel의 icon button/input/empty 구조다.
- PC 핵심 경로의 modal/menu/card/cost primitive 정리를 우선했다.
