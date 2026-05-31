# 0.18.71 통계정보 그래프 카드 토글 공통화

## 목적
통계정보 생산 구성 그래프 카드 안에서 사용하던 대분류/품목 전환 토글을 별도 컴포넌트로 분리해 그래프 카드 내부 액션 영역의 표현 기준을 정리한다.

## 변경 범위
- `components/admin/dashboard/AdminStatsInlineToggle.tsx` 추가
- `components/admin/dashboard/AdminStatsDashboard.tsx`의 생산 구성 카드 내부 토글을 공통 컴포넌트로 교체
- `lib/constants/app.ts`의 `APP_VERSION`을 `0.18.71`로 증가

## 유지 범위
- 통계 계산 로직 변경 없음
- 탭 전환 흐름 변경 없음
- 기간 선택/적용 흐름 변경 없음
- DB/API 조회 흐름 변경 없음
- WorkspaceShell 스크롤 구조 변경 없음
