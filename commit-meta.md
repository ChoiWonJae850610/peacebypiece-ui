Version :
0.11.8

Summary :
시스템관리자 요금제와 저장소 화면 공통 UI 적용

Description :
시스템관리자 요금제·용량 관리 화면과 저장소 실제 삭제 후보 화면의 버튼, 링크, 상태 라벨, empty state를 관리자 공통 UI 컴포넌트 기준으로 전환했다. 저장소 purge API와 R2 삭제 처리 흐름은 변경하지 않았다.

수정 파일 목록 :
- components/system/billing/SystemCompanyPlanSkeleton.tsx
- app/system/storage-usage/page.tsx
- components/system/storage/SystemStoragePurgeCandidatesClient.tsx
- components/system/storage/SystemStoragePurgeButton.tsx
- lib/constants/app.ts

추가 파일 목록 :
- docs/system-billing-storage-ui-standardization-0.11.8.md

삭제 파일 목록 :
없음
