Version :
0.15.73.2

Summary :
작업지시서 생성 버튼 권한 hydration 보정

Description :
작업지시서 화면에서 현재 세션 멤버의 권한 체크값이 사용자 목록과 정확히 합쳐지지 않아 작업지시서 생성 버튼이 숨겨질 수 있는 문제를 보정했다. /api/auth/me가 현재 멤버 권한 코드를 함께 반환하고, 작업지시서 클라이언트 repository가 세션 권한과 companyMemberId를 현재 사용자 프로필에 병합하도록 수정했다.

수정 파일 목록 :
- app/api/auth/me/route.ts
- lib/auth/currentUser.ts
- lib/admin/settings/userAccessRepository.ts
- lib/constants/app.ts
- lib/repositories/dbWorkorderHttpAdapter.ts
- types/user.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
