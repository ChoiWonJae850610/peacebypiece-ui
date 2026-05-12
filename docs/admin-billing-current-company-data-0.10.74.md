# 0.10.74 고객관리자 요금제 화면 실제 데이터 연결

## 목적

고객관리자 환경설정의 요금제·결제 모달을 정적인 placeholder에서 현재 고객사 설정 응답 기반의 읽기 전용 화면으로 보정한다.

## 적용 범위

- `/admin/settings`
- `/api/admin/companies/current`
- 고객관리자 요금제·결제 모달

## 반영 내용

1. `/api/admin/companies/current` 응답에 `billing` 객체를 추가했다.
2. `billing` 객체는 현재 고객사 정보와 회사 파일 정책을 기준으로 생성한다.
3. 요금제·결제 모달은 열릴 때 `/api/admin/companies/current`를 조회한다.
4. 조회 성공 시 현재 고객사명, 저장공간 한도, 저장공간 경고 기준, 휴지통 포함 여부를 반영한다.
5. 조회 실패 시 기존 기본 정책 fallback을 유지한다.

## 현재 연결 기준

현재 실제 연결된 값은 다음과 같다.

- 현재 고객사명
- 고객사 파일 정책의 `storageLimitGb`
- 고객사 파일 정책의 `warningThresholdPercent`
- 고객사 파일 정책의 `includeTrashInUsage`

아직 실제 연결하지 않은 값은 다음과 같다.

- `company_plan_assignments`
- 실제 요금제 assignment
- 실제 결제 상태
- 실제 승인 멤버 수
- 실제 가격 override

## 후속 작업

0.10.75 이후에는 시스템관리자 요금제 변경 저장과 고객관리자 요금제 읽기 전용 화면을 같은 assignment repository 기준으로 통합한다.
