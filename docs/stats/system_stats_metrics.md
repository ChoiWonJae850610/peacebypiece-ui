# PeaceByPiece 시스템관리자 통계 보완

Version: 0.16.48
Status: metric skeleton
Scope: 시스템관리자 통계 항목 확장
Non-goal: 실제 DB 통계 쿼리, 차트 UI, 결제 자동화 통계

## 1. 이번 버전의 목적

0.9.69의 공통 stats 구조와 0.9.70의 고객관리자 통계 보강에 이어 시스템관리자 통계 항목을 보강한다.
화면에서 직접 통계를 계산하지 않고 repository/selector가 만든 metric summary만 표시하는 구조를 유지한다.

## 2. 시스템관리자 통계 항목

### 고객사 수

- 전체 고객사
- 활성 고객사
- 고객사 활성 비율

### 저장공간

- 전체 저장용량 사용량
- 고객사별 저장용량 사용량
- 미집계 고객사

기준:
- `storage_usage_snapshots`
- `latest_storage_usage_snapshots`
- 1차는 DB attachment metadata 기준 snapshot

### 요금제

- Starter 고객 수
- Team 고객 수
- Business 고객 수

기준:
- `company_plan_assignments`
- active assignment 우선

### 초대

- 생성된 초대 수
- 수락된 초대 수
- 대기중 초대 수
- 만료/취소 초대 수
- 초대 수락률

기준:
- `invitations.status`
- `created_at`
- `accepted_at`

## 3. 다음 작업 후보

0.9.72 이후:
- 시스템관리자 콘솔과 실제 stats API 연결
- 고객관리자 통계 화면과 admin stats API 연결
- DB repository 실제 query 적용
- 통계 카드 UI 정리
