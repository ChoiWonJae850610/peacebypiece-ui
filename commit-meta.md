Version : 0.17.64
Summary : 원단·부자재 DraftEditor 상태 로직을 훅으로 분리
Description : 원단·부자재 작성 화면의 데이터 로드, 선택 발주서 동기화, 상태 변경, 자재 라인 추가/삭제 로직을 useMaterialOrderDraftEditor 훅으로 분리하고 DraftEditor는 3패널 조립 중심으로 정리했습니다. 누적 테스트 항목은 pending-tests.md에 유지합니다.

수정 파일 목록 :
- lib/constants/app.ts
- features/material-orders/MaterialOrderDraftEditor.tsx
- pending-tests.md

추가 파일 목록 :
- features/material-orders/hooks/useMaterialOrderDraftEditor.ts

삭제 파일 목록 :
- 없음
