Version :
0.9.22418

Summary :
고객관리자와 저장소 화면 i18n 잔여 문구 정리 2차

Description :
고객관리자 메인 카드와 운영 메뉴, API 준비 영역을 i18n 기반 client presentation 컴포넌트로 분리했다. 운영 대시보드 상태/우선 처리 label과 저장소 요약 placeholder, 휴지통 상세 모달의 작업지시서 단계 및 첨부/메모 개수 표시가 현재 locale을 따르도록 보정했다.

수정 파일 목록 :
- app/admin/page.tsx
- components/admin/dashboard/AdminOperationsDashboard.tsx
- components/admin/files/FileStorageSummary.tsx
- components/admin/files/fileTrashSectionModals.tsx
- components/admin/files/fileTrashSectionPresentation.tsx
- lib/i18n/en/admin.ts
- lib/i18n/ko/admin.ts
- lib/constants/app.ts

추가 파일 목록 :
- components/admin/dashboard/AdminConsoleSections.tsx
- docs/admin-worker-i18n-hardcoding-sweep-0.9.22418.md
- commit-meta.md

삭제 파일 목록 :
없음
