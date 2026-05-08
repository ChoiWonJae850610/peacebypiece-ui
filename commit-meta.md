Version :
0.9.22401

Summary :
저장소 관리 요약 초기 표시와 요금제 용량 placeholder 보정

Description :
저장소 관리 화면 새로고침 직후 삭제 요청 카드에 복원 가능 기간 30일 값이 잠깐 표시되는 초기 placeholder 불일치를 수정했다. 실제 고객 요금제 용량이 로드되기 전에는 5.0GB 하드코딩 값 대신 요금제 확인 중 상태를 표시하도록 정리했다.

수정 파일 목록 :
- components/admin/files/FileStorageSummary.tsx
- lib/admin/adminFiles.adapter.ts
- lib/constants/app.ts

추가 파일 목록 :
- docs/storage-management-summary-plan-quota-0.9.22401.md

삭제 파일 목록 :
없음
