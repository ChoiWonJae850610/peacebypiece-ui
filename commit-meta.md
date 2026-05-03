Version :
0.9.118

Summary :
관리자 대시보드 hook 사용 컴포넌트의 client boundary 명시

Description :
관리자 대시보드의 완료 검증 패널과 DB 연결 점검 패널이 useAdminTranslation hook을 사용하므로 client component boundary를 명시했다. route 복구 과정에서 발생할 수 있는 i18n/provider hook 경계 문제를 줄였고, 기존 API/repository, DB schema, package 설정은 변경하지 않았다.

수정 파일 목록 :
- components/admin/dashboard/AdminCompletionAuditPanel.tsx
- components/admin/dashboard/AdminDbConnectionAuditPanel.tsx
- lib/constants/app.ts

추가 파일 목록 :
없음

삭제 파일 목록 :
없음
