Version : 0.10.51
Summary : 고객사 초기 기준정보 복사 설계
Description : 시스템관리자 기준정보 관리에 고객사 신규 생성 시 생산품 유형 기본 템플릿과 단위·외주공정 사용 연결을 초기화하는 설계 화면을 추가했습니다. 시스템 콘솔과 기준정보 설계 화면에서 /system/standards/customer-onboarding으로 진입할 수 있도록 연결하고, fallback 없이 DB 기준정보를 복사하는 정책을 문서화했습니다. 실제 고객사 생성 API, 복사 repository, DB schema, 감사 로그 흐름은 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/system/systemConsoleShell.ts
- components/system/standards/SystemStandardsDesignPage.tsx

추가 파일 목록 :
- app/system/standards/customer-onboarding/page.tsx
- components/system/standards/SystemCustomerOnboardingTemplateDesignPage.tsx
- lib/system/standards/customerOnboardingTemplateDesign.ts
- docs/system-customer-onboarding-standards-0.10.51.md

삭제 파일 목록 :
- 없음
