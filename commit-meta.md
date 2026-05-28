Version : 0.17.60
Summary : 작업지시서 상세 섹션 그룹 공통 분리와 생산구성 prop 정리
Description : 작업지시서 상세 PC 화면의 섹션 그룹 UI를 공통 컴포넌트로 분리하고, 생산구성 원단/부자재 테이블에 남아 있던 미사용 vendor prop 전달을 정리했습니다. APP_VERSION을 0.17.60으로 갱신했으며 누적 테스트 항목은 pending-tests.md에만 유지했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/detail/views/WorkOrderDetailDesktopSections.tsx
- components/workorder/detail/sections/ProductionCompositionSection.tsx
- components/workorder/detail/sections/MaterialSection.tsx
- pending-tests.md
추가 파일 목록 :
- components/workorder/detail/shared/DetailSectionGroup.tsx
삭제 파일 목록 :
- 없음
