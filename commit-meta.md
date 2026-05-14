Version :
0.11.93

Summary :
작업지시서 목록과 상태 뱃지 semantic token 적용

Description :
작업지시서 좌측 목록의 생성 버튼, 선택 카드, 상태 뱃지, 빈 상태 표시를 semantic theme token 기준 class로 정리했다. 상태 뱃지는 workflow 상태별 색상값을 컴포넌트에서 직접 쓰지 않고 presentation helper와 CSS 변수 기반 class를 통해 적용하도록 분리했다.

수정 파일 목록 :
- lib/constants/app.ts
- app/globals.css
- lib/theme/semanticThemeTokens.ts
- components/layout/SidebarContent.tsx
- components/workorder/list/WorkOrderListCard.tsx

추가 파일 목록 :
- lib/workorder/presentation/workOrderListSemanticPresentation.ts
- docs/workorder-list-semantic-token-0.11.93.md

삭제 파일 목록 :
없음
