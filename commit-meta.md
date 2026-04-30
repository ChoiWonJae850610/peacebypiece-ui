Version: 0.9.10

Summary: 관리자 UI 1차 정리 반영

Description:
- 협력업체 관리 헤더에 운영 안내 문구를 노출하고 외주공정관리 버튼을 숨겼습니다.
- 협력업체 검색/유형/사용상태 필터 간격을 정리했습니다.
- 업체명, 담당자, 연락처, 이메일, 외주공정 표시 영역에 말줄임 처리를 강화했습니다.
- 저장소 관리 요약 영역의 그래프 영역을 확대하고 목록/휴지통 영역 높이를 고정했습니다.
- 저장소 보관 기간 문구를 복구 기간에서 보관 기간으로 정리했습니다.
- 히스토리 목록 영역 높이를 고정하고 중복 카운트 뱃지를 제거했습니다.
- APP_VERSION을 0.9.10으로 동기화했습니다.

Modified files:
- lib/constants/app.ts: APP_VERSION을 0.9.10으로 갱신.
- components/admin/partnerMaster/PartnerMasterHeader.tsx: 상단 안내 문구 표시 및 외주공정관리 버튼 제거.
- components/admin/PartnerMasterSection.tsx: 협력업체 헤더 호출에서 외주공정관리 버튼 연결 제거.
- components/admin/partnerMaster/PartnerMasterFilters.tsx: 검색/유형/상태 필터 간격과 컬럼 폭 정리.
- components/admin/partnerMaster/PartnerMasterList.tsx: 목록 컬럼 폭 조정 및 텍스트 말줄임 처리 강화.
- components/admin/files/FileStorageSummary.tsx: 그래프 영역 확대 및 보관 기간 문구 적용.
- components/admin/files/FileListSection.tsx: 첨부파일 목록 영역 고정 높이 적용.
- components/admin/files/FileTrashSection.tsx: 휴지통 목록 영역 고정 높이 적용.
- app/admin/files/page.tsx: 탭 아래 목록 컨테이너 고정 높이 적용.
- lib/admin/adminFiles.presentation.ts: 저장소 정책 표시 문구를 보관 기준으로 정리.
- app/api/admin/files/snapshot/route.ts: DB 기반 저장소 요약 카드 문구를 보관 기간으로 정리.
- lib/i18n/ko/admin.ts: 저장소 보관 기간 i18n 문구 반영.
- lib/i18n/en/admin.ts: 저장소 보관 기간 i18n 문구 반영.
- components/admin/history/AdminHistoryList.tsx: 목록 높이 고정 및 중복 카운트 뱃지 제거.
- components/admin/history/AdminWorkOrderHistoryPage.tsx: 상단 검색 박스 중복 카운트 뱃지 제거.

Added files:
- 없음

Deleted files:
- 없음

Progress:
- 0.9.10 관리자 UI 1차 정리 범위는 반영했습니다.
- 현재 압축파일에는 node_modules가 없어 로컬 빌드 명령은 next 실행 파일 부재로 완료하지 못했습니다.

Next recommended version:
- 0.9.11 — 관리자 UX 2차 정리: 협력업체 모달 토글 스타일 통일, 환경설정 삭제 방식/파일 보관 기간 정책 정리, 용량 상태 기반 구조 적용.
