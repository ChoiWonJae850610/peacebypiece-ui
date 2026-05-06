Version :
0.9.220

Summary :
작업지시서 상세 UX 섹션 정리

Description :
작업지시서 PC 상세 화면에서 비용 요약, 발주 정보, 생산 구성의 섹션 위계를 정리했다. 비용 요약은 총 비용과 단가를 먼저 확인할 수 있게 재구성하고, 발주/원단/외주 테이블에는 빈 상태 행과 내부 스크롤 안정성을 보강했다. 원단/부자재 발주 화면 신규 구현, DB schema, API route, package 의존성은 변경하지 않았다.

수정 파일 목록 :
- components/workorder/detail/views/WorkOrderDetailDesktopSections.tsx
- components/workorder/detail/WorkOrderCostSummarySection.tsx
- components/workorder/detail/sections/OrderInfoSection.tsx
- components/workorder/detail/sections/MaterialSection.tsx
- components/workorder/detail/sections/OutsourcingSection.tsx
- components/workorder/detail/sections/ProductionCompositionSection.tsx
- lib/constants/app.ts

추가 파일 목록 :
- docs/workorder-detail-section-ux-0.9.220.md

삭제 파일 목록 :
없음
