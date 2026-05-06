Version :
0.9.2218

Summary :
협력업체 관리 요약 카드 추가

Description :
협력업체 관리 화면 상단에 전체 업체, 사용중 업체, 공장, 원단/부자재, 외주 업체 수와 업체 유형 분포를 확인할 수 있는 요약 영역을 추가했다. 통계 화면과 협력업체 화면의 역할을 분리하기 위해 협력업체 등록 현황은 /admin/partners에서 확인하고, 통계 화면은 생산/리오더/성과 분석 중심으로 유지한다. DB schema, API route, package 의존성은 변경하지 않는다.

수정 파일 목록 :
- components/admin/PartnerMasterSection.tsx
- lib/admin/partner/filters.ts
- lib/admin/partner/types.ts
- lib/constants/app.ts

추가 파일 목록 :
- components/admin/partnerMaster/PartnerMasterSummaryCards.tsx
- docs/partner-master-summary-0.9.2218.md

삭제 파일 목록 :
없음
