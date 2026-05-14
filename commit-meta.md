Version :
0.11.94

Summary :
작업지시서 상세 입력과 검색 필터 semantic token 적용

Description :
작업지시서 발주정보, 검색창, 필터, 정렬, 메모 입력 영역에 semantic token 기반 표시 규칙을 적용했다. 발주정보의 선택 가능 필드, 직접 입력 필드, 계산 필드 톤을 생산구성 규칙과 맞추고, 작업 메모 입력과 등록/수정/삭제 액션도 공통 의미 class 기준으로 정리했다.

수정 파일 목록 :
- lib/constants/app.ts
- app/globals.css
- lib/theme/semanticThemeTokens.ts
- components/layout/SidebarContent.tsx
- components/layout/MobileDrawer.tsx
- components/workorder/detail/sections/OrderInfoSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailTabletOrderInfoSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailMobileOrderInfoSection.tsx
- components/workorder/sidepanel/WorkOrderMemoPanel.tsx

추가 파일 목록 :
- docs/workorder-detail-controls-semantic-token-0.11.94.md

삭제 파일 목록 :
없음
