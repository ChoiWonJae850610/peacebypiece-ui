Version : 0.11.75
Summary : 작업지시서 목록 컨트롤 밀도와 초기화 보정
Description : 작업지시서 업무 화면의 검색/필터/정렬 컨트롤 밀도를 PC와 모바일에서 낮추고, 검색어·상태 필터·정렬을 한 번에 기본값으로 되돌리는 초기화 액션을 추가했습니다. 상태/정렬 option 생성 로직을 공통 helper로 분리해 PC sidebar와 mobile drawer의 중복 정의를 줄였습니다.
수정 파일 목록 :
- components/layout/SidebarContent.tsx
- components/layout/MobileDrawer.tsx
- components/workorder/WorkOrderWorkspace.tsx
- lib/workorder/list/workOrderListControls.ts
- lib/workorder/workspace/builders/sidebarBuilders.ts
- lib/workorder/workspace/buildWorkspaceViewModel.ts
- lib/workorder/workspace/viewModelTypes.ts
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts
- lib/constants/app.ts
추가 파일 목록 :
- docs/qa-workorder-list-ui-final-density-0.11.75.md
삭제 파일 목록 :
없음
