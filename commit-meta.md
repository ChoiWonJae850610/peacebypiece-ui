Version : 0.17.26
Summary : 발주 정보 단일 테이블 정리
Description : 작업지시서 PC 발주 정보에서 생산 공장과 외주공정을 별도 블록으로 나누던 구조를 하나의 발주 항목 테이블로 통합했습니다. 봉제 행은 샘플/메인/재작업과 생산 공장 정보를 사용하고, 외주 행은 등록된 외주공정과 외주처 정보를 사용하도록 표시했습니다. 납기일 컬럼은 PC 발주 정보 테이블에서 제거하고, 외주 행은 로스비 없이 공임비와 금액 중심으로 표시했습니다. 기존 orderEntries와 outsourcing 데이터 구조, DB schema, 작업지시서 PDF 양식은 변경하지 않았습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/workorder/detail/sections/OrderInfoSection.tsx
- lib/i18n/ko/workorder.ts
- lib/i18n/en/workorder.ts
추가 파일 목록 :
- docs/현재기준/0.17.26-unified-order-lines.md
삭제 파일 목록 :
- 없음
