# Version
0.7.1 → 0.7.2

# Summary
WorkOrderDetail PC View 분리

# Description
WorkOrderDetailDesktopView 내부에 직접 배치되어 있던 PC 전용 섹션 조합을 WorkOrderDetailDesktopSections로 분리하고 앱 버전을 0.7.2로 갱신함.

# 수정 파일 목록
- `components/workorder/detail/views/WorkOrderDetailDesktopView.tsx` — PC View가 레이아웃과 모달 연결에 집중하도록 섹션 조합을 전용 컴포넌트로 위임
- `lib/constants/app.ts` — APP_VERSION 값을 0.7.2로 동기화
- `commit-meta.md` — 모바일 최소 응답용 작업 메타데이터 갱신

# 추가 파일 목록
- `components/workorder/detail/views/WorkOrderDetailDesktopSections.tsx` — PC 상세 화면의 header/action/cost/order/production 섹션 조합을 담당하는 전용 컴포넌트 추가

# 삭제 파일 목록
없음

# 작업 상세 내용
- WorkOrderDetailDesktopView에서 직접 import하던 Header, Action, CostSummary, OrderInfo, ProductionComposition 섹션을 제거함.
- PC 상세 화면 섹션 배치 책임을 WorkOrderDetailDesktopSections로 분리함.
- Desktop View는 DesktopWorkspaceLayout, WorkOrderDetailDesktopSections, WorkOrderDetailSharedModals 조합만 담당하도록 축소함.
- 기능, 권한, 상태, actionFlow, selector, repository 로직은 수정하지 않음.
- package.json 및 package-lock.json은 수정하지 않음.

# 이번 작업 진행 판단
0.7.2 목표인 WorkOrderDetail PC View 분리를 최소 범위로 반영함. PC View의 섹션 조합 책임을 별도 컴포넌트로 분리했으며, 다음 단계에서 사용자/권한 테스트 구조 준비로 넘어갈 수 있음.

# 다음 작업 권장 버전
0.7.3 — 작업지시서 권한/사용자 테스트 구조 준비
