Version :
0.9.219

Summary :
작업지시서 PC 화면 안정화 1차

Description :
작업지시서 PC 화면의 좌측 목록, 중앙 상세, 우측 첨부/메모 패널의 폭과 스크롤 여백을 정리했다. 마지막 카드와 상세 하단 섹션이 잘려 보이지 않도록 하단 여백과 scrollbar gutter를 보강하고, 3패널의 정보 밀도와 균형을 소폭 개선했다. DB schema, API route, package 의존성은 변경하지 않았다.

수정 파일 목록 :
- components/workorder/layout/DesktopWorkspaceLayout.tsx
- components/workorder/detail/views/WorkOrderDetailDesktopSections.tsx
- components/workorder/sidepanel/layout/SidePanelSectionStack.tsx
- components/layout/SidebarContent.tsx
- lib/constants/app.ts

추가 파일 목록 :
- docs/workorder-pc-stability-0.9.219.md

삭제 파일 목록 :
없음
