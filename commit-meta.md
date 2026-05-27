Version : 0.17.21
Summary : 작업지시서 PC 카드 헤더 평탄화
Description : 작업지시서 상세 PC 화면에서 발주 정보와 생산 구성 카드 내부의 중복 접힘 헤더를 제거했습니다. 발주 정보와 생산 구성은 항상 펼쳐진 형태로 표시하고, 발주 상태 배지는 테이블 위의 얇은 상태 줄로 유지했습니다. 필요 원단/부자재와 외주공정은 0.17.20의 좌우 2컬럼 구조를 유지하며 개별 영역 제목은 단순 제목/요약 형태로 정리했습니다. 작업지시서 PDF 양식과 DB schema는 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/detail/sections/OrderInfoSection.tsx
- components/workorder/detail/sections/ProductionCompositionSection.tsx
- components/workorder/detail/sections/MaterialSection.tsx
- components/workorder/detail/sections/OutsourcingSection.tsx
추가 파일 목록 :
- docs/현재기준/0.17.21-workorder-card-header-flattening.md
삭제 파일 목록 :
- 없음
