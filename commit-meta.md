Version : 0.16.16
Summary : 원단·부자재 UI 목업 구조 생성
Description : /workspace/materials 화면과 features/materials 목업 구조를 추가하고 workspace navigation 및 대시보드 진입 카드를 연결했습니다. 임시 데이터는 features/materials/__fixtures__에만 격리했으며 실제 DB/API 연결, 작업지시서 상태 연결, 발주 상태 연결은 포함하지 않았습니다.
수정 파일 목록 :
- components/admin/layout/AdminSidebar.tsx
- lib/admin/adminDashboard.presentation.ts
- lib/constants/app.ts
- lib/navigation/workspaceNavigation.ts
추가 파일 목록 :
- app/(workspace)/workspace/materials/page.tsx
- features/materials/MaterialsWorkspacePage.tsx
- features/materials/__fixtures__/materialsMock.ts
삭제 파일 목록 :
- 없음
