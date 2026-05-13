Version : 0.11.73
Summary : 작업지시서 목록 검색 연동과 컨트롤 밀도 보정
Description : 작업지시서 업무화면의 검색어를 q query와 연동하고, 상태 필터/정렬 변경 시 검색어를 유지하도록 보정했습니다. PC 좌측 목록의 검색·필터·정렬 컨트롤 높이를 줄이고, 모바일 drawer에도 상태 필터와 정렬 select를 추가했습니다.
수정 파일 목록 :
- app/worker/page.tsx
- components/layout/SidebarContent.tsx
- components/layout/MobileDrawer.tsx
- components/workorder/WorkOrderWorkspace.tsx
- lib/hooks/useWorkOrder.ts
- lib/hooks/workorder/useWorkOrderCoreState.ts
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts
- lib/constants/app.ts
추가 파일 목록 :
- docs/qa-workorder-list-ui-search-0.11.73.md
삭제 파일 목록 :
- 없음
