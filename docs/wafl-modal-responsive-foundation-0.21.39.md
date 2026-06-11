# WAFL modal responsive foundation 0.21.39

## 목표

발주서 UI 확정 전에 PC, 태블릿, 모바일에서 공통으로 보이는 모달 내부 박스 계열을 먼저 고정한다.
0.21.38이 Add, Empty, Upload dashed box를 정리했다면, 0.21.39는 InfoBox, summary card, field row, policy notice 계열을 정리한다.

## 적용 범위

- 멤버 권한 관리 모달
- 개인 설정 모달
- 저장소 휴지통 상세/확인 모달
- 공통 WaflInfoBox density 기준

## 기준

- 모달 안의 안내 박스는 기본적으로 `shape="control"`을 사용한다.
- 의미 색상은 직접 `border/bg/text` 조합이 아니라 `tone`과 `state`로 표현한다.
- 모바일/태블릿에서 높이와 여백이 과하게 커지지 않도록 `density`를 명시한다.
- summary card와 field card는 surface radius가 아니라 control radius를 우선한다.

## 예외

- 테마 색상 preview dot은 실제 색상 점 의미가 있으므로 `rounded-full` 예외로 유지한다.
- 휴지통 진행 단계 bar는 실제 progress bar 의미가 있으므로 `rounded-full` 예외로 유지한다.
