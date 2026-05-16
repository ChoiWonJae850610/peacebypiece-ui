Version : 0.13.4
Summary : 멤버 초대 탭 2컬럼 높이와 대기목록 스크롤 정리
Description : 고객사 멤버관리 초대 탭의 직원 초대 생성 카드와 초대 대기 목록 카드를 공통 패널 섹션 구조로 맞추고, 카드 header 높이와 content flex 구조를 통일했습니다. 초대 대기 목록 테이블은 카드 내부 고정 영역을 채우며 row 증가 시 테이블 내부에서만 스크롤되도록 보정했습니다. 실제 초대 발송, invitation token 검증, DB schema는 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/members/AdminMemberManagementDashboard.tsx
추가 파일 목록 :
- components/admin/common/AdminPanelSection.tsx
삭제 파일 목록 :
- 없음
