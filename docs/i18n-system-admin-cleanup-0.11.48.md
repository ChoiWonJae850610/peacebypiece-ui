# 0.11.48 i18n 잔여 하드코딩 정리 2차

## 목적

시스템관리자 화면에서 직접 노출되던 주요 한국어 문구를 `system` i18n 리소스와 fallback 기반 translator 구조로 옮긴다.

## 반영 범위

- `lib/i18n/useSystemTranslation.ts` 추가
- `lib/i18n/index.ts`에서 system translation hook export
- `lib/i18n/ko/system.ts`, `lib/i18n/en/system.ts`에 system storage usage / overview 문구 추가
- `/system/storage-usage` 상단/요약/후보 목록 문구를 system i18n 기준으로 정리
- `SystemStoragePurgeCandidatesClient`의 버튼, empty, confirm, 결과 메시지, 정렬 라벨을 system translator 기반으로 정리
- `SystemStatsOverview`의 주요 section title, badge, summary 문구를 system i18n 리소스 기준으로 정리

## 변경하지 않은 범위

- system storage purge API
- R2 실제 삭제 / 재시도 로직
- 고객사 승인/거절 API
- audit log 저장 구조
- billing / standards / category rules domain logic
- DB schema

## 후속 후보

- `/system/audit-logs`의 감사 로그 설계/조회 문구 i18n 이동
- `/system/billing` preview 문구 i18n 이동
- `/system/standards/*` 기준정보 문구 i18n 이동
- 시스템 통계 데이터 mock label 자체를 presentation 계층으로 분리
