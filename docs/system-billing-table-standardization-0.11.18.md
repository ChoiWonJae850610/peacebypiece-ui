# 0.11.18 시스템 요금제 화면 테이블 표준화

## 목적

시스템관리자 요금제/용량 관리 화면의 고객사 목록과 요금제 수정 preview 필드를 `AdminTable` 공통 컴포넌트 기준으로 정리한다.

## 변경 범위

- `components/system/billing/SystemCompanyPlanSkeleton.tsx`
  - 고객사 목록을 `AdminTable`로 전환
  - 요금제 수정 preview 필드 목록을 `AdminTable`로 전환
  - 저장공간/멤버 상태 라벨을 `AdminStatusBadge`로 유지하며 tone을 명시
- `lib/constants/app.ts`
  - `APP_VERSION`을 `0.11.18`로 갱신

## 제외 범위

- billing policy 계산 로직 변경 없음
- 고객사 요금제 저장 API 추가 없음
- DB schema 변경 없음
- 결제 자동화/업로드 제한 연결 없음

## 확인 지점

- `/system/billing` 고객사 목록 표시
- `/system/billing` 요금제 수정 preview 필드 표시
- 저장공간/멤버 위험 라벨 표시
- 기존 비활성 저장 버튼 유지
