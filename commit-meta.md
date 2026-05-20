Version : 0.15.11
Summary : 시스템관리자 기준정보 세부 화면 A-TYPE shell 1차 적용
Description : 시스템관리자 기준정보 세부 화면 중 카테고리 규칙, 외주공정 유형, 단위 표준, 생산품 유형 기본 템플릿 화면에 SystemShell 기준 wrapper를 적용했다. 기존 URL과 기준정보 CRUD/API/DB 로직은 변경하지 않고 page-level main wrapper 중복과 일부 surface token 표현만 정리했다.

수정 파일 목록 :
- app/(system)/system/category-rules/page.tsx
- components/system/standards/SystemProcessStandardsPage.tsx
- components/system/standards/SystemProductTemplateStandardsPage.tsx
- components/system/standards/SystemUnitStandardsPage.tsx
- docs/README.md
- docs/wafl-a-type/00_wafl-a-type-doc-index.md
- docs/wafl-a-type/12_wafl-a-type-refactor-roadmap.md
- lib/constants/app.ts

추가 파일 목록 :
- docs/wafl-a-type/32_wafl-a-type-system-standards-detail-screens.md

삭제 파일 목록 :
- 없음
