# 0.18.36 저장소관리 휴지통 시각 디테일 보정

## 목적
저장소관리 휴지통의 PC 화면 가시성, 유형 배지 색상 구분, 저장소 그래프 팔레트를 보정한다.

## 반영
- 저장소관리 화면은 `WorkspaceShell`의 fixed-md가 아닌 scroll 모드로 사용한다.
- 저장소관리 내부 wrapper의 하단 여백을 늘려 PC 100% 화면에서 휴지통 목록 접근성을 개선한다.
- `AppBadge`의 workorder/design/document/memo/file tone을 chart semantic token 기반으로 재조정한다.
- 파일 유형 도넛 그래프 색상을 파일 유형 label 기준으로 선택하도록 보정한다.
- 용량 원통 그래프의 채움색을 chart semantic token 기반으로 바꿔 테마 흐름과 더 자연스럽게 맞춘다.

## 제외
- DB/API/R2/첨부/메모/휴지통 복원·삭제·비우기 흐름은 변경하지 않는다.
- WorkspaceShell 컴포넌트 자체는 변경하지 않는다.
