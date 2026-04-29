# commit-meta

## Version
- 현재 기준 원본: 0.6.6430
- 다음 결과 버전: 0.6.6431
- 변경 목표: 관리자 UI 최종 잔여 점검

## Summary
관리자 UI 최종 잔여 톤 정리

## Description
관리자 공통 Shell, Sidebar, Topbar, FilterBar, Table, 저장소 관리 및 대시보드 일부 카드의 폭, 간격, 라운드, 테이블 행 높이 기준을 통일하고 앱 버전을 0.6.6431로 갱신함.

## 수정 파일 목록
- lib/constants/app.ts: APP_VERSION을 0.6.6431로 동기화.
- components/admin/layout/AdminShell.tsx: 관리자 본문 최대 폭과 본문 영역 간격 기준 정리.
- components/admin/layout/AdminSidebar.tsx: 좌측 패널 폭, 내부 카드 패딩, 메뉴 간격과 아이콘 크기 기준 정리.
- components/admin/layout/AdminTopbar.tsx: 상단바 라운드와 패딩, 제목 크기 기준 정리.
- components/admin/common/AdminActionBar.tsx: 제목/액션 영역 간격과 액션 정렬 기준 정리.
- components/admin/common/AdminFilterBar.tsx: 필터바 배경, 패딩, 내부 그림자 기준 정리.
- components/admin/common/AdminTable.tsx: 테이블 라운드, 배경, 헤더/행 높이 기준 정리.
- app/admin/files/page.tsx: 저장소 관리 외곽 카드 라운드 및 필터바 배경 중복 기준 정리.
- components/admin/files/FileListSection.tsx: 첨부파일 목록 카드 라운드, 패딩, 테이블 상단 간격 기준 정리.
- components/admin/files/FileTrashSection.tsx: 휴지통 카드 라운드, 패딩, 테이블 상단 간격 기준 정리.
- components/admin/files/FileStorageSummary.tsx: 저장소 요약 카드와 내부 사용량 카드 라운드 기준 정리.
- components/admin/dashboard/AdminOperationsDashboard.tsx: 운영 통계 내부 카드 라운드 기준 정리.
- components/admin/dashboard/AdminStatsDashboard.tsx: 통계 차트 카드 라운드 기준 정리.

## 추가 파일 목록
- commit-meta.md: 모바일 최소 응답 모드용 작업 상세 기록 추가.

## 삭제 파일 목록
- 없음

## 작업 상세 내용
- 관리자 공통 레이아웃의 좌측 패널과 본문 폭을 더 일관되게 조정.
- 관리자 메뉴 버튼의 높이와 아이콘 크기를 줄여 좌측 패널 밀도를 정리.
- 상단바, 필터바, 테이블, 저장소 카드, 대시보드 카드의 라운드/패딩 기준을 22~30px 범위로 통일.
- 기능 로직, DB 연결, 권한/워크플로우 로직은 변경하지 않음.
- package.json 및 package-lock.json은 수정하지 않음.
