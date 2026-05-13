Version :
0.11.22

Summary :
관리자 점검 패널 라벨 공통 UI 적용

Description :
관리자 완료 검증 패널과 데이터 연결 점검 패널의 직접 스타일 상태 라벨을 AdminStatusBadge 기준으로 전환했습니다. 완료/점검/차단, repository mode, 데이터 연결 상태, source type 라벨을 공통 tone 기준으로 정리했으며 검증 계산 로직과 DB/API 로직은 변경하지 않았습니다.

수정 파일 목록 :
components/admin/dashboard/AdminCompletionAuditPanel.tsx
components/admin/dashboard/AdminDbConnectionAuditPanel.tsx
lib/constants/app.ts

추가 파일 목록 :
docs/admin-audit-panels-badge-standardization-0.11.22.md

삭제 파일 목록 :
없음
