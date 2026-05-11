Version : 0.10.21
Summary : 저장소 관리 현황 카드 축소와 새로고침 피드백 추가
Description : 저장소 관리 화면의 외부 현황 카드 제목/설명과 새로고침 아이콘을 제거하고, 현황 카드 3개를 상단에 직접 배치했습니다. 새로고침은 휴지통 액션 라인의 한글 버튼으로 이동하고 하단 중앙 토스트 메시지로 진행/완료 상태를 표시합니다. 휴지통 목록 내부 스크롤 구조는 유지하면서 표시 공간을 확대했습니다.

수정 파일 목록 :
- lib/constants/app.ts
- app/admin/files/page.tsx
- components/admin/files/FileStorageSummary.tsx
- components/admin/files/FileTrashSection.tsx

추가 파일 목록 :
- docs/admin-files-summary-flatten-refresh-0.10.21.md

삭제 파일 목록 :
- 없음
