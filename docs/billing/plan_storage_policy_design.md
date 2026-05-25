# PeaceByPiece 요금제 / 용량 정책 타입 설계

Version: 0.16.48
Status: 타입 설계
Scope: plan, company assignment, storage/member limit, override, usage snapshot
Non-goal: 결제 자동화, 실제 과금, R2 실시간 사용량 집계, DB migration

## 1. 설계 목적

시스템관리자가 고객사별 요금제와 저장용량을 조정할 수 있도록 정책 타입을 먼저 고정한다.
실제 결제 자동화는 후순위이며, 1차 목표는 운영자가 고객사별 plan과 override를 관리할 수 있는 기반을 만드는 것이다.

## 2. 핵심 모델

### plans

요금제 원본 정의다.

포함 기준:
- plan code
- 이름
- 월/연 단위
- 금액
- 포함 저장공간
- 포함 멤버 수
- 기능 플래그

### company_plan_assignments

고객사에 적용된 요금제다.

포함 기준:
- company_id
- plan_id
- status
- 적용 시작일
- 종료일
- override

### override

고객사별 예외 정책이다.

허용 예:
- 저장용량만 추가
- 멤버 수만 추가
- 금액만 별도 조정

주의:
- override가 항상 plan보다 우선하지 않는다.
- plan에서 override 허용 여부를 확인한 뒤 적용한다.

## 3. 저장용량 집계 원칙

1차 집계는 DB attachment metadata 기준을 우선한다.
R2 실시간 사용량 집계는 비용, 속도, 정확성 이슈가 있으므로 별도 작업에서 검토한다.

권장 snapshot source:
- `db_attachment_metadata`
- `r2_inventory`
- `manual`

## 4. 초과 정책

지금은 초과 여부 판단만 제공한다.
자동 차단, 업로드 제한, 결제 유도는 후순위다.

1차:
- 초과 여부 표시
- 시스템관리자에게 고객사별 사용량 노출
- 고객관리자에게 자기 회사 사용량 노출

후순위:
- 업로드 제한
- 초과 알림
- 자동 요금제 변경
- 결제 연동

## 5. 다음 패치 기준

0.9.66:
- plans
- company_plan_assignments
- storage_usage_snapshots
- 고객별 storage/member/price override SQL 추가

0.9.67:
- 시스템관리자 고객별 요금제 수정 UI skeleton 추가

0.9.68:
- 스토리지 사용량 집계 API skeleton 추가
