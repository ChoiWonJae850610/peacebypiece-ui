Version :
0.9.216

Summary :
고객사 관리자 UI 정책 정리

Description :
고객사 관리자 환경설정 화면에서 삭제방식, 기본 용량 한도, 휴지통 용량 포함 여부, 용량 주의 기준, 개발중 기능 상태를 확인할 수 있도록 정책 영역을 추가했다. 정책 표시 데이터는 presentation 파일로 분리하고, 실제 권한 저장 UI나 API 차단은 후속 버전으로 유지한다. DB schema, full_reset.sql, package 의존성은 변경하지 않는다.

수정 파일 목록 :
- app/admin/settings/page.tsx
- lib/constants/app.ts

추가 파일 목록 :
- components/admin/settings/AdminPolicyOverview.tsx
- lib/admin/settings/adminPolicyPresentation.ts
- docs/admin-company-policy-ui-0.9.216.md

삭제 파일 목록 :
없음
