Version : 0.17.3
Summary : 원단·부자재 3패널 비율 조정
Description : 원단·부자재 발주 화면의 3패널 폭을 0.7:1:0.7에 가까운 비율로 조정했습니다. 좌우 패널은 최소 220px을 보장하면서 0.7fr로 확장되고, 가운데 발주 상세 패널은 최소 640px을 보장하면서 1fr로 확장되도록 gridTemplateColumns를 정리했습니다. DB schema, API 저장 로직, package 파일은 변경하지 않았습니다.

수정 파일 목록 :
- lib/constants/app.ts
- features/material-orders/MaterialOrderDraftEditor.tsx

추가 파일 목록 :
- 없음

삭제 파일 목록 :
- 없음
