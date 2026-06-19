# 0.23.88 시스템관리자 홈 실데이터 전환

## 목적

시스템관리자 홈에 표시되던 고정 예시 통계를 제거하고 현재 DB 집계를 표시한다.

## 집계 기준

- 고객사: `companies`
- 활성 고객사: `companies.is_active = true` 및 `onboarding_status = 'active'`
- 승인 멤버: `company_members.status = 'approved'`
- 작업지시서: 활성 `spec_sheets`
- 저장용량: 회사별 최신 `storage_usage_snapshots`
- 저장 한도·요금제: 최신 활성 `company_subscriptions`, 회사 override 우선
- 대기 초대: 만료되지 않은 `invitations.status = 'pending'`

## UI 정책

- 통계를 여러 대형 패널로 분산하지 않고 `운영 통계` 한 영역에 통합한다.
- 정상 상태 배지는 표시하지 않는다.
- 용량 70% 이상과 100% 이상만 주의·초과 배지로 표시한다.
- 데이터 없음, 로딩, 오류 상태를 명시적으로 표시한다.
- 통계 생성 시각과 수동 새로고침을 제공한다.
