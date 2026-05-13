Version :
0.11.48

Summary :
시스템관리자 화면 i18n 하드코딩 정리 2차

Description :
시스템관리자 저장소 실제 삭제 후보 화면과 시스템 통계 overview의 주요 노출 문구를 system i18n 리소스와 fallback translator 구조로 이동했다. system 전용 translation hook을 추가하고, 저장소 purge 결과 메시지와 정렬 라벨도 i18n 기반으로 정리했다.

수정 파일 목록 :
- app/system/storage-usage/page.tsx
- components/system/storage/SystemStoragePurgeCandidatesClient.tsx
- components/system/SystemStatsOverview.tsx
- lib/system/storagePurgePresentation.ts
- lib/i18n/index.ts
- lib/i18n/ko/system.ts
- lib/i18n/en/system.ts
- lib/constants/app.ts

추가 파일 목록 :
- lib/i18n/useSystemTranslation.ts
- docs/i18n-system-admin-cleanup-0.11.48.md

삭제 파일 목록 :
없음
