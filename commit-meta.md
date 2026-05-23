Version : 0.15.90.3
Summary : 작업지시서 반려 사유 저장 누락 보정
Description : 반려 사유 모달에서 입력한 사유가 state patch API를 통해 DB에 저장되지 않던 문제를 수정했습니다. state patch 저장 요청과 응답에 rejection_reason, rejected_at, rejected_by_user_id, rejected_by_name 값을 포함해 반려 사유 안내가 실제 DB 저장값을 기준으로 표시되도록 보정했습니다.
수정 파일 목록 :
- lib/constants/app.ts
- lib/workorder/api/workOrderRouteHandlers.ts
추가 파일 목록 :
없음
삭제 파일 목록 :
없음
