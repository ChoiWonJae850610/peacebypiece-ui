Version :
0.14.6

Summary :
고객사 관리자 권한 API guard 기준 보정

Description :
기준정보 API가 request header preview 권한 대신 실제 로그인 세션의 고객사 멤버 권한을 확인하도록 수정했다. 기준정보 작성성 작업은 standards.manage 권한으로 통일하고, 협력업체 화면의 외주공정 저장도 같은 권한 기준을 사용하도록 보정했다. 통계 카드는 멤버 권한 체크 없이 기본 조회 카드로 노출되도록 정리했다.

수정 파일 목록 :
- app/api/admin/standards/route.ts
- app/api/admin/standards/processes/route.ts
- app/api/admin/partners/route.ts
- lib/admin/settings/sessionScope.ts
- lib/admin/adminWorkspaceCards.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
