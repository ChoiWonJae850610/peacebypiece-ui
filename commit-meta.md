Version : 0.10.18
Summary : 협력업체 관리 고정형 목록 스크롤 보정
Description : 고객관리자 협력업체 관리 화면에서 안내 문구를 + 업체추가 버튼 왼쪽에 일반 텍스트로 배치하고, PC 기준으로 업체 목록만 내부 스크롤되도록 높이 구조를 보정했습니다. 작업지시서 복원 감사 로그 작성 시 nullable workOrderId로 발생하던 TypeScript 빌드 오류도 함께 수정했습니다.

수정 파일 목록 :
- lib/constants/app.ts
- app/api/admin/files/workorders/restore/route.ts
- components/admin/PartnerMasterSection.tsx
- components/admin/partnerMaster/PartnerMasterHeader.tsx
- components/admin/partnerMaster/PartnerMasterList.tsx

추가 파일 목록 :
- docs/admin-partners-fixed-list-0.10.18.md

삭제 파일 목록 :
- 없음
