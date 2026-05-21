Version :
0.15.33

Summary :
빌드 오류 수정과 DB 저장값 JSON payload 감사

Description :
시스템 고객사 승인 화면에서 PDF 파일 판정 helper import가 누락되어 발생한 빌드 타입 오류를 수정했다. DB 저장값, JSON payload, metadata, raw token, reason/status 저장 후보를 감사하고 후속 정리 우선순위를 문서화했다.

수정 파일 목록 :
- components/system/companies/SystemCompanyApprovalConsole.tsx
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts

추가 파일 목록 :
- docs/wafl-a-type/56_wafl-a-type-db-payload-storage-audit.md

삭제 파일 목록 :
없음
