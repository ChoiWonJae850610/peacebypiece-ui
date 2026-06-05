# 0.19.15 Toast lucide icon 보정과 멤버 초대 action button 재정리

## 목적

0.19.14에서 적용한 icon-first toast와 멤버 초대 목록 버튼이 실제 화면에서 명확하지 않은 문제를 보정한다.

## Toast 보정

- 이모지 기반 상태 아이콘을 lucide icon 기반으로 교체한다.
- loading은 `LoaderCircle` 회전 아이콘으로 표시한다.
- success / info / warning / danger는 고정 icon box 안에 표시한다.
- toast 내부 grid를 `icon 영역 + message 영역`으로 분리해 아이콘과 문구가 겹치지 않게 한다.
- 배경은 theme surface를 유지하고 상태 구분은 icon과 border tone 중심으로 둔다.

## 멤버 초대 목록 보정

- 초대 링크는 전체 URL 대신 끝 8자리 suffix만 표시한다.
- 복사 버튼은 `Copy + 복사` 형태의 compact action button으로 표시한다.
- 취소 버튼은 `Ban + 취소` 형태의 compact destructive action button으로 표시한다.
- 취소됨 / 만료됨 / 사용됨 상태에서는 복사와 취소를 비활성화한다.
- 버튼 의미가 아이콘만으로 추측되지 않도록 PC 테이블에서는 짧은 텍스트를 함께 노출한다.

## 변경하지 않은 것

- 멤버 초대 생성/취소 API
- 멤버 승인/권한 저장
- 저장소 삭제/복원/비우기
- 작업지시서 상태/권한/첨부/메모/R2 흐름
- 원단·부자재 계산식과 상태 변경
- DB/API/R2 흐름

## 테스트 위치

- `/workspace/members`
- `/workspace/workorders`
- `/workspace/material-orders`
- `/workspace/partners`
- `/workspace/files`

## 확인할 것

- Toast 아이콘이 메시지와 겹치지 않는지
- loading toast가 회전 아이콘과 함께 표시되는지
- success/error/warning/info toast가 색 면적이 아니라 icon 중심으로 구분되는지
- 멤버 초대 목록의 복사/취소 버튼 의미가 바로 보이는지
- 초대 링크가 전체 URL이 아닌 suffix로 표시되는지
- 사용할 수 없는 초대에서 복사/취소 버튼이 비활성화되는지
