# 0.19.67 멤버 생애주기 DB·API 1차

## 목적

0.19.66에서 설계한 멤버 탈퇴 요청·탈퇴 완료 상태를 실제 DB/API 상태 모델에 반영한다. 이번 버전은 멤버관리 화면의 큰 UI 변경 전 단계이며, 기존 초대·승인·권한 저장 흐름은 유지한다.

## 반영 범위

- `company_members.status` 허용값에 `withdrawal_requested`, `withdrawn` 추가
- 탈퇴 요청/탈퇴 완료 처리자와 처리 시각 컬럼 추가
- full_reset.sql의 `company_members` 테이블 정의 동기화
- full_reset smoke test의 신규 컬럼 확인 항목 추가
- 멤버 repository에서 신규 상태를 조회/저장할 수 있도록 타입과 상태 정규화 확장
- `/api/admin/members` 목록 API가 신규 상태 필터를 받을 수 있도록 보정
- 멤버관리 화면 내부 상태 표시용으로 `withdrawal_requested`를 기존 UI 키 `withdrawalRequested`에 매핑

## 신규 DB 컬럼

| 컬럼 | 용도 |
| --- | --- |
| `withdrawal_requested_by` | 탈퇴 요청 처리자 또는 요청자를 기록할 사용자 ID |
| `withdrawal_requested_at` | 탈퇴 요청 상태가 된 시각 |
| `withdrawn_by` | 탈퇴 완료 처리자 사용자 ID |
| `withdrawn_at` | 탈퇴 완료 상태가 된 시각 |

## 신규 상태

| 상태 | 의미 | 접근/담당자 후보 |
| --- | --- | --- |
| `withdrawal_requested` | 일반 멤버가 탈퇴를 요청했거나 관리자가 탈퇴 요청 상태로 전환한 상태 | 기존 승인 멤버 접근 판정에서 제외 |
| `withdrawn` | 탈퇴 완료 상태 | 기존 승인 멤버 접근 판정에서 제외 |

## 유지한 것

- 멤버 권한 저장 구조 변경 없음
- 멤버 초대 링크 생성/취소 흐름 변경 없음
- 가입 신청 승인/거절 흐름 변경 없음
- 멤버 상세 모달 UI의 실제 탈퇴 버튼은 아직 추가하지 않음
- 고객사 관리자 목록 제외 정책 유지
- `approved` 상태만 업무 접근 가능한 기존 session scope 유지

## full_reset.sql 영향

- `company_members` table definition에 신규 컬럼과 status constraint를 추가했다.
- `company_members_withdrawal_status_idx` 인덱스를 추가했다.
- `full_reset_smoke_test.sql`에 신규 컬럼 존재 검증을 추가했다.

## 테스트 포인트

1. full_reset.sql 재실행 시 `company_members` 생성 오류가 없어야 한다.
2. migration 적용 시 기존 DB에 신규 컬럼과 status constraint가 추가되어야 한다.
3. 기존 approved/suspended 멤버 조회와 수정이 기존처럼 동작해야 한다.
4. API에서 `status=withdrawal_requested` 또는 `status=withdrawalRequested` 필터가 같은 결과를 반환해야 한다.
5. `withdrawal_requested`, `withdrawn` 상태 멤버는 기존 업무 접근 판정에서 approved로 취급되지 않아야 한다.
