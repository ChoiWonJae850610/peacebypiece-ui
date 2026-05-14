Version :
0.12.16

Summary :
시스템관리자 화면 semantic class 후보 정리

Description :
시스템관리자 홈, 저장소 실제 삭제 후보, 고객사 승인, 분류 규칙 화면의 주요 surface, header, card, table, text tone을 theme variable 기반 semantic class로 정리했다. 공통 시스템 semantic class 파일을 추가해 system 화면의 theme 적용 후보를 묶고, 기존 DB/R2/첨부/휴지통/purge 로직은 변경하지 않았다.

수정 파일 목록 :
- lib/constants/app.ts
- app/system/storage-usage/page.tsx
- app/system/category-rules/page.tsx
- components/system/SystemConsoleShell.tsx
- components/system/SystemStatsOverview.tsx
- components/system/storage/SystemStoragePurgeCandidatesClient.tsx
- components/system/companies/SystemCompanyApprovalConsole.tsx
- components/system/category-rules/CategoryRuleEditorPanel.tsx
- components/system/category-rules/CategoryRuleListPanel.tsx
- components/system/category-rules/CategoryRulePanelShared.tsx

추가 파일 목록 :
- components/system/systemSemanticClassNames.ts

삭제 파일 목록 :
없음
