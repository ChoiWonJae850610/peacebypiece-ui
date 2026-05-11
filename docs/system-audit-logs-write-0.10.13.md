# 시스템 감사 로그 쓰기 연결 1차 — 0.10.13

## 목표

0.10.13에서는 감사 로그의 첫 실제 쓰기 지점을 시스템관리자 저장소 실제 삭제 처리로 제한한다.

## 연결 지점

- API: `POST /api/system/storage-usage/purge`
- 이벤트 코드: `storage.purge_run`
- 대상 유형: `storage`
- 행위자 역할: `system_admin`
- 쓰기 함수: `createSystemAuditLogSafe`
- 변환 함수: `buildSystemStoragePurgeAuditLog`

## 기록 내용

`metadata`에는 다음 값을 구조화해서 남긴다.

- `mode`
- `requestedCount`
- `candidateCount`
- `purgedCount`
- `failedCount`
- `itemCount`
- `items`
  - `trashItemId`
  - `attachmentId`
  - `status`
  - `hasStorageKey`
  - `hasThumbnailKey`
  - `errorMessage`

## 설계 판단

- 감사 로그 쓰기 실패가 실제 삭제 처리를 막지 않도록 safe wrapper를 사용한다.
- 실제 R2 key 원문은 화면 기본 노출 대상이 아니므로 metadata에는 보유 여부만 요약한다.
- 이번 버전에서는 고객사, 초대, 요금제·용량, 멤버 권한 변경 쓰기 연결은 하지 않는다.
- 기존 작업지시서/저장소/휴지통/R2 purge 처리 로직은 변경하지 않고, purge API의 결과 이후 감사 로그만 추가 기록한다.

## 테스트

1. `npm run build`
2. `/system/storage-usage`에서 실제 삭제 후보가 있으면 삭제 처리 실행
3. `/system/audit-logs`에서 `storage.purge_run` 로그 확인
4. 후보가 없으면 API를 직접 호출하거나 수동 테스트 데이터로 읽기 화면만 확인

