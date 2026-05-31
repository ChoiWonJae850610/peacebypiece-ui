# 0.18.62 통계정보 기간 액션 버튼 보정

## 목적
통계정보 기간 분석 영역의 초기화/적용 아이콘 버튼이 빈 원형 버튼처럼 보이는 문제를 보정한다.

## 반영 내용
- 초기화 버튼을 저장소관리 휴지통의 icon action button 계열과 같은 `variant="icon"` 기준으로 정리했다.
- 적용 버튼은 활성 상태에서 `primary`, 비활성 상태에서 `icon` 계열로 표시되게 조정했다.
- RotateCcw/Check 아이콘에 `text-current`와 stroke width를 명시해 버튼 안에서 아이콘이 보이도록 보정했다.
- `title`, `aria-label`, `sr-only` 텍스트는 유지했다.

## 변경하지 않은 내용
- 통계 데이터 계산
- 기간 선택/적용 흐름
- 탭 전환
- WorkspaceShell 스크롤 구조
- DB/API 통계 조회 흐름
