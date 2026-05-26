Version : 0.16.91
Summary : 원단·부자재 업무 route shell 추가
Description : 업무홈 카드 순서를 작업지시서, 원단·부자재, 협력업체관리, 통계정보, 기준정보, 저장소관리, 환경설정, 멤버관리 순서로 정리하고 원단·부자재 발주 업무 route shell과 skeleton 화면을 추가했습니다. 발주 요청 목록, 발주 작성/상세, 재고 현황 탭의 표시 구조와 상태 흐름/자재 전달 요청서 확장 방향을 viewModel 기반으로 분리했습니다. DB schema, API 저장 로직, package 파일은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/admin/adminWorkspaceCards.ts
- lib/navigation/workspaceNavigation.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
추가 파일 목록 :
- app/(workspace)/workspace/material-orders/page.tsx
- features/material-orders/MaterialOrderWorkspacePage.tsx
- lib/material-orders/materialOrderWorkspaceViewModel.ts
삭제 파일 목록 :
- 없음
