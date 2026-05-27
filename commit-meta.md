Version : 0.17.27
Summary : 발주 정보 테이블 폭과 빈 상태 높이 보정
Description : 발주 정보 단일 테이블에서 수량/공임비/로스비/금액 컬럼 표시 폭을 줄이고 긴 값은 말줄임 처리되도록 정리했습니다. 우측 삭제 버튼이 기본 화면에서 보이도록 테이블 최소폭과 컬럼 비율을 보정하고, 발주 정보와 생산 구성 하단의 헬프 메시지를 제거했습니다. 필요 원단/부자재 빈 상태 높이를 일반 행 수준으로 낮췄습니다. DB schema와 작업지시서 PDF 양식은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/detail/sections/OrderInfoSection.tsx
- components/workorder/detail/sections/MaterialSection.tsx
추가 파일 목록 :
- docs/현재기준/0.17.27-order-table-compact-overflow.md
삭제 파일 목록 :
없음
