# Version
0.7.0 → 0.7.1

# Summary
WorkOrderDetail 구조 분해 준비

# Description
WorkOrderDetailContainer 안에 직접 있던 디바이스별 View 선택 분기를 전용 ViewSwitch 컴포넌트로 분리하고 앱 버전을 0.7.1로 갱신함.

# 수정 파일 목록
- `components/workorder/detail/WorkOrderDetailContainer.tsx` — 디바이스별 View 선택 로직을 전용 컴포넌트 호출로 위임해 Container 책임을 축소
- `lib/constants/app.ts` — APP_VERSION 값을 0.7.1로 동기화
- `commit-meta.md` — 모바일 최소 응답용 작업 메타데이터 갱신

# 추가 파일 목록
- `components/workorder/detail/views/WorkOrderDetailViewSwitch.tsx` — mobile/tablet/desktop View 선택을 담당하는 전용 컴포넌트 추가

# 삭제 파일 목록
없음

# 작업 상세 내용
- WorkOrderDetailContainer가 editor 생성과 viewModel 조립에 집중하도록 디바이스 View 분기 코드를 분리함.
- WorkOrderDetailViewSwitch에서 mobile/tablet/desktop View 선택을 단일 책임으로 처리하게 함.
- 기존 WorkOrderDetailMobileView, WorkOrderDetailTabletView, WorkOrderDetailDesktopView props 구조는 변경하지 않음.
- 기능, 권한, 상태, actionFlow, selector, repository 로직은 수정하지 않음.
- package.json 및 package-lock.json은 수정하지 않음.

# 이번 작업 진행 판단
0.7.1 목표인 WorkOrderDetail 구조 분해 준비를 최소 범위로 반영함. 다음 단계에서 PC View 분리를 진행할 수 있도록 Container의 View 선택 책임을 별도 컴포넌트로 이동함.

# 다음 작업 권장 버전
0.7.2 — WorkOrderDetail PC View 분리
