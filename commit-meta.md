Version : 0.15.92
Summary : 작업지시서 선택 전환 스크롤 및 생산구성 PC 가로 스크롤 정리
Description : 좌측 목록에서 다른 작업지시서를 선택하면 PC의 가운데 상세 패널과 우측 패널이 상단으로 이동하도록 보정했습니다. 태블릿과 모바일도 선택 전환 시 작업지시서 본문 시작 위치로 돌아가도록 정리했습니다. PC 데스크톱 폭에서는 원단/부자재와 외주공정 테이블이 가로 스크롤바를 만들지 않도록 생산구성 테이블 overflow 정책을 통일했습니다. 태블릿 이하에서는 기존처럼 가로 스크롤을 허용합니다. npm run build 미실행 — 사용자가 로컬에서 확인.
수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/layout/DesktopWorkspaceLayout.tsx
- components/workorder/layout/TabletSplitLayout.tsx
- components/workorder/layout/MobileSectionStack.tsx
- components/workorder/layout/WorkOrderDetailDesktopView.tsx
- components/workorder/layout/WorkOrderDetailTabletView.tsx
- components/workorder/layout/WorkOrderDetailMobileView.tsx
- components/workorder/detail/sections/MaterialSection.tsx
- components/workorder/detail/sections/OutsourcingSection.tsx
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
