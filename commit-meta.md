Version : 0.10.20
Summary : 저장소 관리 내부 스크롤 구조 보정
Description : 고객관리자 저장소 관리 화면에 PC 기준 고정형 콘텐츠 모드를 적용하고, 저장소 사용 현황 카드의 높이와 여백을 줄였습니다. 휴지통 영역은 남은 화면 높이를 차지하도록 조정해 휴지통 목록만 내부 스크롤되도록 보정했습니다. 저장소 snapshot, 휴지통 복원/삭제/비우기, R2 purge, 감사 로그, DB schema는 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- app/admin/files/page.tsx
- components/admin/files/FileStorageSummary.tsx
- components/admin/files/FileTrashSection.tsx

추가 파일 목록 :
- docs/admin-files-internal-scroll-0.10.20.md

삭제 파일 목록 :
- 없음
