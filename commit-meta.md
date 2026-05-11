Version : 0.10.46
Summary : 기준정보 DB 전용 조회와 기본 템플릿 복원 보정
Description : 기준정보 화면과 업무 선택지에서 fallback 데이터가 섞여 새로고침마다 수량이 흔들리던 문제를 보정했습니다. 시스템관리자 단위 표준, 외주공정 유형, 생산품 유형 템플릿 화면은 DB 결과만 표시하도록 초기 fallback 상태를 제거했습니다. 고객관리자 생산품 유형 기본값 복원은 시스템관리자 기본 템플릿을 기준으로 동작하도록 변경하고, 단위/외주공정 사용 여부와 작업지시서 선택지도 DB 기준만 사용하도록 정리했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/admin/settings/standardsTypes.ts
- lib/admin/settings/standardsRepository.ts
- lib/admin/settings/useCompanyStandardOptions.ts
- app/api/admin/standards/route.ts
- app/api/admin/partners/route.ts
- components/admin/standards/AdminStandardsSection.tsx
- components/admin/standards/AdminItemCategoryManagementModal.tsx
- lib/system/standards/unitStandardsRepository.ts
- lib/system/standards/processStandardsRepository.ts
- lib/system/standards/productTemplateRepository.ts
- components/system/standards/SystemUnitStandardsPage.tsx
- components/system/standards/SystemProcessStandardsPage.tsx
- components/system/standards/SystemProductTemplateStandardsPage.tsx
추가 파일 목록 :
- docs/admin-standards-db-only-0.10.46.md
삭제 파일 목록 :
- 없음
