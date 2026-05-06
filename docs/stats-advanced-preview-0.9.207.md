# 0.9.207 — 고급 통계 preview / 요금제 잠금 기준

## 목적

0.9.207은 고객관리자 통계 화면에 고급 통계 preview와 요금제 잠금 기준을 먼저 노출하는 버전이다. 실제 API 권한 차단이나 고객사별 plan resolution은 이후 권한/feature gate 작업에서 연결한다.

## 이번 버전 범위

- `/admin/dashboard` 화면에 고급 통계 preview 섹션 추가
- 생산품유형, 협력업체 성과, 리오더 랭킹, 검수/불량 위험 카드 추가
- feature key를 코드 상수로 분리
- 요금제 노출 기준 메모 추가
- `APP_VERSION`을 0.9.207로 변경

## 추가 feature key

| feature key | 용도 | 노출 기준 |
| --- | --- | --- |
| `stats.category` | 생산품유형별 통계 | Standard 이상 |
| `stats.factory` | 협력업체/공장 성과 통계 | Standard 이상 |
| `stats.reorder` | 리오더 랭킹/리오더율 | Premium 이상 |
| `stats.quality` | 검수/불량 위험 통계 | Premium 이상 |
| `stats.storageAdvanced` | 저장소 고급 분석 | Premium 이상 |
| `stats.export` | 통계 export | Premium 또는 Enterprise |

## 구현 기준

현재 preview는 UI 잠금 표현만 담당한다. API에서 실제로 feature key를 검사하는 기능은 0.9.215 권한/feature flag 체계 설계 이후 구현한다.

## SQL DDL 필요 여부

불필요.

이번 버전은 UI preview와 feature key 상수 추가만 포함한다. 테이블, 컬럼, index, constraint는 변경하지 않는다.

## 전체 리셋 필요 여부

불필요.

`full_reset.sql` 실행이 필요하지 않다.

## 테스트 케이스

1. `/admin/dashboard` 접속 시 고급 통계 preview 섹션이 표시되는지 확인한다.
2. 생산품유형 TOP, 협력업체 성과, 리오더 랭킹, 검수/불량 위험 카드가 표시되는지 확인한다.
3. 각 카드에 feature key와 요금제 라벨이 표시되는지 확인한다.
4. 요금제 노출 기준 메모 4개가 표시되는지 확인한다.
5. 기존 Basic 통계 차트가 깨지지 않는지 확인한다.
6. `APP_VERSION`이 0.9.207인지 확인한다.

## 다음 버전 진행 기준

0.9.208에서는 Standard/Growth 통계 1차를 구현한다. 이때 실제 category/factory/reorder 데이터가 없으면 repository에서 계산 가능한 mock-free 집계와 empty state를 먼저 연결한다.
