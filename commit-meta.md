Version :
0.13.72

Summary :
고객사 접근 제한 API guard 보강

Description :
고객사 상태가 승인 대기, 거절, 무료체험 만료, 결제 문제 상태일 때 주요 고객사 업무 API가 우회 호출되지 않도록 공통 API 접근 제한 guard를 추가했다. 작업지시서, 첨부, 메모, 업체, 저장소, 통계, 멤버, 설정 범위의 회사 세션 스코프에 접근 제한 응답을 연결하고, 요금제/프로필 확인에 필요한 회사 정보 API와 온보딩 API는 필요한 예외 범위만 허용하도록 분리했다.

수정 파일 목록 :
- app/api/admin/companies/route.ts
- app/api/admin/companies/current/route.ts
- app/api/admin/companies/onboarding/route.ts
- app/api/admin/companies/onboarding/files/delete/route.ts
- app/api/admin/companies/onboarding/files/upload/route.ts
- app/api/workorders/attachments/primary/route.ts
- app/api/workorders/memos/route.ts
- lib/admin/files/sessionScope.ts
- lib/admin/members/sessionScope.ts
- lib/admin/settings/sessionScope.ts
- lib/admin/stats/sessionScope.ts
- lib/constants/app.ts
- lib/partners/sessionScope.ts
- lib/storage/r2/r2Keys.ts
- lib/workorder/api/workOrderRouteHandlers.ts
- lib/workorder/attachments/attachmentFileRoute.ts

추가 파일 목록 :
- lib/billing/companyApiAccessGuard.ts

삭제 파일 목록 :
없음
