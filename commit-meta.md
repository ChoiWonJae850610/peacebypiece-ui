Version : 0.10.45
Summary : 기준정보 fallback 혼입 제거와 생산품 유형 저장 보정
Description : 고객관리자 환경설정의 기준정보 수량이 fallback 데이터와 DB 데이터 사이에서 흔들리지 않도록 DB 모드 빈 결과를 그대로 표시하도록 정리했습니다. 생산품 유형 기본값 복원 후 저장 시 기존 고객사 item_categories를 먼저 교체하고 1차-2차-3차 순서로 다시 저장하도록 보정했습니다. 작업지시서 단위/단가 기준 선택지는 DB 모드에서 고객사 사용 단위가 없으면 빈 선택지로 유지하고, 외주공정 유형도 DB 모드에서 fallback 혼입을 줄였습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/admin/settings/standardsRepository.ts
- components/admin/standards/AdminStandardsSection.tsx
- app/api/admin/partners/route.ts
- lib/admin/settings/useCompanyStandardOptions.ts
추가 파일 목록 :
- docs/admin-standards-fallback-save-0.10.45.md
삭제 파일 목록 :
- 없음
