Version :
0.9.135

Summary :
관리자 거래처 저장 중복 요청 방지와 안정화 기준 추가

Description :
관리자 거래처/공장관리 화면에서 생성/수정 저장 중 저장 버튼과 닫기 동작을 비활성화해 중복 POST/PATCH 요청이 발생하지 않도록 보완했다. 기존 거래처 목록, 필터, 생성/수정 모달 구조는 유지했고, 관리자 거래처 기능 안정화 테스트 기준 문서를 추가했다.

수정 파일 목록 :
- components/admin/PartnerMasterSection.tsx
- components/admin/partnerMaster/PartnerMasterFormModal.tsx
- components/admin/partnerMaster/usePartnerMasterController.ts
- lib/constants/app.ts
- docs/restore-baseline-0.9.121.md

추가 파일 목록 :
- docs/admin-partner-master-stability-0.9.135.md

삭제 파일 목록 :
없음
