Base Version : 0.9.52
Target Version : 0.9.53
Version : 0.9.53
Summary : 거래처/공장관리 화면 컨트롤러 분리
Description : PartnerMasterSection의 데이터 조회, 필터, 모달, draft, 저장 처리 상태를 usePartnerMasterController 훅으로 분리하고 화면 컴포넌트는 렌더링 조립 중심으로 축소했습니다. 기존 Partner API 호출 및 DB 저장 흐름은 변경하지 않았습니다.
수정 파일 목록 :
- components/admin/PartnerMasterSection.tsx
- lib/constants/app.ts
추가 파일 목록 :
- components/admin/partnerMaster/usePartnerMasterController.ts
삭제 파일 목록 :
- 없음
