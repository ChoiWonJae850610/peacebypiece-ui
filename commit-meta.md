Version : 0.10.43
Summary : 고객관리자 기준정보 사용 여부 DB 연결
Description : 고객관리자 환경설정의 단위 표준과 외주공정 유형을 시스템 표준 원장 기반 사용/미사용 선택형 기준정보로 DB 연결했습니다. 단위 표준은 company_enabled_unit_standards, 외주공정 유형은 company_enabled_process_standards에 고객사별 사용 여부를 저장합니다. 생산품 유형은 기존 고객사별 계층 관리 구조를 유지하고, 생산품 유형 템플릿 화면의 nullable records 타입 빌드 오류를 함께 수정했습니다.

수정 파일 목록 :
- lib/constants/app.ts
- components/system/standards/SystemProductTemplateStandardsPage.tsx
- lib/admin/settings/standardsRepository.ts
- lib/partners/dbPartnerRepository.ts
- components/admin/standards/AdminUnitManagementModal.tsx
- components/admin/standards/AdminStandardsSection.tsx

추가 파일 목록 :
- docs/admin-company-standards-db-0.10.43.md

삭제 파일 목록 :
- 없음
