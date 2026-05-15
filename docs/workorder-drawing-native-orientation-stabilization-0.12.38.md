# 0.12.38 직접 그리기 tablet 회전 안정화

## 목적

직접 그리기 full-screen editor가 tablet 세로/가로 전환 중 닫히는 현상을 줄이고, 회전 후에도 작업 상태가 유지되도록 보정한다.

## 변경 기준

- 직접 그리기 open 상태를 sessionStorage에 기록한다.
- responsive layout 전환으로 디자인 패널 컴포넌트가 다시 mount되어도 직접 그리기 editor를 다시 열 수 있게 한다.
- 회전 또는 breakpoint 전환 중 컴포넌트가 unmount될 경우 현재 canvas draft snapshot을 sessionStorage에 임시 저장한다.
- 다시 mount되면 draft snapshot을 복원한다.
- 사용자가 닫기 버튼으로 명시적으로 닫거나 저장을 완료하면 open flag와 draft snapshot을 제거한다.

## 유지한 정책

- backdrop click 닫기 방지 유지
- 브라우저 뒤로가기 방지 유지
- 저장 전 닫기 확인 유지
- 확대/축소, 손바닥 이동, 이미지 위에 그리기 제외
- 기존 PNG 저장 및 디자인 첨부 업로드 흐름 유지

## 확인 항목

1. tablet에서 직접 그리기 editor를 연다.
2. 선을 그린다.
3. 세로에서 가로, 가로에서 세로로 회전한다.
4. editor가 닫히지 않거나 즉시 복구되는지 확인한다.
5. 회전 전 그린 내용이 유지되는지 확인한다.
6. 닫기 버튼으로 닫으면 이후 다시 열 때 이전 draft가 남지 않는지 확인한다.
