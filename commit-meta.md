Version : 0.13.20
Summary : 승인 실패 처리와 진행단계 카드 처리중 메시지 정리
Description : 멤버 가입 신청 승인 SQL의 null 파라미터 타입 추론 오류를 보정하고, 승인/거절 실패 상세 메시지를 화면 내부 빨간 박스 대신 하단 toast와 로그로 분리했습니다. 작업지시서 진행단계 카드 내부의 처리중 안내 메시지 노출을 제거해 하단 toast 중심 메시지 흐름과 맞췄습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/admin/members/AdminMemberManagementDashboard.tsx
- lib/invitations/joinRequestRepository.ts
- lib/i18n/ko/admin.ts
- lib/i18n/en/admin.ts
- components/workorder/detail/WorkOrderActionSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailTabletActionSection.tsx
- components/workorder/detail/sections/device/WorkOrderDetailMobileActionSection.tsx
추가 파일 목록 :
- 없음
삭제 파일 목록 :
- 없음
