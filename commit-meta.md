Version :
0.11.64

Summary :
멤버관리 화면을 요약 카드와 탭 구조로 재구성

Description :
멤버관리 화면의 중복 타이틀 카드와 조직 설정 보기 버튼을 제거하고, 전체 멤버·초대 대기·승인 대기·권한 템플릿 요약 카드를 상단으로 이동했다. 멤버 초대, 승인, 전체 멤버, 권한 관리 탭을 추가해 긴 스크롤 구조를 줄이고 각 업무 영역을 분리했다. 기존 초대 생성, 가입 신청 승인/거절, 멤버 권한 저장 API 흐름은 변경하지 않았다.

수정 파일 목록 :
- components/admin/members/AdminMemberManagementDashboard.tsx
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/qa-admin-member-ia-tabs-0.11.64.md

삭제 파일 목록 :
없음
