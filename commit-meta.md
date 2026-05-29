Version : 0.18.14
Summary : 기준정보 화면 toast 피드백 분리
Description : ToastMessage에 eventKey를 추가하고 원단·부자재 기준정보 화면의 성공/권한 피드백을 Sonner toast로 분리했습니다. API 실패 메시지는 inline message와 danger toast로 함께 유지했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- components/common/ToastMessage.tsx
- features/materials/MaterialsWorkspacePage.tsx
추가 파일 목록 :
- docs/ui-toast-message-0.18.14.md
삭제 파일 목록 :
