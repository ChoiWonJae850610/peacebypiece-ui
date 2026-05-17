Version :
0.13.42

Summary :
멤버 권한 모달 단순화와 빌드 타입 설정 보정

Description :
멤버관리 목록에서 고객사 관리자 역할을 제외하고, 멤버 권한 모달을 작업지시서, 협력업체관리, 통계, 기준정보 중심의 업무홈 카드 선택 구조로 단순화했다. 작업지시서 작성 가능과 발주 가능, 협력업체 및 기준정보 작성 가능을 큰 권한 단위로 조정하도록 변경했다. Next.js dev 타입 산출물이 production build 타입 검사에 포함되지 않도록 tsconfig 설정도 보정했다.

수정 파일 목록 :
- components/admin/members/AdminMemberManagementDashboard.tsx
- lib/admin/members/memberRepository.ts
- lib/constants/app.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- tsconfig.json

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
