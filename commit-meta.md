Version : 0.10.47
Summary : 기준정보 seed 상태 점검과 빈 상태 안내 보정
Description : 시스템 기준정보가 DB 결과만 사용하도록 전환된 이후 seed 적용 상태를 확인할 수 있는 시스템관리자 점검 화면과 API를 추가했습니다. 고객관리자 환경설정 기준관리 카드와 단위 표준 모달에는 DB 항목이 없을 때 fallback 숫자 대신 빈 상태 안내가 보이도록 보정했습니다. 기준정보 fallback 혼입 제거 원칙은 유지하고 DB schema와 업무 저장 로직은 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- lib/system/systemConsoleShell.ts
- components/system/standards/SystemStandardsDesignPage.tsx
- components/admin/standards/AdminStandardsSection.tsx
- components/admin/standards/AdminUnitManagementModal.tsx

추가 파일 목록 :
- app/api/system/standards/seed-status/route.ts
- app/system/standards/seed-status/page.tsx
- components/system/standards/SystemStandardsSeedStatusPage.tsx
- lib/system/standards/seedStatusRepository.ts
- docs/admin-standards-seed-status-0.10.47.md

삭제 파일 목록 :
- 없음
