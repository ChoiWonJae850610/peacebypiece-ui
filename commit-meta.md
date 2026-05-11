Version : 0.10.49
Summary : 기준정보 DB-only 조회 안정화
Description : 기준정보 화면과 업무 선택지에서 레거시 fallback 목록이 섞이지 않도록 시스템 기준정보 fallback 상수를 빈 배열로 정리하고, 시스템/고객관리자 기준정보 화면에는 최신 조회 응답만 반영되도록 보정했습니다. 생산품 유형 기본값 복원은 시스템관리자가 기본으로 지정한 활성 템플릿만 사용하도록 고정했습니다. DB schema, 기준정보 CRUD, 감사 로그 흐름은 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/system/standards/systemUnitStandards.ts
- lib/system/standards/systemProcessStandards.ts
- lib/system/standards/systemProductTemplateStandards.ts
- lib/system/standards/unitStandardsRepository.ts
- lib/system/standards/processStandardsRepository.ts
- lib/system/standards/productTemplateRepository.ts
- components/system/standards/SystemUnitStandardsPage.tsx
- components/system/standards/SystemProcessStandardsPage.tsx
- components/system/standards/SystemProductTemplateStandardsPage.tsx
- components/admin/standards/AdminStandardsSection.tsx
- components/admin/partnerMaster/usePartnerMasterController.ts
- lib/admin/settings/standardsRepository.ts
- lib/admin/partner/actionFlow.ts
- lib/admin/partner/persistence.ts

추가 파일 목록 :
- docs/admin-standards-db-only-final-0.10.49.md

삭제 파일 목록 :
- 없음
