Version :
0.13.81

Summary :
초대 링크 온보딩 세션의 관리자 홈 진입 오류 수정

Description :
초대 링크로 Google 로그인한 직후 아직 companyId가 없는 고객사 관리자 임시 세션이 /admin에 진입할 때 ADMIN_COMPANY_SESSION_REQUIRED 런타임 오류가 발생하지 않도록 보정했다. companyId가 없고 초대 토큰이 있는 경우에는 온보딩 입력 안내 화면을 렌더링하고, 초대 토큰도 없는 비정상 관리자 세션은 로그인 안내로 돌려보내도록 수정했다.

수정 파일 목록 :
- app/admin/page.tsx
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
