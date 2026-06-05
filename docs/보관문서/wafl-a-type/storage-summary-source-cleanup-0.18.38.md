# 0.18.38 저장소관리 요약 카드 소스 정리

## 목적

0.18.33~0.18.36에서 안정화한 저장소관리 요약 카드의 컨테이너 폭 기준 반응형 구조를 유지하면서, `FileStorageSummary.tsx`에 몰려 있던 표시 컴포넌트와 layout 계산 책임을 분리했다.

## 정리 내용

- `FileStorageSummary.tsx`는 컨테이너 폭 측정, layout mode 산정, 카드 조합만 담당하도록 축소
- `summary/storageSummaryLayout.ts` 추가
  - `getStorageSummaryLayoutMode`
  - `getStorageSummaryGridStyle`
  - `getFileTypeCardGridStyle`
- `summary/PlanUsageCard.tsx` 추가
- `summary/FileOperationsCard.tsx` 추가
- `summary/FileTypeChartCard.tsx` 추가
- `summary/StorageCylinder.tsx` 추가

## 유지한 기준

- 저장소 요약 카드의 container width 기준 반응형 유지
- 1120px 이상: 3열
- 720px 이상 1120px 미만: 2열 + 파일 유형 전체 폭
- 720px 미만: 1열
- chart palette / badge tone / WorkspaceShell 구조 변경 없음
- DB/API/R2/휴지통 복원·삭제·비우기 흐름 변경 없음

## 후속 방향

- 저장소관리 결과가 안정되면 협력업체관리 목록에 container width 기준 responsive list/table 구조를 적용한다.
