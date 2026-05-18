Version :
0.13.80

Summary :
고객사 관리자 작업지시서 조회 범위와 초대 링크 없는 온보딩 진입 흐름 보정

Description :
고객사 관리자가 작업지시서 화면에서 현재 세션 사용자를 관리자 역할로 인식하도록 보정해 같은 고객사의 멤버가 만든 작업지시서를 볼 수 있게 수정했다. 고객사 관리자 초대 링크는 Google 로그인 시점에 DB 회사와 사용자 계정을 생성하지 않고 임시 세션만 만든 뒤, 온보딩 승인 요청 제출 시점에 회사와 관리자 계정을 생성하도록 보정했다.

수정 파일 목록 :
- app/api/admin/companies/onboarding/route.ts
- lib/auth/companyInvitationLoginRepository.ts
- lib/auth/session.ts
- lib/repositories/dbWorkorderHttpAdapter.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
