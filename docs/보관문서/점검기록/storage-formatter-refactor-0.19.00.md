# 0.19.00 저장소/용량 formatter 공통화 1차

## 목적

파일 크기와 저장소 사용량 표시에서 중복으로 존재하던 bytes → KB/MB/GB 변환 로직을 공통 formatter 기준으로 점진 정리한다.

## 실제 코드 변경 범위

- `lib/utils/formatters.ts`
  - `formatPbpFixedGigabytes` 추가
- `lib/admin/adminFiles.serverActions.ts`
  - 로컬 `formatBytes` 구현을 `formatPbpBinaryBytes` 호출로 교체
- `lib/system/storagePurgeCandidates.ts`
  - 로컬 `formatBytes` 구현을 `formatPbpBinaryBytes` 호출로 교체
- `components/admin/files/summary/PlanUsageCard.tsx`
  - 사용량 GB 고정 표시 계산을 공통 helper로 교체
- `lib/admin/stats/dashboardPresentation.ts`
  - 통계 저장소 GB 표시를 공통 helper로 교체

## 의도적으로 바꾸지 않은 것

- DB schema / seed / test SQL
- API route 동작
- R2 업로드·다운로드·삭제·purge 흐름
- 저장소 삭제/복원/비우기 버튼 동작
- 저장소 목록 정렬/선택/필터 동작
- 통계 계산식
- 요금제 용량 정책

## 화면 테스트 위치

1. `/workspace/storage`
2. `/workspace/stats`
3. `/system/storage-usage`

## 확인할 것

- 저장소관리의 요금제 용량 카드에서 `사용량 / 한도` 의미가 유지되는지
- 저장소관리 파일 목록의 파일 크기 표시가 비정상적으로 커지거나 작아지지 않는지
- 휴지통/삭제 요청 대상의 크기 표시가 유지되는지
- 통계정보의 저장소 사용량 카드/그래프 숫자 의미가 유지되는지
- 시스템 저장소 사용량 화면의 삭제 후보 크기 표시가 유지되는지

## 바뀌면 안 되는 것

- 파일 목록 개수
- 삭제/복원/비우기 버튼 노출과 동작
- R2 purge 요청/처리 흐름
- 저장소 사용률 퍼센트 의미
- 통계 계산식
- companyId 기준 조회 범위

## 허용되는 변화

- 내부 formatter 호출 위치
- 동일 숫자를 만드는 계산식의 공통화

이번 패치에서는 의도적으로 표시 포맷을 대대적으로 바꾸지 않는다. 화면상 숫자 의미가 달라지면 리팩토링 실패로 본다.
