Version : 0.17.20
Summary : PC 생산 구성 2컬럼 레이아웃 정리
Description : 작업지시서 상세의 생산 구성 영역에서 필요 원단/부자재와 외주공정을 PC 기준 좌우 2컬럼으로 배치했습니다. PC에서는 각 섹션에 최대 높이와 내부 스크롤을 적용해 중앙 패널 높이가 과도하게 길어지지 않도록 정리했고, 태블릿/모바일 전용 섹션은 기존 세로 흐름을 유지했습니다. 작업지시서 PDF 양식과 DB schema는 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/detail/sections/ProductionCompositionSection.tsx
- components/workorder/detail/sections/MaterialSection.tsx
- components/workorder/detail/sections/OutsourcingSection.tsx
추가 파일 목록 :
- docs/현재기준/0.17.20-pc-production-composition-two-column.md
삭제 파일 목록 :
- 없음
