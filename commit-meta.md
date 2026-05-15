Version : 0.13.2
Summary : 고객사 멤버관리 초대 탭 레이아웃과 입력 포맷 정리
Description : /admin/members 멤버관리 화면의 상단 탭 구조를 통계정보 화면과 같은 콘텐츠 카드 우측 탭 방식으로 정리하고, 초대 탭에서 휴대폰 번호 입력 포맷을 공통 phone formatter 기준으로 맞췄습니다. 초대 생성/링크 복사/초대 취소 피드백 메시지를 추가하고, 초대 대기 목록 카드의 헤더 높이와 내부 테이블 고정 스크롤 구조를 보정했습니다. 실제 SMS/email 발송 API와 invitation token 검증 로직, DB schema는 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/members/AdminMemberManagementDashboard.tsx
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
