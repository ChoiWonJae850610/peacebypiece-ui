# 요금제/저장공간 UI 1차 — 0.20.06

## 목적

0.20.05에서 추가한 `company_subscriptions` DB/API 기준을 고객사 관리자 환경설정 화면에 1차로 연결한다. 이 단계는 실제 결제/PG 연동이나 업로드 제한을 구현하지 않고, 현재 고객사의 운영 상태를 읽기 전용으로 표시한다.

## 연결 위치

- 화면: `/workspace/settings`
- 메뉴 카드: `요금제·저장공간`
- API: `GET /api/admin/subscription`

## 표시 항목

- 현재 요금제: `planLabel`, `planCode`
- 구독 상태: `statusLabel`
- 저장공간 사용량: `storageUsedBytes / storageLimitBytes`
- 저장공간 사용률: `storageUsageRatio`
- 멤버 사용량: `activeMemberCount / memberLimit`
- 무료체험 종료일: `trialEndsAt`
- 최근 갱신: `updatedAt`
- 데이터 출처: `company_subscriptions` 또는 `company_fallback`

## 상태 표시 기준

- `active`, `trialing`: 정상/성공 톤
- `past_due`, `payment_failed`, `cancel_scheduled`: 주의 톤
- `canceled`, `suspended`: 위험 톤
- 저장공간 사용률 80% 이상: 주의 톤
- 저장공간 사용률 100% 이상: 위험 톤

## 실패 처리

`GET /api/admin/subscription` 조회에 실패해도 환경설정 전체 화면을 막지 않는다. 기존 `/api/admin/companies/current`의 요금제 요약값을 보조로 보여주고, 회사 구독 데이터 조회 실패 안내 카드를 표시한다.

## 자동테스트 기준

`tests/e2e/workspace-policy-settings.spec.mjs`에서 환경설정 화면 진입 후 `요금제·저장공간` 카드를 열고 다음 문구를 검증한다.

- `Flow`
- `정상 사용 중`
- `저장공간 사용량`
- `멤버 사용량`

## 후속 작업

0.20.07에서는 저장소 사용량 제한 설계를 별도 문서로 확정한다. 0.20.08에서는 파일 업로드 전 저장공간 제한 guard를 연결한다.
