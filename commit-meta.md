Version : 0.9.2229
Summary : 통계 기간 초기화와 저장소 관리 화면 구조 정리
Description : 통계정보 직접 기간 선택에 초기화 버튼을 추가하고, 저장소 관리 화면의 기간 버튼을 제거해 새로고침 중심으로 정리했다. 저장소 상단은 사용량 요약, 파일 상태 요약, 파일 유형 비율 구조로 재배치하고, 휴지통 목록은 복구정책 컬럼과 row 내 작업 버튼을 제거한 뒤 row 클릭 상세 모달에서 복구/영구삭제를 처리하도록 변경했다.
수정 파일 목록 :
components/admin/dashboard/AdminStatsDashboard.tsx
components/admin/files/FileStorageSummary.tsx
components/admin/files/FileTrashSection.tsx
app/admin/files/page.tsx
lib/constants/app.ts
추가 파일 목록 :
docs/storage-files-layout-0.9.2229.md
삭제 파일 목록 :
없음
