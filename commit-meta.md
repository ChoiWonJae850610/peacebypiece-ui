Version :
0.13.38

Summary :
멤버 상세 모달 권한 표시와 저장 SQL 오류 수정

Description :
멤버 상세 관리 모달의 권한 목록을 코드 노출 방식에서 화면/업무 단위 그룹 표시로 정리하고 권한 라벨과 설명을 i18n 문구로 연결했다. 멤버 정보 저장 시 PostgreSQL 파라미터 타입을 명시해 nullable 연락처 저장 오류를 보완하고 중복 선언으로 이어질 수 있는 권한 수정 함수 선언도 정리했다.

수정 파일 목록 :
- components/admin/members/AdminMemberManagementDashboard.tsx
- lib/admin/members/memberManagementPresentation.ts
- lib/admin/members/memberRepository.ts
- lib/constants/app.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
