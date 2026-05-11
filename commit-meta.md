Version : 0.10.37
Summary : 시스템관리자 생산품 유형 기본 템플릿 1차 화면 추가
Description : 시스템관리자 기준정보 관리 흐름에 생산품 유형 기본 템플릿 1차 화면을 추가했습니다. /system/standards/product-templates 경로를 만들고 1차-2차-3차 계층 템플릿 미리보기와 정책 안내를 배치했습니다. 실제 CRUD, DB schema, 고객사 생성 시 복사 로직, 고객관리자 기준정보 저장 로직, 감사 로그 흐름은 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/system/systemConsoleShell.ts
- components/system/standards/SystemStandardsDesignPage.tsx

추가 파일 목록 :
- app/system/standards/product-templates/page.tsx
- components/system/standards/SystemProductTemplateStandardsPage.tsx
- lib/system/standards/systemProductTemplateStandards.ts
- docs/system-product-template-standards-0.10.37.md

삭제 파일 목록 :
- 없음
