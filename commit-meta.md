Version : 0.13.26
Summary : admin 뒤로가기 복귀 후 개인 설정 모달 클릭 안정화
Description : /admin 운영관리 카드 이동을 Next Link 기반으로 정리하고, bfcache 복귀 시 AdminTopbar 액션 그룹을 안전하게 재생성하도록 보정했습니다. current user refresh 실패 시 기존 사용자 상태를 유지해 뒤로가기 복귀 중 개인 설정 버튼과 상단 액션이 끊기지 않도록 정리했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/auth/CurrentUserProvider.tsx
- components/admin/layout/AdminTopbar.tsx
- components/admin/dashboard/AdminConsoleSections.tsx
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
