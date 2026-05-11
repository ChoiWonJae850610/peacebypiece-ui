Version : 0.10.41
Summary : 시스템관리자 생산품 유형 기본 템플릿 CRUD 1차 연결
Description : 시스템관리자 생산품 유형 기본 템플릿 화면에서 system_product_type_templates와 system_product_type_template_categories를 조회, 추가, 수정하고 분류 사용 상태를 변경할 수 있도록 1차 CRUD API와 화면을 연결했습니다. 템플릿과 분류 변경은 감사 로그에 standard.product_template_* 이벤트로 기록됩니다. 신규 고객사 생성 시 템플릿 복사 로직, 고객관리자 생산품 유형 화면 연결, DB schema는 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/system/standards/systemProductTemplateStandards.ts
- components/system/standards/SystemProductTemplateStandardsPage.tsx

추가 파일 목록 :
- app/api/system/standards/product-templates/route.ts
- lib/system/standards/productTemplateRepository.ts
- lib/system/standards/api/productTemplateRouteHandlers.ts
- docs/system-product-template-crud-0.10.41.md

삭제 파일 목록 :
- 없음
