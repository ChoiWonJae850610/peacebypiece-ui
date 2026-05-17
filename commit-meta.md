Version :
0.13.37

Summary :
멤버관리 로우 클릭 상세 모달과 멤버 정보 수정 API 추가

Description :
멤버관리 테이블에서 승인 완료 멤버 로우를 클릭하면 상세 관리 모달을 열어 이름, 연락처, 상태, 역할과 권한을 수정할 수 있도록 추가했다. 액션 컬럼은 승인 대기 신청의 승인/거절 버튼만 표시하고 일반 멤버 로우는 비워두도록 정리했다. 멤버 수정 API와 repository를 세션 companyId 기준으로 보강하고 자기 자신의 권한 제거 및 마지막 관리자 권한 제거를 방지했다.

수정 파일 목록 :
- components/admin/members/AdminMemberManagementDashboard.tsx
- lib/admin/members/memberRepository.ts
- lib/admin/members/memberRouteHandlers.ts
- lib/admin/members/memberTypes.ts
- lib/constants/app.ts

추가 파일 목록 :
- app/api/admin/members/[memberId]/route.ts

삭제 파일 목록 :
없음
