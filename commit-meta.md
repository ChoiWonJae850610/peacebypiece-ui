Version :
0.13.91

Summary :
고객사 상태별 API 접근 차단 응답 정리

Description :
고객사 요금제와 온보딩 상태에 따른 API 접근 차단 응답을 profile_required, approval_pending, rejected, trial_expired, past_due, canceled 기준으로 분리했다. 관리자 설정 사용자 목록 API에도 회사 접근 상태 guard를 추가해 제한 상태에서 우회 호출되지 않도록 보정했다.

수정 파일 목록 :
- lib/billing/companyApiAccessGuard.ts
- app/api/admin/settings/users/route.ts
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
