Version :
0.13.84

Summary :
가입대기 거절 접근불가 안내 화면 보정

Description :
회사 접근 상태 판정에 profile_required와 approval_pending 상태를 포함해 일반 멤버 업무 화면 접근을 서비스 대기 화면으로 차단하고, 서비스 대기 화면을 상태별 안내 모델과 i18n 문구로 정리했다. 고객사 관리자 온보딩 모달 흐름은 유지하면서 거절, 승인대기, 회사정보 필요, 요금제 제한 상태를 구분해 표시하도록 보정했다.

수정 파일 목록 :
- lib/billing/companyAccessRepository.ts
- lib/auth/routeGuard.ts
- app/service-paused/page.tsx
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- lib/constants/app.ts

추가 파일 목록 :
- lib/billing/companyAccessPresentation.ts

삭제 파일 목록 :
없음
