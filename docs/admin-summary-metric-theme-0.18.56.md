# 0.18.56 Admin summary metric theme normalization

## 목적
- 협력업체관리 요약 카드를 공통 `AdminSummaryMetricCards`로 연결했습니다.
- 멤버관리와 통계정보에서 이미 사용하는 공통 요약 카드도 동일한 theme token 기반 카드 shell을 사용하도록 정리했습니다.
- 저장소관리의 surface/border/shadow 분위기와 어긋나지 않도록 카드 배경, border, accent line, title/value/helper typography를 `pbp`/`admin-theme` semantic token 기반으로 맞췄습니다.

## 변경 범위
- `components/admin/common/AdminSummaryMetricCards.tsx`
- `components/admin/partnerMaster/PartnerMasterSummaryCards.tsx`
- `lib/constants/app.ts`

## 유지 사항
- 협력업체관리 요약 카드 데이터, 필터, 목록, 등록/수정 흐름은 변경하지 않았습니다.
- 멤버관리/통계정보는 공통 카드 shell의 시각 기준만 영향을 받으며, 데이터 계산과 동작 흐름은 변경하지 않았습니다.
- WorkspaceShell, DB/API/R2 흐름은 변경하지 않았습니다.
